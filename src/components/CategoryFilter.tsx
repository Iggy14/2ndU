"use client";

import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/types";

// Category pills above the listings grid. Keeps the current search text.
export default function CategoryFilter({ q, cat }: { q: string; cat: string }) {
  const router = useRouter();

  const onChange = (next: string) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (next) sp.set("cat", next);
    const qs = sp.toString();
    router.push(`/${qs ? `?${qs}` : ""}#browse`);
  };

  const pill = (active: boolean) =>
    `shrink-0 border px-4 py-2 text-[11px] font-bold uppercase tracking-widest ${
      active ? "border-[#0f3d2e] bg-[#0f3d2e] text-white" : "border-slate-300 text-slate-700 hover:border-[#0f3d2e]"
    }`;

  return (
    <div role="group" aria-label="Filter by category" className="mx-auto flex max-w-5xl gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center">
      <button type="button" aria-pressed={!cat} onClick={() => onChange("")} className={pill(!cat)}>
        All
      </button>
      {CATEGORIES.map((c) => (
        <button key={c} type="button" aria-pressed={cat === c} onClick={() => onChange(c)} className={pill(cat === c)}>
          {c}
        </button>
      ))}
    </div>
  );
}
