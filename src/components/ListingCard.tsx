import Link from "next/link";
import { type Listing, isNegotiating } from "@/lib/types";

export default function ListingCard({ listing, viewerId }: { listing: Listing; viewerId?: string | null }) {
  const sold = listing.status === "sold";
  return (
    <Link href={`/listing/${listing.id}`} className="group block text-center">
      <div className="relative aspect-square overflow-hidden bg-slate-100 ring-0 ring-[#0f3d2e] transition-shadow group-hover:ring-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.images[0]}
          alt={listing.title}
          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${sold ? "opacity-50" : ""}`}
        />
        {sold && (
          <span className="absolute left-0 top-0 bg-[#0f3d2e] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
            Sold
          </span>
        )}
        {isNegotiating(listing, viewerId) && (
          <span className="absolute left-0 top-0 bg-amber-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
            Being negotiated
          </span>
        )}
      </div>
      <p className="mt-3 truncate text-[11px] font-bold uppercase tracking-widest text-slate-900">{listing.title}</p>
      <p className="mt-1 text-xl font-black tracking-tight text-[#0f3d2e]">฿{listing.price.toLocaleString()}</p>
      <p className="truncate text-xs text-slate-500">{listing.location_text}</p>
    </Link>
  );
}
