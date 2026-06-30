import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyRawBody from 'fastify-raw-body';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({ logger: true });

// Register CORS
fastify.register(cors, {
  origin: '*', // For demo purposes, allow all. In production, set to your Vercel URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});

// Register raw body for Stripe webhook
fastify.register(fastifyRawBody, {
  field: 'rawBody',
  global: true, // Fixes "No webhook payload provided"
  encoding: 'utf8',
  runFirst: true,
});

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Initialize Stripe
const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2026-06-24.dahlia' as any }) : null;

// Middleware to verify Supabase JWT
fastify.addHook('onRequest', async (request, reply) => {
  // Exclude preflight requests and webhook
  if (request.method === 'OPTIONS') return;
  if (request.url === '/stripe/webhook') return;
  // Skip auth for healthcheck
  if (request.url === '/' || request.url === '/health') return;

  if (!supabase) {
    return reply.status(500).send({ error: 'Supabase is not configured on the backend.' });
  }

  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return reply.status(401).send({ error: 'Missing Authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }

  // Fetch profile to get is_premium status
  const sbClient = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: profile } = await sbClient
    .from('profiles')
    .select('is_premium')
    .eq('id', user.id)
    .single();

  // Attach user, profile, and an authenticated Supabase client to request
  (request as any).user = user;
  (request as any).isPremium = profile?.is_premium || false;
  (request as any).sbClient = sbClient;
});

// Routes
fastify.get('/health', async () => {
  return { status: 'ok', message: 'StreakOS API is running!' };
});

fastify.get('/habits', async (request, reply) => {
  if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' });
  const user = (request as any).user;
  const sbClient = (request as any).sbClient;

  const { data, error } = await sbClient
    .from('habits')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    return reply.status(500).send({ error: error.message });
  }

  return { habits: data };
});

fastify.post('/habits', async (request, reply) => {
  if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' });
  const user = (request as any).user;
  const isPremium = (request as any).isPremium;
  const sbClient = (request as any).sbClient;
  
  // Enforce habit limits for free users
  if (!isPremium) {
    const { count } = await sbClient
      .from('habits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
      
    if (count !== null && count >= 3) {
      return reply.status(403).send({ error: 'FREE_LIMIT_REACHED', message: 'You have reached the maximum of 3 habits on the free plan.' });
    }
  }

  const { name, icon, color, frequency } = request.body as any;

  const { data, error } = await sbClient
    .from('habits')
    .insert([
      { user_id: user.id, name, icon, color, frequency }
    ])
    .select()
    .single();

  if (error) {
    return reply.status(500).send({ error: error.message });
  }

  return { habit: data };
});

fastify.post('/habits/:id/log', async (request, reply) => {
  if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' });
  const user = (request as any).user;
  const sbClient = (request as any).sbClient;
  const { id } = request.params as any;

  // Check if already logged today
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999);

  const { data: existingLog, error: checkError } = await sbClient
    .from('habit_logs')
    .select('id')
    .eq('habit_id', id)
    .eq('user_id', user.id)
    .gte('completed_at', startOfDay.toISOString())
    .lte('completed_at', endOfDay.toISOString())
    .maybeSingle();

  if (checkError) return reply.status(500).send({ error: checkError.message });
  if (existingLog) return reply.status(400).send({ error: 'Habit already completed today' });

  // Insert log
  const { data: log, error: logError } = await sbClient
    .from('habit_logs')
    .insert([{ habit_id: id, user_id: user.id }])
    .select()
    .single();

  if (logError) return reply.status(500).send({ error: logError.message });

  // Increment streak
  const { data: habit } = await sbClient
    .from('habits')
    .select('streak_count')
    .eq('id', id)
    .single();

  if (habit) {
    await sbClient
      .from('habits')
      .update({ streak_count: (habit.streak_count || 0) + 1 })
      .eq('id', id);
  }

  return { log, success: true };
});

fastify.get('/habits/:id/logs', async (request, reply) => {
  if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' });
  const user = (request as any).user;
  const sbClient = (request as any).sbClient;
  const { id } = request.params as any;

  const { data, error } = await sbClient
    .from('habit_logs')
    .select('*')
    .eq('habit_id', id)
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false });

  if (error) return reply.status(500).send({ error: error.message });
  return { logs: data };
});

