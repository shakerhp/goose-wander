create table if not exists public.goose_events (
  id uuid primary key default gen_random_uuid(),
  goose_kind text not null check (goose_kind in ('original', 'media', 'tradesman', 'nerd', 'paint', 'robot')),
  guest_name text,
  rating int4 check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.goose_events add column if not exists guest_name text;
alter table public.goose_events add column if not exists rating int4;
alter table public.goose_events add column if not exists comment text;
alter table public.goose_events drop constraint if exists goose_events_rating_check;
alter table public.goose_events
  add constraint goose_events_rating_check check (rating is null or rating between 1 and 5);

alter table public.goose_events drop constraint if exists goose_events_goose_kind_check;
alter table public.goose_events
  add constraint goose_events_goose_kind_check check (goose_kind in ('original', 'media', 'tradesman', 'nerd', 'paint', 'robot'));

create index if not exists goose_events_created_at_idx on public.goose_events (created_at desc);
create index if not exists goose_events_kind_idx on public.goose_events (goose_kind);