# Taskyy — Personal Task & Goal Manager

Taskyy is a personal productivity app for tracking yearly goals, monthly tasks, daily to-dos, and daily schedules. Built with React, Clerk authentication, and Supabase for secure per-user data isolation.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Radix UI |
| Auth | Clerk (email/password, MFA, OAuth) |
| Database & Storage | Supabase (PostgreSQL + RLS + Storage) |
| Deployment | Vercel |

## Features

- **Yearly Goals** — Create and manage long-term goals, each with their own monthly breakdown
- **Monthly Plans** — Track tasks under each yearly goal month by month
- **Daily Plan** — A simple daily to-do list that resets each day
- **Schedule** — Time-blocked daily schedule with drag-reorder support
- **Profile** — Avatar, cover photo, resume upload, progress tracking
- **Security** — Per-user Row Level Security (RLS) in Supabase; each user can only access their own data

## Project Structure

```
Taskyy/
├── database/
│   └── enable_rls.sql        # Supabase RLS + storage bucket setup
├── public/                   # Static assets (favicon, manifest)
├── src/
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives (buttons, inputs, etc.)
│   │   ├── profile/          # Profile-specific components
│   │   ├── AuthProvider.tsx  # Clerk → Supabase auth bridge
│   │   ├── Navbar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── hooks/                # Custom React hooks
│   ├── integrations/
│   │   └── supabase/         # Supabase client + TypeScript types
│   ├── pages/                # Route-level page components
│   ├── lib/                  # Utility functions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example              # Environment variable template
├── vercel.json               # SPA routing config for Vercel
└── vite.config.ts
```

## Setup & Local Development

### 1. Clone the repository
```bash
git clone https://github.com/rishiporwa1/Taskyy.git
cd Taskyy
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

| Variable | Where to get it |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → `anon public` |

### 4. Set up Supabase

Run `database/enable_rls.sql` in your [Supabase SQL Editor](https://supabase.com/dashboard). This:
- Enables Row Level Security on all tables
- Creates `clerk_id_to_uuid()` function to map Clerk IDs to UUIDs
- Adds per-user RLS policies to `yearly_goals`, `monthly_tasks`, `daily_tasks`, `schedule_items`, `profiles`
- Creates and configures `avatars`, `covers`, and `resumes` storage buckets

### 5. Configure Clerk JWT Template

In Clerk Dashboard → **Configure** → **JWT Templates** → **New template** → select **Supabase**:
- Name: `supabase`
- Signing key: Paste your Supabase JWT Secret (from Supabase Dashboard → Settings → Authentication → JWT Settings)

### 6. Start the dev server
```bash
npm run dev
```

App runs at `http://localhost:8080`

## Deployment (Vercel)

1. Connect `rishiporwa1/Taskyy` on [vercel.com/new](https://vercel.com/new)
2. Add the 3 environment variables from your `.env` file
3. Deploy

The `vercel.json` already handles SPA client-side routing.

## Security Notes

- All database tables are protected by Supabase Row Level Security — users can only read/write their own rows
- Clerk JWT tokens are automatically injected into every Supabase request via a custom fetch interceptor
- Storage buckets enforce owner-only upload and delete policies
- Secrets are loaded strictly from environment variables — no hardcoded fallback credentials