fastify.get('/logs', async (request, reply) => {
  if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' });
  const user = (request as any).user;
  const sbClient = (request as any).sbClient;

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 7);

  const { data, error } = await sbClient
    .from('habit_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('completed_at', pastDate.toISOString());

  if (error) return reply.status(500).send({ error: error.message });
  return { logs: data };
});

fastify.delete('/habits/:id', async (request, reply) => {
  if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' });
  const user = (request as any).user;
  const sbClient = (request as any).sbClient;
  const { id } = request.params as any;

  const { error } = await sbClient
    .from('habits')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return reply.status(500).send({ error: error.message });
  return { success: true };
});

fastify.post('/stripe/create-checkout-session', async (request, reply) => {
  if (!stripe) return reply.status(500).send({ error: 'Stripe not configured' });
  const user = (request as any).user;
  const priceId = process.env.STRIPE_PRICE_ID;
  
  if (!priceId) return reply.status(500).send({ error: 'Stripe price ID missing' });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `http://localhost:5173/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/paywall`,
      client_reference_id: user.id,
    });

    return { url: session.url };
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({ error: err.message });
  }
});

fastify.post('/stripe/verify-session', async (request, reply) => {
  if (!stripe) return reply.status(500).send({ error: 'Not configured' });
  const { sessionId } = request.body as any;
  if (!sessionId) return reply.status(400).send({ error: 'Session ID is required' });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return reply.status(500).send({ error: 'Service role key not configured' });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid' && session.client_reference_id) {
      // Use admin client with service role key to BYPASS RLS
      const adminSupabase = createClient(process.env.SUPABASE_URL || '', serviceRoleKey);
      const { error } = await adminSupabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', session.client_reference_id);

      if (error) {
        fastify.log.error(`verify-session DB error: ${error.message}`);
        return reply.status(500).send({ error: error.message });
      }

      fastify.log.info(`Instantly upgraded user ${session.client_reference_id} to PREMIUM via verify-session`);
      return { success: true };
    }
    return { success: false };
  } catch (err: any) {
    fastify.log.error(err);
    return reply.status(500).send({ error: err.message });
  }
});

fastify.post('/stripe/webhook', { config: { rawBody: true } }, async (request, reply) => {
  const sig = request.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret || !stripe) return reply.status(500).send({ error: 'Webhook not configured' });

  let event;
  try {
    event = stripe.webhooks.constructEvent((request as any).rawBody, sig as string, endpointSecret);
  } catch (err: any) {
    fastify.log.error(`Webhook Error: ${err.message}`);
    return reply.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    
    // We need SUPABASE_SERVICE_ROLE_KEY to bypass RLS and update the user's premium status securely.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (userId && serviceRoleKey) {
      const adminSupabase = createClient(process.env.SUPABASE_URL || '', serviceRoleKey);
      
      const { error } = await adminSupabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', userId);

      if (error) {
        fastify.log.error(`Supabase Webhook Update Error: ${error.message}`);
      } else {
        fastify.log.info(`Successfully upgraded user ${userId} to PREMIUM!`);
      }
    } else {
      fastify.log.error('Missing userId or Service Role Key in webhook processing');
    }
  }

  return { received: true };
});

// For Vercel Serverless Functions
export default async function handler(req: any, res: any) {
  await fastify.ready();
  fastify.server.emit('request', req, res);
}

// Local dev server
if (require.main === module) {
  const start = async () => {
    try {
      const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
      await fastify.listen({ port, host: '0.0.0.0' });
      console.log(`Server listening on http://localhost:${port}`);
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  };
  start();
}
