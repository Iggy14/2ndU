import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ListingGrid from "@/components/ListingGrid";
import { CATEGORIES, type Listing } from "@/lib/types";
import { homeListingsQuery } from "@/lib/listingsQuery";

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const cat = typeof sp.cat === "string" ? sp.cat : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await homeListingsQuery(supabase, { q, cat });

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm capitalize ${active ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white hover:border-emerald-600"}`;

  return (
    <div className="space-y-5">
      <form className="flex gap-2" action="/">
        <input name="q" defaultValue={q} placeholder="Search fridges, desks, books…" className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none" />
        {cat && <input type="hidden" name="cat" value={cat} />}
        <button className="rounded-md bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700">Search</button>
      </form>
      <div className="flex flex-wrap gap-2">
        <Link href={q ? `/?q=${encodeURIComponent(q)}` : "/"} className={chip(!cat)}>All</Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={`/?cat=${c}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={chip(cat === c)}>
            {c}
          </Link>
        ))}
      </div>
      <ListingGrid key={`${q}|${cat}`} q={q} cat={cat} initial={(data ?? []) as Listing[]} viewerId={user?.id ?? null} />
    </div>
  );
}
