import type { SupabaseClient } from "@supabase/supabase-js";

export const PAGE_SIZE = 60;

export const SORTS = {
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
} as const;
export type Sort = keyof typeof SORTS;

export type ListingFilters = {
  q: string;
  cat: string;
  sort: Sort;
  min: number | null;
  max: number | null;
  page: number;
};

export const NO_FILTERS: ListingFilters = { q: "", cat: "", sort: "newest", min: null, max: null, page: 1 };

// Reads the browse page's URL params into filters, ignoring anything malformed.
export function parseFilters(sp: Record<string, string | string[] | undefined>): ListingFilters {
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const num = (v: string | string[] | undefined) => {
    const n = Number(str(v));
    return str(v) !== "" && Number.isFinite(n) && n >= 0 ? n : null;
  };
  const sort = str(sp.sort);
  return {
    q: str(sp.q).trim(),
    cat: str(sp.cat),
    sort: sort in SORTS ? (sort as Sort) : "newest",
    min: num(sp.min),
    max: num(sp.max),
    page: Math.max(1, Math.floor(Number(str(sp.page) || 1)) || 1),
  };
}

// Builds the /browse URL for a set of filters (defaults are left out to keep URLs short).
export function browseHref(f: Partial<ListingFilters>) {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.cat) sp.set("cat", f.cat);
  if (f.sort && f.sort !== "newest") sp.set("sort", f.sort);
  if (f.min != null) sp.set("min", String(f.min));
  if (f.max != null) sp.set("max", String(f.max));
  if (f.page && f.page > 1) sp.set("page", String(f.page));
  const qs = sp.toString();
  return `/browse${qs ? `?${qs}` : ""}`;
}

// The browse-page query, shared by the server render and the grid's client-side refresh
// so both always agree on filtering, ordering and paging. `count` is the total matching rows.
// `pageSize` is only overridden for short previews (e.g. "Just listed" on the home page).
export function homeListingsQuery(
  supabase: SupabaseClient,
  { q, cat, sort, min, max, page }: ListingFilters,
  pageSize = PAGE_SIZE,
) {
  const from = (page - 1) * pageSize;
  let query = supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "available") // sold items stay reachable by direct link (chat, favorites) only
    .range(from, from + pageSize - 1);
  if (sort === "price-asc") query = query.order("price", { ascending: true });
  else if (sort === "price-desc") query = query.order("price", { ascending: false });
  query = query.order("created_at", { ascending: false }); // newest, and tie-break for the price sorts
  if (q) query = query.ilike("title", `%${q.replace(/[%_]/g, "")}%`);
  if (cat) query = query.contains("categories", [cat]);
  if (min != null) query = query.gte("price", min);
  if (max != null) query = query.lte("price", max);
  return query;
}

// Number of available listings in each category, for the home page's category index.
// One cheap head-only count per category rather than loading every listing.
export async function categoryCounts(supabase: SupabaseClient, categories: readonly string[]) {
  const counts = await Promise.all(
    categories.map((c) =>
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "available")
        .contains("categories", [c]),
    ),
  );
  return Object.fromEntries(categories.map((c, i) => [c, counts[i].count ?? 0])) as Record<string, number>;
}
