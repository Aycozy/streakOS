# 🔥 StreakOS — Habit Tracking Redefined

> Build powerful habits. Track your streaks. Unlock your potential.

StreakOS is a full-stack, production-ready habit tracking web application with a premium subscription model powered by Stripe. It helps users build consistent daily habits through streak tracking, rich analytics, achievement badges, and daily reminders — with a compelling freemium paywall to unlock advanced features.

---

## ✨ Features

### Free Tier
- ✅ Create up to **3 habits** with daily tracking
- 🔥 Live **streak counter** per habit
- 📊 **Weekly completion chart** (bar chart)
- 🏆 **Achievements & Badges** (8 milestones)
- 🔔 **Daily browser reminders** with custom time
- 📱 **Mobile-first** design with bottom navigation

### Pro Tier (Stripe-powered)
- ♾️ **Unlimited habits**
- 🎨 **Custom habit colors**
- 📅 **30-day heatmap calendar** (GitHub-style)
- 📈 **Per-habit completion rate bars** (animated)
- 🥇 **Streak leaderboard** across all habits
- 💡 **Smart summary panel** (top habit, monthly stats)

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **React Router v7** | Client-side routing |
| **TanStack Query v5** | Server state & caching |
| **Recharts** | Weekly completion bar chart |
| **Lucide React** | Icon library |
| **Vanilla CSS** | Custom design system with glassmorphism |
| **Google Fonts (Outfit)** | Typography |

### Backend
| Technology | Purpose |
|---|---|
| **Fastify v5** | High-performance Node.js API server |
| **TypeScript** | Type safety |
| **Stripe SDK** | Subscription checkout & webhooks |
| **fastify-raw-body** | Raw body parsing for Stripe webhook verification |

### Database & Auth
| Technology | Purpose |
|---|---|
| **Supabase** | PostgreSQL database + Auth (JWT) |
| **Row Level Security (RLS)** | Per-user data isolation |
| **Supabase Service Role Key** | Secure server-side DB writes (webhook upgrades) |

### Payments
| Technology | Purpose |
|---|---|
| **Stripe Checkout** | Hosted payment page |
| **Stripe Webhooks** | Real-time payment event processing |
| **Stripe CLI** | Local webhook forwarding during development |

---

## 🏗️ Architecture

```
StreakOS/
├── frontend/          # Vite + React SPA
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── Achievements.tsx      # Badge grid (8 milestones)
│   │   │   ├── BottomNav.tsx         # Mobile navigation bar
│   │   │   ├── CompletionRateBar.tsx # Animated habit progress bars
│   │   │   ├── HeatmapCalendar.tsx   # 30-day GitHub-style heatmap
│   │   │   ├── ProStats.tsx          # Premium stats with blur paywall
│   │   │   └── WeeklyChart.tsx       # 7-day bar chart
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx         # Main habit tracking page
│   │   │   ├── Analytics.tsx         # Advanced analytics (Pro)
│   │   │   ├── Paywall.tsx           # Stripe upgrade page
│   │   │   ├── Settings.tsx          # Profile & reminders
│   │   │   ├── Login.tsx             # Auth page
│   │   │   └── Onboarding.tsx        # New user flow
│   │   └── lib/
│   │       ├── api.ts                # Fastify API client
│   │       ├── supabase.ts           # Supabase client
│   │       └── notifications.ts     # Browser push notification scheduler
│   └── public/
│
├── backend/           # Fastify API (BFF pattern)
│   └── src/
│       └── index.ts   # All routes + Stripe webhook handler
│
└── supabase-schema.sql  # Full DB schema with RLS policies
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account
- [Stripe CLI](https://stripe.com/docs/stripe-cli) (for local webhook testing)

### 1. Clone the repository
```bash
git clone https://github.com/Aycozy/streakOS.git
cd streakOS
```

### 2. Set up the database
Run `supabase-schema.sql` in your Supabase SQL editor to create all tables, RLS policies, and triggers.

### 3. Configure environment variables

**Backend** — create `backend/.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Frontend** — create `frontend/.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3000
```

### 4. Install & run

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### 5. Start Stripe webhook listener
```bash
stripe listen --api-key sk_test_... --forward-to localhost:3000/stripe/webhook
```

App runs at **http://localhost:5173**

---

## 💳 Stripe Test Cards

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 9995` | Declined |

Use any future expiry date and any 3-digit CVC.

---

## 📱 Mobile
StreakOS is fully mobile-responsive with a native-feel bottom navigation bar. It qualifies as a **Progressive Web App (PWA)** and can be submitted to the Google Play Store via TWA (Trusted Web Activity).

---

## 📄 License
MIT © 2026 StreakOS
