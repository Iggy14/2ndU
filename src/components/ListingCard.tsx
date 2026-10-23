import Link from "next/link";
import Image from "next/image";
import { type Listing, isNegotiating } from "@/lib/types";
import FavoriteButton from "./FavoriteButton";
import Price from "./Price";

export default function ListingCard({
  listing,
  viewerId,
  favorited = false,
  showNegotiating = true,
}: {
  listing: Listing;
  viewerId?: string | null;
  favorited?: boolean;
  // The badge depends on the current time; turn it off where the card is prerendered.
  showNegotiating?: boolean;
}) {
  const sold = listing.status === "sold";
  return (
    <div className="relative">
    <Link href={`/listing/${listing.id}`} className="group block text-center">
      <div className="relative aspect-square overflow-hidden bg-slate-100 ring-0 ring-[#0f3d2e] transition-shadow group-hover:ring-2">
        <Image
          src={listing.images[0]}
          alt={listing.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${sold ? "opacity-50" : ""}`}
        />
        {sold && (
          <span className="absolute bottom-0 left-0 bg-[#0f3d2e] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
            Sold
          </span>
        )}
        {showNegotiating && isNegotiating(listing, viewerId) && (
          <span className="absolute bottom-0 left-0 bg-amber-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
            Being negotiated
          </span>
        )}
      </div>
      <p className="mt-3 truncate text-[11px] font-bold uppercase tracking-widest text-slate-900">{listing.title}</p>
      <Price price={listing.price} originalPrice={listing.original_price} className="mt-1 text-xl" />
      <p className="truncate text-xs text-slate-500">{listing.location_text}</p>
    </Link>
    <FavoriteButton
      listingId={listing.id}
      viewerId={viewerId ?? null}
      initial={favorited}
      className="absolute right-0 top-0"
    />
    </div>
  );
}
