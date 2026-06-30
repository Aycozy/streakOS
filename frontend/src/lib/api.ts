import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'An error occurred during the API request');
  }

  return response.json();
}

export const api = {
  getHabits: () => fetchWithAuth('/habits'),
  createHabit: (data: { name: string; icon?: string; color?: string; frequency?: string }) => 
    fetchWithAuth('/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logHabit: (id: string) => fetchWithAuth(`/habits/${id}/log`, { method: 'POST' }),
  getLogs: (id: string) => fetchWithAuth(`/habits/${id}/logs`),
  getAllLogs: () => fetchWithAuth('/logs'),
  deleteHabit: (id: string) => fetchWithAuth(`/habits/${id}`, { method: 'DELETE' }),
  getProfile: () => fetchWithAuth('/profile'),
  createCheckoutSession: () => fetchWithAuth('/stripe/create-checkout-session', { method: 'POST', body: JSON.stringify({}) }),
  verifySession: (sessionId: string) => fetchWithAuth('/stripe/verify-session', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  }),
};
