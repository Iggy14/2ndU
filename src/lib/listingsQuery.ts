import type { SupabaseClient } from "@supabase/supabase-js";

// The home-page query, shared by the server render and the grid's client-side refresh
// so both always agree on filtering and ordering.
export function homeListingsQuery(supabase: SupabaseClient, { q, cat }: { q: string; cat: string }) {
  let query = supabase
    .from("listings")
    .select("*")
    .neq("status", "removed")
    .order("status", { ascending: true }) // 'available' sorts before 'sold'
    .order("created_at", { ascending: false })
    .limit(60);
  if (q) query = query.ilike("title", `%${q.replace(/[%_]/g, "")}%`);
  if (cat) query = query.eq("category", cat);
  return query;
}
