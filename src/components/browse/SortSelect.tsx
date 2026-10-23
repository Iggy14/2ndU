"use client";

import { SORTS, type ListingFilters, type Sort } from "@/lib/listingsQuery";
import { useBrowseNav } from "./useBrowseNav";

export default function SortSelect({ filters }: { filters: ListingFilters }) {
  const go = useBrowseNav(filters);

  return (
    <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
      Sort
      <select
        value={filters.sort}
        onChange={(e) => go({ sort: e.target.value as Sort })}
        className="border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm font-normal normal-case tracking-normal text-slate-900 focus:border-[#0f3d2e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f3d2e]"
      >
        {Object.entries(SORTS).map(([value, text]) => (
          <option key={value} value={value}>{text}</option>
        ))}
      </select>
    </label>
  );
}
