"use client";

import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import type { ListingFilters } from "@/lib/listingsQuery";
import { useBrowseNav } from "./useBrowseNav";

// One removable chip per active filter, plus "Clear all". Renders nothing when nothing is filtered.
export default function ActiveFilters({ filters }: { filters: ListingFilters }) {
  const router = useRouter();
  const go = useBrowseNav(filters);
  const { q, cat, min, max } = filters;

  const chips: { text: string; clear: Partial<ListingFilters> }[] = [];
  if (q) chips.push({ text: `“${q}”`, clear: { q: "" } });
  if (cat) chips.push({ text: cat, clear: { cat: "" } });
  if (min != null || max != null) {
    const text = min != null && max != null ? `฿${min}–฿${max}` : min != null ? `Over ฿${min}` : `Under ฿${max}`;
    chips.push({ text, clear: { min: null, max: null } });
  }
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.text}
          type="button"
          onClick={() => go(c.clear)}
          aria-label={`Remove filter ${c.text}`}
          className="flex items-center gap-1.5 bg-green-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e] transition-colors hover:bg-green-200"
        >
          {c.text}
          <XIcon className="size-3" aria-hidden />
        </button>
      ))}
      <button
        type="button"
        onClick={() => router.push("/browse")}
        className="px-1 text-[11px] font-bold uppercase tracking-widest text-slate-500 underline-offset-4 hover:text-[#0f3d2e] hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
