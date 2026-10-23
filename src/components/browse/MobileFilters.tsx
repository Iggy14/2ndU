"use client";

import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ListingFilters } from "@/lib/listingsQuery";
import FilterPanel from "./FilterPanel";

// "Filters" button + left drawer for screens below `md`, where the sidebar is hidden.
export default function MobileFilters({ filters }: { filters: ListingFilters }) {
  const [open, setOpen] = useState(false);
  const active = (filters.cat ? 1 : 0) + (filters.min != null || filters.max != null ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex items-center gap-2 border border-[#0f3d2e] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e] transition-colors hover:bg-[#0f3d2e] hover:text-white md:hidden">
        <SlidersHorizontalIcon className="size-4" aria-hidden />
        Filters{active > 0 && ` (${active})`}
      </SheetTrigger>
      <SheetContent side="left" className="w-80 gap-0 p-0">
        <SheetTitle className="border-b border-slate-200 px-6 py-5 text-sm font-black uppercase tracking-widest text-[#0f3d2e]">
          Filters
        </SheetTitle>
        <div className="overflow-y-auto px-6 py-6">
          <FilterPanel filters={filters} onApply={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
