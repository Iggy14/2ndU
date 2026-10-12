-- Run after 0001_init.sql in the Supabase SQL editor.

-- 1) Banning a user takes down everything they have listed.
--    Open chats on those listings close automatically (chat requires status = 'available').
create or replace function public.on_profile_banned() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.banned and not old.banned then
    perform set_config('app.bypass', '1', true);
    update listings set status = 'removed'
     where seller_id = new.id and status <> 'removed';
  end if;
  return new;
end $$;

drop trigger if exists profile_banned on public.profiles;
create trigger profile_banned after update of banned on public.profiles
  for each row execute function public.on_profile_banned();

-- Clean up listings of users who were already banned before this migration.
update public.listings l set status = 'removed'
 where l.status <> 'removed'
   and exists (select 1 from public.profiles p where p.id = l.seller_id and p.banned);

-- 2) Owners cannot edit or relist a listing an admin removed.
--    (Replaces the function from 0001; same rules plus the removed-lock.)
create or replace function public.protect_listing_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin()
     and coalesce(current_setting('app.bypass', true), '') <> '1' then
    if old.status = 'removed' then
      raise exception 'This listing was removed by an admin and cannot be changed';
    end if;
    if new.status = 'removed' then
      raise exception 'Only admins can remove listings';
    end if;
    if new.last_negotiated_at is distinct from old.last_negotiated_at
       or new.last_negotiated_by is distinct from old.last_negotiated_by
       or new.seller_id <> old.seller_id then
      raise exception 'Protected listing fields';
    end if;
  end if;
  if new.status = 'sold' and old.status <> 'sold' then new.sold_at := now(); end if;
  if new.status = 'available' then new.sold_at := null; end if;
  return new;
end $$;
