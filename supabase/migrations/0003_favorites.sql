-- Favourites: a user can save listings and see them on /favorites.
create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
create index favorites_user_created on public.favorites (user_id, created_at desc);

alter table public.favorites enable row level security;
create policy "own favorites read" on public.favorites for select using (user_id = auth.uid());
create policy "own favorites add" on public.favorites for insert
  with check (user_id = auth.uid() and public.is_active_user());
create policy "own favorites remove" on public.favorites for delete using (user_id = auth.uid());
