"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Listing } from "@/lib/types";
import { homeListingsQuery } from "@/lib/listingsQuery";
import ListingCard from "./ListingCard";
import Reveal from "./Reveal";

// Renders the grid and keeps it live: negotiating changes and new, sold or removed
// listings appear / disappear without a refresh. Realtime pushes are the fast path; a periodic
// re-query (same filters as the server render) is the backup if the socket is down.
export default function ListingGrid({
  initial,
  viewerId,
  favoriteIds,
  q,
  cat,
  page,
}: {
  initial: Listing[];
  viewerId: string | null;
  favoriteIds: string[];
  q: string;
  cat: string;
  page: number;
}) {
  const [listings, setListings] = useState(initial);

  useEffect(() => {
    const supabase = createClient();

    const sync = async () => {
      if (document.visibilityState !== "visible") return;
      const { data } = await homeListingsQuery(supabase, { q, cat, page });
      if (!data) return;
      const next = data as Listing[];
      setListings((cur) => (JSON.stringify(cur) === JSON.stringify(next) ? cur : next));
    };
    const timer = setInterval(sync, 5000);
    window.addEventListener("focus", sync);

    const channel = supabase
      .channel(`listings-grid-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, (payload) => {
        if (payload.eventType === "DELETE") {
          setListings((cur) => cur.filter((l) => l.id !== (payload.old as Listing).id));
          return;
        }
        const next = payload.new as Listing;
        setListings((cur) => {
          const rest = cur.filter((l) => l.id !== next.id);
          if (next.status !== "available") return rest;
          // Only keep rows that belong in the current view (initial set decides the filter).
          const existed = cur.some((l) => l.id === next.id);
          return existed ? cur.map((l) => (l.id === next.id ? next : l)) : rest;
        });
      })
      .subscribe();
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", sync);
      supabase.removeChannel(channel);
    };
  }, [q, cat, page]);

  if (listings.length === 0) {
    return <p className="py-12 text-center text-slate-500">No items found.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {listings.map((l, i) => (
        <Reveal key={l.id} delay={(i % 4) * 80}>
          <ListingCard listing={l} viewerId={viewerId} favorited={favoriteIds.includes(l.id)} />
        </Reveal>
      ))}
    </div>
  );
}
