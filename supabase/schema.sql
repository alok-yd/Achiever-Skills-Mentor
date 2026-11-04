-- Optional Supabase persistence schema (not required for local-first mode).
-- Apply this in the Supabase SQL editor after enabling Auth.
create extension if not exists pgcrypto;
create table if not exists public.user_workspace (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_workspace enable row level security;
create policy "Users can read their workspace" on public.user_workspace for select using (auth.uid() = user_id);
create policy "Users can insert their workspace" on public.user_workspace for insert with check (auth.uid() = user_id);
create policy "Users can update their workspace" on public.user_workspace for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
