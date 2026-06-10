-- ============================================================
-- Insurance Buddy — Initial Schema
-- Run this in Supabase SQL Editor (or via supabase db push)
-- ============================================================

-- ── Profiles ────────────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  created_at timestamptz default now() not null
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ── Documents ───────────────────────────────────────────────
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  doc_type text not null check (doc_type in ('insurance', 'wellness', 'learning')),
  file_path text not null,
  original_name text,
  analyzed_at timestamptz,
  created_at timestamptz default now() not null,
  unique (user_id, doc_type)
);

alter table documents enable row level security;

create policy "Users can view own documents"
  on documents for select using (auth.uid() = user_id);

create policy "Users can insert own documents"
  on documents for insert with check (auth.uid() = user_id);

create policy "Users can update own documents"
  on documents for update using (auth.uid() = user_id);

create policy "Users can delete own documents"
  on documents for delete using (auth.uid() = user_id);


-- ── Benefit Categories ──────────────────────────────────────
create table if not exists benefit_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  document_id uuid references documents on delete cascade not null,
  name text not null,
  doc_type text not null check (doc_type in ('insurance', 'wellness', 'learning')),
  total_amount numeric(10, 2),
  notes text,
  created_at timestamptz default now() not null
);

alter table benefit_categories enable row level security;

create policy "Users can view own benefit categories"
  on benefit_categories for select using (auth.uid() = user_id);

create policy "Users can insert own benefit categories"
  on benefit_categories for insert with check (auth.uid() = user_id);

create policy "Users can update own benefit categories"
  on benefit_categories for update using (auth.uid() = user_id);

create policy "Users can delete own benefit categories"
  on benefit_categories for delete using (auth.uid() = user_id);


-- ── Expenses ────────────────────────────────────────────────
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  category_id uuid references benefit_categories on delete cascade not null,
  amount numeric(10, 2) not null check (amount > 0),
  description text,
  expense_date date not null default current_date,
  created_at timestamptz default now() not null
);

alter table expenses enable row level security;

create policy "Users can view own expenses"
  on expenses for select using (auth.uid() = user_id);

create policy "Users can insert own expenses"
  on expenses for insert with check (auth.uid() = user_id);

create policy "Users can update own expenses"
  on expenses for update using (auth.uid() = user_id);

create policy "Users can delete own expenses"
  on expenses for delete using (auth.uid() = user_id);


-- ── Storage Bucket ──────────────────────────────────────────
-- Run manually in Supabase dashboard or via CLI:
--
-- insert into storage.buckets (id, name, public)
-- values ('documents', 'documents', false);
--
-- create policy "Users can upload own documents"
--   on storage.objects for insert with check (
--     bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- create policy "Users can read own documents"
--   on storage.objects for select using (
--     bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- create policy "Users can delete own documents"
--   on storage.objects for delete using (
--     bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
--   );
