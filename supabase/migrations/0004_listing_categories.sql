-- Listings can have several categories. 'all' means the item fits every category.
alter table public.listings add column categories text[] not null default '{other}'
  check (cardinality(categories) >= 1);
update public.listings set categories = array[category];
alter table public.listings drop column category;
create index listings_categories on public.listings using gin (categories);
