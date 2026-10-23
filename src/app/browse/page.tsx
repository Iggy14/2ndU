import { Suspense } from "react";
import { createClient, getUserId } from "@/lib/supabase/server";
import ListingGrid from "@/components/ListingGrid";
import BrowseSearch from "@/components/browse/BrowseSearch";
import FilterPanel from "@/components/browse/FilterPanel";
import MobileFilters from "@/components/browse/MobileFilters";
import SortSelect from "@/components/browse/SortSelect";
import ActiveFilters from "@/components/browse/ActiveFilters";
import { GridSkeleton } from "@/components/skeleton/Skeletons";
import type { Listing } from "@/lib/types";
import Pagination from "@/components/Pagination";
import { homeListingsQuery, parseFilters, PAGE_SIZE, type ListingFilters } from "@/lib/listingsQuery";

type SearchParams = PageProps<"/browse">["searchParams"];

// The page shell (green band, title) is static. The URL-dependent parts stream in behind Suspense,
// and the database query is the innermost boundary so the sidebar and sort appear before the results.
export default function Browse({ searchParams }: PageProps<"/browse">) {
  return (
    <div>
      <section className="ml-[calc(50%-50vw)] w-screen bg-[#0f3d2e] px-4 py-10 text-white sm:py-14">
        <div className="mx-auto w-full max-w-5xl space-y-5">
          <h1 className="text-3xl font-black uppercase tracking-widest sm:text-5xl">Fresh Finds</h1>
          <Suspense fallback={<div className="h-14 bg-white/10" aria-hidden />}>
            <SearchBar searchParams={searchParams} />
          </Suspense>
        </div>
      </section>

      <Suspense fallback={<GridSkeleton count={8} className="pt-8 lg:grid-cols-4" />}>
        <Body searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchBar({ searchParams }: { searchParams: SearchParams }) {
  return <BrowseSearch filters={parseFilters(await searchParams)} />;
}

async function Body({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(await searchParams);
  return (
    <div className="grid gap-8 pt-8 md:grid-cols-[13rem_1fr]">
      <aside className="hidden md:block">
        <div className="sticky top-28">
          <FilterPanel filters={filters} />
        </div>
      </aside>
      <div className="min-w-0 space-y-5">
        <Suspense
          key={JSON.stringify(filters)}
          fallback={
            <>
              <div className="flex justify-end gap-3">
                <MobileFilters filters={filters} />
                <SortSelect filters={filters} />
              </div>
              <GridSkeleton count={12} />
            </>
          }
        >
          <Results filters={filters} />
        </Suspense>
      </div>
    </div>
  );
}

async function Results({ filters }: { filters: ListingFilters }) {
  const supabase = await createClient();
  const userId = await getUserId(supabase);

  const { data, count } = await homeListingsQuery(supabase, filters);
  const { data: favs } = userId
    ? await supabase.from("favorites").select("listing_id").eq("user_id", userId)
    : { data: [] };
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600" aria-live="polite">
          <span className="text-lg font-black text-[#0f3d2e]">{total.toLocaleString()}</span>{" "}
          {total === 1 ? "item" : "items"}
        </p>
        <div className="flex items-center gap-3">
          <MobileFilters filters={filters} />
          <SortSelect filters={filters} />
        </div>
      </div>
      <ActiveFilters filters={filters} />
      <ListingGrid
        key={JSON.stringify(filters)}
        filters={filters}
        initial={(data ?? []) as Listing[]}
        viewerId={userId}
        favoriteIds={(favs ?? []).map((f) => f.listing_id)}
      />
      <Pagination filters={filters} totalPages={totalPages} />
    </>
  );
}
