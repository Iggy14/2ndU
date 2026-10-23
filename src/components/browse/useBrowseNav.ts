"use client";

import { useRouter } from "next/navigation";
import { browseHref, type ListingFilters } from "@/lib/listingsQuery";

// Returns a function that navigates /browse with some filters changed (and back to page 1).
export function useBrowseNav(filters: ListingFilters) {
  const router = useRouter();
  return (next: Partial<ListingFilters>) => router.push(browseHref({ ...filters, page: 1, ...next }));
}
