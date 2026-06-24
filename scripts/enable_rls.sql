-- ============================================================
-- Taskyy: Enable Row Level Security for per-profile data isolation
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: Enable RLS on all data tables
ALTER TABLE public.yearly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Step 2: Drop any existing policies (safe to run even if none exist)
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('yearly_goals', 'monthly_tasks', 'daily_tasks', 'schedule_items', 'profiles')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ============================================================
-- Step 3: Create a function that converts Clerk user ID to the
-- same deterministic UUID that the frontend generates.
-- This replicates getDeterministicUUID() from AuthProvider.tsx
-- ============================================================
CREATE OR REPLACE FUNCTION public.clerk_id_to_uuid(clerk_id text) RETURNS uuid AS $$
DECLARE
  h1 bigint := x'deadbeef'::bigint;
  h2 bigint := x'41c6ce57'::bigint;
  h3 bigint := x'fae12f38'::bigint;
  h4 bigint := x'9e3779b9'::bigint;
  ch bigint;
  mod_val numeric := 4294967296;
  full_hex text;
  i int;
BEGIN
  IF clerk_id IS NULL OR clerk_id = '' THEN
    RETURN NULL;
  END IF;

  FOR i IN 1..length(clerk_id) LOOP
    ch := ascii(substring(clerk_id FROM i FOR 1))::bigint;
    h1 := (((h1 # ch)::numeric * 2654435761::numeric) % mod_val)::bigint;
    h2 := (((h2 # ch)::numeric * 1597334677::numeric) % mod_val)::bigint;
    h3 := (((h3 # ch)::numeric * 3242194837::numeric) % mod_val)::bigint;
    h4 := (((h4 # ch)::numeric * 4294967291::numeric) % mod_val)::bigint;
  END LOOP;

  full_hex := lpad(to_hex(h1), 8, '0') || lpad(to_hex(h2), 8, '0') || lpad(to_hex(h3), 8, '0') || lpad(to_hex(h4), 8, '0');

  RETURN (
    substring(full_hex FROM 1 FOR 8) || '-' ||
    substring(full_hex FROM 9 FOR 4) || '-4' ||
    substring(full_hex FROM 14 FOR 3) || '-a' ||
    substring(full_hex FROM 18 FOR 3) || '-' ||
    substring(full_hex FROM 21 FOR 12)
  )::uuid;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- Step 4: Create per-user policies for yearly_goals
-- Uses clerk_id_to_uuid to convert JWT sub claim to the UUID
-- stored in user_id column
-- ============================================================
CREATE POLICY "yearly_goals_select_own"
  ON public.yearly_goals FOR SELECT
  USING (clerk_id_to_uuid(auth.jwt()->>'sub') = user_id);

CREATE POLICY "yearly_goals_insert_own"
  ON public.yearly_goals FOR INSERT
  WITH CHECK (clerk_id_to_uuid(auth.jwt()->>'sub') = user_id);

CREATE POLICY "yearly_goals_update_own"
  ON public.yearly_goals FOR UPDATE
  USING (clerk_id_to_uuid(auth.jwt()->>'sub') = user_id);

CREATE POLICY "yearly_goals_delete_own"
  ON public.yearly_goals FOR DELETE
  USING (clerk_id_to_uuid(auth.jwt()->>'sub') = user_id);

-- ============================================================
-- Step 5: Create per-user policies for monthly_tasks
-- ============================================================
CREATE POLICY "monthly_tasks_select_own"
  ON public.monthly_tasks FOR SELECT
  USING (clerk_id_to_uuid(auth.jwt()->>'sub') = user_id);

CREATE POLICY "monthly_tasks_insert_own"
  ON public.monthly_tasks FOR INSERT
  WITH CHECK (clerk_id_to_uuid(auth.jwt()->>'sub') = user_id);

CREATE POLICY "monthly_tasks_update_own"
  ON public.monthly_tasks FOR UPDATE
  USING (clerk_id_to_uuid(auth.jwt()->>'sub') = user_id);

CREATE POLICY "monthly_tasks_delete_own"
  ON public.monthly_tasks FOR DELETE
  USING (clerk_id_to_uuid(auth.jwt()->>'sub') = user_id);

-- ============================================================
-- Step 6: Create per-user policies for daily_tasks
-- ============================================================
CREATE POLICY "daily_tasks_select_own"
  ON public.daily_tasks FOR SELECT
  USING (clerk_id_to_uuid(auth.jwt()->>'sub') = user_id);

CREATE POLICY "daily_tasks_insert_own"
  ON public.daily_tasks FOR INSERT
  WITH CHECK (clerk_id_to_uuid(auth.jwt()->>'sub') = user_id);

CREATE POLICY "daily_tasks_update_own"
  ON public.daily_tasks FOR UPDATE
  USING (clerk_id_to_uuid(auth.jwt()->>'sub') = user_id);

CREATE POLICY "daily_tasks_delete_own"
  ON public.daily_tasks FOR DELETE
  USING (clerk_id_to_uuid(auth.jwt()->>'sub') = user_id);

-- ============================================================
-- Step 7: Create per-user policies for schedule_items
-- ============================================================
CREATE POLICY "schedule_items_select_own"
  ON public.schedule_items FOR SELECT
  USING (clerk_id_to_uuid(auth.jwt()->>'sub') = user_id);

CREATE POLICY "schedule_items_insert_own"
  ON public.schedule_items FOR INSERT
  WITH CHECK (clerk_id_to_uuid(auth.jwt()->>'sub') = user_id);

CREATE POLICY "schedule_items_update_own"
  ON public.schedule_items FOR UPDATE
  USING (clerk_id_to_uuid(auth.jwt()->>'sub') = user_id);

CREATE POLICY "schedule_items_delete_own"
  ON public.schedule_items FOR DELETE
  USING (clerk_id_to_uuid(auth.jwt()->>'sub') = user_id);

-- ============================================================
-- Step 8: Create per-user policies for profiles
-- (profiles table uses 'id' as the user identifier, not 'user_id')
-- ============================================================
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (clerk_id_to_uuid(auth.jwt()->>'sub') = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (clerk_id_to_uuid(auth.jwt()->>'sub') = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (clerk_id_to_uuid(auth.jwt()->>'sub') = id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (clerk_id_to_uuid(auth.jwt()->>'sub') = id);

-- ============================================================
-- Done. Verify with:
-- SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public';
-- ============================================================
