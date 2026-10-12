"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FULFILLMENT_LABEL, type Listing, isNegotiating } from "@/lib/types";

export default function ListingDetail({
  initial,
  sellerName,
  viewerId,
}: {
  initial: Listing;
  sellerName: string;
  viewerId: string | null;
}) {
  const router = useRouter();
  const [listing, setListing] = useState(initial);
  const [photo, setPhoto] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [reported, setReported] = useState(false);

  // Live updates: sold status and negotiating banner reach everyone viewing this page.
  useEffect(() => {
    const supabase = createClient();

    // Backup if the realtime socket is down: re-read the row every few seconds.
    const sync = async () => {
      if (document.visibilityState !== "visible") return;
      const { data } = await supabase.from("listings").select("*").eq("id", initial.id).maybeSingle();
      if (data) {
        const next = data as Listing;
        setListing((cur) => (JSON.stringify(cur) === JSON.stringify(next) ? cur : next));
      }
    };
    const timer = setInterval(sync, 4000);
    window.addEventListener("focus", sync);

    const channel = supabase
      .channel(`listing-${initial.id}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "listings", filter: `id=eq.${initial.id}` },
        (payload) => setListing(payload.new as Listing),
      )
      .subscribe();
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", sync);
      supabase.removeChannel(channel);
    };
  }, [initial.id]);

  const isOwner = viewerId === listing.seller_id;
  const sold = listing.status === "sold";
  const negotiating = isNegotiating(listing, viewerId);

  async function startChat() {
    if (!viewerId) return router.push(`/login?next=/listing/${listing.id}`);
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const existing = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("buyer_id", viewerId)
      .maybeSingle();
    let convId = existing.data?.id;
    if (!convId) {
      const created = await supabase
        .from("conversations")
        .insert({ listing_id: listing.id, buyer_id: viewerId, seller_id: listing.seller_id })
        .select("id")
        .single();
      if (created.error) {
        setBusy(false);
        return setError(created.error.message);
      }
      convId = created.data.id;
    }
    router.push(`/inbox/${convId}`);
  }

  async function submitReport() {
    if (!viewerId) return router.push(`/login?next=/listing/${listing.id}`);
    const { error } = await createClient()
      .from("reports")
      .insert({ listing_id: listing.id, reporter_id: viewerId, reason: reason.trim() });
    if (error) return setError(error.message);
    setReported(true);
    setReporting(false);
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="aspect-square overflow-hidden rounded-lg bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={listing.images[photo]} alt={listing.title} className={`h-full w-full object-cover ${sold ? "opacity-60" : ""}`} />
        </div>
        {listing.images.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {listing.images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" onClick={() => setPhoto(i)}
                className={`h-16 w-16 cursor-pointer rounded object-cover ${i === photo ? "ring-2 ring-emerald-600" : ""}`} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {sold && (
          <div className="rounded-md bg-slate-800 px-4 py-3 text-sm font-semibold text-white">
            This item has been sold.
          </div>
        )}
        {negotiating && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <b>Someone is negotiating for this item.</b> Contact the seller fast if you want it!
          </div>
        )}

        <h1 className="text-2xl font-bold">{listing.title}</h1>
        <p className="text-3xl font-bold text-emerald-700">฿{listing.price.toLocaleString()}</p>

        <dl className="space-y-1 text-sm">
          <div><dt className="inline font-medium">Seller: </dt><dd className="inline">{sellerName}</dd></div>
          <div><dt className="inline font-medium">Location: </dt><dd className="inline">{listing.location_text}</dd></div>
          <div><dt className="inline font-medium">Handover: </dt><dd className="inline">{FULFILLMENT_LABEL[listing.fulfillment]}</dd></div>
          {listing.delivery_note && <div><dt className="inline font-medium">Delivery notes: </dt><dd className="inline">{listing.delivery_note}</dd></div>}
        </dl>

        {listing.description && <p className="whitespace-pre-wrap text-sm text-slate-700">{listing.description}</p>}

        {isOwner ? (
          <Link href="/sell/mine" className="inline-block rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:border-emerald-600">
            Manage in My listings
          </Link>
        ) : (
          <button
            onClick={startChat}
            disabled={busy || sold}
            className="rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            💬 {sold ? "Sold out" : busy ? "Opening chat…" : "Chat with seller"}
          </button>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <p className="rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600">
          Payment is arranged directly with the seller. Meet on campus and inspect the item before you pay.
        </p>

        {!isOwner && (
          <div className="text-xs text-slate-500">
            {reported ? "Thanks, an admin will review this listing." : reporting ? (
              <div className="space-y-2">
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="What's wrong with this listing?" className="w-full rounded border border-slate-300 p-2 text-sm" />
                <button disabled={reason.trim().length < 3} onClick={submitReport} className="rounded bg-red-600 px-3 py-1 text-white disabled:opacity-50">Send report</button>
              </div>
            ) : (
              <button onClick={() => setReporting(true)} className="underline">Report this listing</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
