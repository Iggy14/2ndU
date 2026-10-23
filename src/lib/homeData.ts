import { cacheLife } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { categoryCounts, homeListingsQuery, NO_FILTERS } from "@/lib/listingsQuery";
import { CATEGORIES, type Listing } from "@/lib/types";

const PREVIEW_COUNT = 8;

// Public home-page data (newest listings + per-category counts), identical for every visitor, so
// it is cached and shared across requests instead of hitting the database on every page view.
// Refreshed about once a minute: new listings and counts show up within that window.
// Per-user data (favourites, signed-in state) is not cached here.
export async function getHomeData() {
  "use cache";
  cacheLife("minutes");

  const supabase = createPublicClient();
  const [listings, counts] = await Promise.all([
    homeListingsQuery(supabase, NO_FILTERS, PREVIEW_COUNT),
    categoryCounts(supabase, CATEGORIES),
  ]);
  return { listings: (listings.data ?? []) as Listing[], counts };
}
