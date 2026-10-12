import type { SupabaseClient } from "@supabase/supabase-js";

export const PAGE_SIZE = 60;

// The home-page query, shared by the server render and the grid's client-side refresh
// so both always agree on filtering, ordering and paging. `count` is the total matching rows.
export function homeListingsQuery(
  supabase: SupabaseClient,
  { q, cat, page }: { q: string; cat: string; page: number },
) {
  const from = (page - 1) * PAGE_SIZE;
  let query = supabase
    .from("listings")
    .select("*", { count: "exact" })
    .neq("status", "removed")
    .order("status", { ascending: true }) // 'available' sorts before 'sold'
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (q) query = query.ilike("title", `%${q.replace(/[%_]/g, "")}%`);
  if (cat) query = query.eq("category", cat);
  return query;
}
