import Link from "next/link";
import ListingCard from "../ListingCard";
import Reveal from "../Reveal";
import type { Listing } from "@/lib/types";

// Newest listings preview for the home page. Static server render; the live grid is on /browse.
export default function JustListed({
  listings,
  viewerId,
  favoriteIds,
  showNegotiating = true,
}: {
  listings: Listing[];
  viewerId: string | null;
  favoriteIds: string[];
  showNegotiating?: boolean;
}) {
  if (listings.length === 0) return null;
  return (
    <section className="space-y-6 pt-20">
      <Reveal className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-black uppercase tracking-widest text-[#0f3d2e] sm:text-3xl">Just listed</h2>
        <Link
          href="/browse"
          className="shrink-0 border-b-2 border-[#0f3d2e] pb-0.5 text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e] transition-colors duration-200 hover:bg-[#0f3d2e] hover:px-2 hover:text-white"
        >
          View all
        </Link>
      </Reveal>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {listings.map((l) => (
          <ListingCard key={l.id} listing={l} viewerId={viewerId} favorited={favoriteIds.includes(l.id)} showNegotiating={showNegotiating} />
        ))}
      </div>
    </section>
  );
}
