# Tasky - Elegant Task Management

Tasky is a premium, personal task scheduler designed to manage yearly goals, monthly tasks, daily items, and daily routines/schedules. It features a modern design, dark mode, interactive progress charts, and complete integration with Supabase.

## Technologies Used

- **Frontend Framework**: Vite, React, TypeScript
- **Styling**: Tailwind CSS, shadcn-ui
- **Icons**: Lucide React
- **Backend/Database**: Supabase (Database, Authentication, Storage)

---

## Local Setup Instructions

Follow these steps to run the application locally on your machine:

### 1. Install Dependencies

Ensure you have [Node.js](https://nodejs.org/) installed, then run:

```bash
npm install
```

### 2. Configure Supabase

1. Create a new project on [Supabase](https://supabase.com/).
2. Retrieve your **Project URL** and **Anon Key** from the API settings.
3. Create a `.env` file in the root of the project:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 3. Setup the Database Schema

Run the following SQL script inside the **SQL Editor** of your Supabase project dashboard to create the tables, trigger, and daily task reset helper function:

```sql
-- 1. Create Tables
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  avatar_url text,
  cover_url text,
  full_name text,
  progress_score integer default 0,
  resume_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.yearly_goals (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.monthly_tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  completed boolean default false,
  goal_id uuid references public.yearly_goals(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.daily_tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  completed boolean default false,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.schedule_items (
  id uuid default gen_random_uuid() primary key,
  activity text not null,
  time text not null,
  completed boolean default false,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Reset Function
create or replace function public.reset_daily_tasks()
returns void as $$
begin
  update public.daily_tasks
  set completed = false;
end;
$$ language plpgsql security definer;

-- 3. Automatic Profile Creation Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.yearly_goals enable row level security;
alter table public.monthly_tasks enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.schedule_items enable row level security;

-- 5. Create RLS Policies
create policy "Allow users to read and update their own profile"
on public.profiles for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Allow users to perform all actions on their own yearly goals"
on public.yearly_goals for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Allow users to perform all actions on their own monthly tasks"
on public.monthly_tasks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Allow users to perform all actions on their own daily tasks"
on public.daily_tasks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Allow users to perform all actions on their own schedule items"
on public.schedule_items for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

### 4. Setup Storage Buckets

Go to **Storage** in your Supabase project dashboard and create three **Public** buckets:
1. `avatars`
2. `covers`
3. `resumes`

Enable the policy allowing authenticated users to upload and delete files.

### 5. Start Development Server

Run the local development server:

```bash
npm run dev
```

Navigate to `http://localhost:8080` (or the port output in your terminal) to access the application.
