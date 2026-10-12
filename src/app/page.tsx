import { createClient } from "@/lib/supabase/server";
import Hero from "@/components/Hero";
import ListingGrid from "@/components/ListingGrid";
import CategoryFilter from "@/components/CategoryFilter";
import type { Listing } from "@/lib/types";
import Pagination from "@/components/Pagination";
import { homeListingsQuery, PAGE_SIZE } from "@/lib/listingsQuery";

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const cat = typeof sp.cat === "string" ? sp.cat : "";
  const page = Math.max(1, Math.floor(Number(typeof sp.page === "string" ? sp.page : 1)) || 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, count } = await homeListingsQuery(supabase, { q, cat, page });
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <Hero />
      <div id="browse" className="scroll-mt-20 space-y-5 pt-8">
        <h2 className="text-center text-2xl font-black uppercase tracking-widest text-[#0f3d2e] sm:text-3xl">Fresh Finds</h2>
        <CategoryFilter q={q} cat={cat} />
        <ListingGrid
          key={`${q}|${cat}|${page}`}
          q={q}
          cat={cat}
          page={page}
          initial={(data ?? []) as Listing[]}
          viewerId={user?.id ?? null}
        />
        <Pagination q={q} cat={cat} page={page} totalPages={totalPages} />
      </div>
    </div>
  );
}
