"use client";

import { CATEGORIES } from "@/lib/types";
import type { ListingFilters } from "@/lib/listingsQuery";
import { useBrowseNav } from "./useBrowseNav";

const heading = "text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e]";
const input =
  "w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0f3d2e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f3d2e]";

const PRESETS = [
  { text: "Under ฿100", min: null, max: 100 },
  { text: "฿100–500", min: 100, max: 500 },
  { text: "฿500–1,000", min: 500, max: 1000 },
  { text: "Over ฿1,000", min: 1000, max: null },
] as const;

// Category list and price range. Used as the desktop sidebar and inside the mobile filter drawer.
// `onApply` lets the drawer close itself after a choice.
export default function FilterPanel({ filters, onApply }: { filters: ListingFilters; onApply?: () => void }) {
  const go = useBrowseNav(filters);
  const { cat, min, max } = filters;

  const apply = (next: Partial<ListingFilters>) => {
    go(next);
    onApply?.();
  };

  const catItem = (value: string, text: string) => {
    const active = cat === value;
    return (
      <li key={value}>
        <button
          type="button"
          aria-pressed={active}
          onClick={() => apply({ cat: value })}
          className={`flex w-full items-center border-l-4 py-2 pl-3 text-left text-[11px] font-bold uppercase tracking-widest transition-colors duration-200 ${
            active ? "border-[#0f3d2e] text-[#0f3d2e]" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900"
          }`}
        >
          {text}
        </button>
      </li>
    );
  };

  const presetActive = (p: (typeof PRESETS)[number]) => p.min === min && p.max === max;

  return (
    <div className="space-y-8">
      <section aria-labelledby="filter-category" className="space-y-2">
        <h2 id="filter-category" className={heading}>Category</h2>
        <ul>
          {catItem("", "All")}
          {CATEGORIES.map((c) => catItem(c, c))}
        </ul>
      </section>

      <section aria-labelledby="filter-price" className="space-y-3">
        <h2 id="filter-price" className={heading}>Price (฿)</h2>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.text}
              type="button"
              aria-pressed={presetActive(p)}
              onClick={() => apply({ min: presetActive(p) ? null : p.min, max: presetActive(p) ? null : p.max })}
              className={`border px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors duration-200 ${
                presetActive(p) ? "border-[#0f3d2e] bg-[#0f3d2e] text-white" : "border-slate-300 text-slate-700 hover:border-[#0f3d2e]"
              }`}
            >
              {p.text}
            </button>
          ))}
        </div>
        {/* key remounts the form so the boxes follow presets and removed chips */}
        <form
          key={`${min}|${max}`}
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const num = (key: string) => {
              const v = String(data.get(key) ?? "").trim();
              const n = Number(v);
              return v !== "" && Number.isFinite(n) && n >= 0 ? n : null;
            };
            let lo = num("min");
            let hi = num("max");
            if (lo != null && hi != null && lo > hi) [lo, hi] = [hi, lo]; // forgiving: swap a reversed range
            apply({ min: lo, max: hi });
          }}
        >
          <input name="min" type="number" inputMode="numeric" min={0} defaultValue={min ?? ""} placeholder="Min" aria-label="Minimum price" className={input} />
          <span className="text-slate-400" aria-hidden>–</span>
          <input name="max" type="number" inputMode="numeric" min={0} defaultValue={max ?? ""} placeholder="Max" aria-label="Maximum price" className={input} />
          <button className="border border-[#0f3d2e] px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e] transition-colors hover:bg-[#0f3d2e] hover:text-white">
            Go
          </button>
        </form>
      </section>
    </div>
  );
}
