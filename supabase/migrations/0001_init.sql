-- 2ndU initial schema. Run in the Supabase SQL editor (or `supabase db push`).

create extension if not exists pgcrypto;

-- ───────────── profiles ─────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'user' check (role in ('user','admin')),
  is_seller boolean not null default false,
  student_id text,
  school_email text,
  banned boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(split_part(new.email, '@', 1), ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and not banned);
$$;

create or replace function public.is_active_seller() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and is_seller and not banned);
$$;

create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and not banned);
$$;

-- Users may only change their display name; privileged columns are blocked.
-- The 'app.bypass' flag lets our own security-definer functions (become_seller,
-- message trigger) through.
create or replace function public.protect_profile_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin()
     and coalesce(current_setting('app.bypass', true), '') <> '1' then
    if new.role <> old.role or new.is_seller <> old.is_seller or new.banned <> old.banned
       or new.student_id is distinct from old.student_id
       or new.school_email is distinct from old.school_email then
      raise exception 'Not allowed to change protected profile fields';
    end if;
  end if;
  return new;
end $$;

create trigger protect_profile before update on public.profiles
  for each row execute function public.protect_profile_columns();

alter table public.profiles enable row level security;
create policy "profiles readable" on public.profiles for select using (true);
create policy "own profile update" on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- Seller verification: school email must be confirmed on the auth account
-- (user changes their login email to the school one and clicks the link),
-- and the student ID must match the pattern. Change domain/regex here to adjust.
create or replace function public.become_seller(p_student_id text) returns void
language plpgsql security definer set search_path = public, auth as $$
declare
  v_email text;
  v_confirmed timestamptz;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if p_student_id !~ '^6\d{6}$' then
    raise exception 'Student ID format is invalid';
  end if;
  select email, email_confirmed_at into v_email, v_confirmed from auth.users where id = auth.uid();
  if v_confirmed is null or lower(v_email) not like '%@rsu.ac.th' then
    raise exception 'Verify your school email first';
  end if;
  if exists (select 1 from profiles where id = auth.uid() and banned) then
    raise exception 'Account is banned';
  end if;
  perform set_config('app.bypass', '1', true);
  update profiles set is_seller = true, student_id = p_student_id, school_email = lower(v_email)
   where id = auth.uid();
end $$;

-- ───────────── listings ─────────────
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  price integer not null check (price between 1 and 100000),
  category text not null default 'other',
  images text[] not null check (cardinality(images) between 1 and 8),
  location_text text not null check (char_length(location_text) between 2 and 200),
  fulfillment text not null check (fulfillment in ('delivery','pickup','both')),
  delivery_note text not null default '' check (char_length(delivery_note) <= 300),
  status text not null default 'available' check (status in ('available','sold','removed')),
  sold_at timestamptz,
  last_negotiated_at timestamptz,
  last_negotiated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index listings_status_created on public.listings (status, created_at desc);

alter table public.listings enable row level security;
create policy "listings visible" on public.listings for select
  using (status <> 'removed' or seller_id = auth.uid() or public.is_admin());
create policy "sellers insert" on public.listings for insert
  with check (seller_id = auth.uid() and public.is_active_seller());
create policy "owner or admin update" on public.listings for update
  using ((seller_id = auth.uid() and public.is_active_seller()) or public.is_admin());
create policy "owner or admin delete" on public.listings for delete
  using (seller_id = auth.uid() or public.is_admin());

-- Owners may not mark their own listing 'removed' (admin action) or touch negotiation fields.
create or replace function public.protect_listing_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'sold' and old.status <> 'sold' then new.sold_at := now(); end if;
  if new.status = 'available' then new.sold_at := null; end if;
  if auth.uid() is not null and not public.is_admin()
     and coalesce(current_setting('app.bypass', true), '') <> '1' then
    if new.status = 'removed' and old.status <> 'removed' then
      raise exception 'Only admins can remove listings';
    end if;
    if old.status = 'removed' and new.status <> 'removed' then
      raise exception 'Listing was removed by an admin';
    end if;
    if new.last_negotiated_at is distinct from old.last_negotiated_at
       or new.last_negotiated_by is distinct from old.last_negotiated_by
       or new.seller_id <> old.seller_id then
      raise exception 'Protected listing fields';
    end if;
  end if;
  return new;
end $$;
create trigger protect_listing before update on public.listings
  for each row execute function public.protect_listing_columns();

-- ───────────── chat ─────────────
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  unique (listing_id, buyer_id),
  check (buyer_id <> seller_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index messages_conv_created on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
create policy "participants read conv" on public.conversations for select
  using (auth.uid() in (buyer_id, seller_id) or public.is_admin());
create policy "buyer starts conv" on public.conversations for insert
  with check (
    buyer_id = auth.uid() and public.is_active_user()
    and seller_id = (select seller_id from public.listings where id = listing_id and status = 'available')
  );

alter table public.messages enable row level security;
create policy "participants read msgs" on public.messages for select
  using (exists (select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)) or public.is_admin());
create policy "participants send msgs" on public.messages for insert
  with check (
    sender_id = auth.uid() and public.is_active_user()
    and exists (
      select 1 from public.conversations c join public.listings l on l.id = c.listing_id
      where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id) and l.status = 'available')
  );
create policy "recipient marks read" on public.messages for update
  using (sender_id <> auth.uid() and exists (select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)));

-- On each message: bump the conversation, and if a buyer wrote, flag the listing as
-- "being negotiated" (listing rows are public, so Realtime pushes the banner to everyone).
create or replace function public.on_message_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare c public.conversations;
begin
  select * into c from conversations where id = new.conversation_id;
  update conversations set last_message_at = new.created_at where id = c.id;
  if new.sender_id = c.buyer_id then
    perform set_config('app.bypass', '1', true);
    update listings set last_negotiated_at = new.created_at, last_negotiated_by = c.buyer_id
     where id = c.listing_id;
  end if;
  return new;
end $$;
create trigger message_inserted after insert on public.messages
  for each row execute function public.on_message_insert();

-- ───────────── reports ─────────────
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "report as self" on public.reports for insert
  with check (reporter_id = auth.uid() and public.is_active_user());
create policy "admin reads reports" on public.reports for select using (public.is_admin());
create policy "admin updates reports" on public.reports for update using (public.is_admin());

-- ───────────── storage ─────────────
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true) on conflict do nothing;

create policy "images public read" on storage.objects for select
  using (bucket_id = 'listing-images');
create policy "sellers upload own folder" on storage.objects for insert
  with check (bucket_id = 'listing-images' and public.is_active_seller()
    and (storage.foldername(name))[1] = auth.uid()::text);
create policy "sellers delete own images" on storage.objects for delete
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ───────────── realtime ─────────────
alter publication supabase_realtime add table public.listings, public.messages;
