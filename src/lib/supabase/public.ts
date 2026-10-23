import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Anonymous Supabase client with no cookies or session. Use it only for public data that is the
// same for every visitor, e.g. inside a cached function (cached code cannot read request cookies).
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
