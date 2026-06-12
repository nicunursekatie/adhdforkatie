-- ===========================================================================
-- ADHD Planner — Supabase schema
--
-- Design: one table per collection, each row = (id, user_id, data jsonb,
-- updated_at). The rich task model lives in `data`, so the app can keep gaining
-- fields with zero migrations. Row-Level Security ties every row to its owner,
-- and realtime keeps your devices in sync.
--
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- ===========================================================================

create extension if not exists pgcrypto;

-- Helper to create an identical (id, user_id, data, updated_at) table + RLS.
do $$
declare
  t text;
  tables text[] := array[
    'tasks', 'projects', 'categories',
    'daily_plans', 'journal_entries', 'accountability_responses'
  ];
begin
  foreach t in array tables loop
    execute format($f$
      create table if not exists public.%I (
        id uuid primary key,
        user_id uuid not null references auth.users on delete cascade,
        data jsonb not null,
        updated_at timestamptz not null default now()
      );
    $f$, t);

    execute format('create index if not exists %I on public.%I (user_id);', t || '_user_id_idx', t);
    execute format('alter table public.%I enable row level security;', t);

    -- Drop-then-create so re-running the script is safe.
    execute format('drop policy if exists "owner_all" on public.%I;', t);
    execute format($f$
      create policy "owner_all" on public.%I
        for all
        using (user_id = auth.uid())
        with check (user_id = auth.uid());
    $f$, t);
  end loop;
end $$;

-- Settings: a single row per user.
create table if not exists public.settings (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;
drop policy if exists "owner_all" on public.settings;
create policy "owner_all" on public.settings
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Enable realtime so changes on one device appear on the others.
do $$
declare
  t text;
  tables text[] := array[
    'tasks', 'projects', 'categories',
    'daily_plans', 'journal_entries', 'accountability_responses', 'settings'
  ];
begin
  foreach t in array tables loop
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception when duplicate_object then
      null; -- already added
    end;
  end loop;
end $$;
