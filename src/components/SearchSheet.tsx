"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CATEGORIES } from "@/lib/types";

// Search button in the nav. Opens a top panel with the search box and category chips;
// picking a category or submitting a search goes to the browse page (/browse?q=&cat=).
export default function SearchSheet({ className }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(params.get("q") ?? "");
  const cat = params.get("cat") ?? "";

  const go = (nextQ: string, nextCat: string) => {
    const sp = new URLSearchParams();
    if (nextQ.trim()) sp.set("q", nextQ.trim());
    if (nextCat) sp.set("cat", nextCat);
    const qs = sp.toString();
    setOpen(false);
    router.push(`/browse${qs ? `?${qs}` : ""}`);
  };

  const chip = (active: boolean) =>
    `border px-4 py-2 text-[11px] font-bold uppercase tracking-widest ${active ? "border-white bg-white text-[#0f3d2e]" : "border-white/50 text-white hover:bg-white/10"}`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger aria-label="Search listings" className={className}>
        <SearchIcon className="size-5" aria-hidden />
      </SheetTrigger>
      <SheetContent side="top" className="gap-4 border-0 bg-[#0f3d2e] p-4 text-white sm:p-6 [&>[data-slot=sheet-close]]:text-white [&>[data-slot=sheet-close]]:hover:bg-white/10">
        <SheetTitle className="sr-only">Search listings</SheetTitle>
        <div className="mx-auto w-full max-w-2xl space-y-6 pt-6">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              go(q, cat);
            }}
          >
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search fridges, desks, books…"
              className="flex-1 border border-white/50 bg-transparent px-4 py-3 text-base text-white placeholder:text-white/50 focus:border-white focus:outline-none"
            />
            <button className="bg-white px-6 text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e] hover:bg-green-100">Search</button>
          </form>
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/60">Categories</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => go(q, "")} className={chip(!cat)}>All</button>
              {CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => go(q, c)} className={chip(cat === c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
