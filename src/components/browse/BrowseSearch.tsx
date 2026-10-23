"use client";

import { SearchIcon } from "lucide-react";
import type { ListingFilters } from "@/lib/listingsQuery";
import { useBrowseNav } from "./useBrowseNav";

// The big search bar at the top of /browse. Keeps the other filters when searching.
export default function BrowseSearch({ filters }: { filters: ListingFilters }) {
  const go = useBrowseNav(filters);

  return (
    // key remounts the form when the applied search changes (e.g. a chip is removed)
    <form
      key={filters.q}
      role="search"
      className="flex"
      onSubmit={(e) => {
        e.preventDefault();
        go({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() });
      }}
    >
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          name="q"
          type="search"
          defaultValue={filters.q}
          aria-label="Search listings"
          placeholder="Search fridges, desks, books…"
          className="h-14 w-full border border-white bg-white pl-12 pr-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f3d2e]"
        />
      </div>
      <button className="border border-white bg-[#0f3d2e] px-6 text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-[#0f3d2e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-10">
        Search
      </button>
    </form>
  );
}
