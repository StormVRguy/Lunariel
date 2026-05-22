-- Book of Remembrance: per-user prayer history (anonymous auth supported)

create table if not exists public.prayer_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  prayer text not null,
  refrain text not null,
  purified_intention text,
  discernment_notice text
);

create index if not exists prayer_records_user_created_idx
  on public.prayer_records (user_id, created_at desc);

alter table public.prayer_records enable row level security;

create policy "Users can view own prayer records"
  on public.prayer_records for select
  using (auth.uid() = user_id);

create policy "Users can insert own prayer records"
  on public.prayer_records for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own prayer records"
  on public.prayer_records for delete
  using (auth.uid() = user_id);
