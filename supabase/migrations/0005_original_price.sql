-- Optional "was" price shown struck through next to the sale price.
alter table public.listings add column original_price integer
  check (original_price is null or (original_price between 1 and 100000));
