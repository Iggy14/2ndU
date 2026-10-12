import Link from "next/link";
import { type Listing, isNegotiating } from "@/lib/types";

export default function ListingCard({ listing, viewerId }: { listing: Listing; viewerId?: string | null }) {
  const sold = listing.status === "sold";
  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group overflow-hidden rounded-lg border border-slate-200 bg-white hover:shadow-md"
    >
      <div className="relative aspect-square bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={listing.images[0]} alt={listing.title} className={`h-full w-full object-cover ${sold ? "opacity-50" : ""}`} />
        {sold && (
          <span className="absolute left-2 top-2 rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">SOLD</span>
        )}
        {isNegotiating(listing, viewerId) && (
          <span className="absolute left-2 top-2 rounded bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
            Being negotiated
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium group-hover:text-emerald-700">{listing.title}</p>
        <p className="text-lg font-bold text-emerald-700">฿{listing.price.toLocaleString()}</p>
        <p className="truncate text-xs text-slate-500">{listing.location_text}</p>
      </div>
    </Link>
  );
}
