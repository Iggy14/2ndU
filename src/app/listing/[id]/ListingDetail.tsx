"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FULFILLMENT_LABEL, type Listing, isNegotiating } from "@/lib/types";
import FavoriteButton from "@/components/FavoriteButton";
import ListingGallery from "./ListingGallery";

const label = "text-[11px] font-bold uppercase tracking-widest text-slate-500";
const TABS = [
  { key: "details", label: "Details" },
  { key: "delivery", label: "Delivery" },
  { key: "safety", label: "Safety" },
] as const;

export default function ListingDetail({
  initial,
  sellerName,
  viewerId,
  favorited,
}: {
  favorited: boolean;
  initial: Listing;
  sellerName: string;
  viewerId: string | null;
}) {
  const router = useRouter();
  const [listing, setListing] = useState(initial);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("details");
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
    <div className="grid gap-8 pt-8 md:grid-cols-[1.2fr_1fr] md:gap-12">
      <ListingGallery images={listing.images} title={listing.title} sold={sold} />

      <div className="space-y-5">
        {sold && (
          <div className="bg-[#0f3d2e] px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-white">
            This item has been sold.
          </div>
        )}
        {negotiating && (
          <div className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <b>Someone is negotiating for this item.</b> Contact the seller fast if you want it!
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-slate-900 sm:text-3xl">{listing.title}</h1>
            <p className="mt-2 text-xs text-slate-500">
              Sold by{" "}
              <Link href={`/seller/${listing.seller_id}`} className="font-bold text-[#0f3d2e] underline">
                {sellerName}
              </Link>
            </p>
          </div>
          <FavoriteButton listingId={listing.id} viewerId={viewerId} initial={favorited} className="shrink-0 border border-slate-200" />
        </div>

        {listing.description && (
          <div className="space-y-2">
            <p className={label}>Description</p>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{listing.description}</p>
          </div>
        )}

        <div className="space-y-1 border-t border-slate-200 pt-5">
          <p className={label}>Price</p>
          <p className="text-4xl font-black tracking-tight text-[#0f3d2e]">฿{listing.price.toLocaleString()}</p>
        </div>

        {isOwner ? (
          <Link href="/sell/mine" className="inline-block border border-[#0f3d2e] px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e] hover:bg-[#0f3d2e] hover:text-white">
            Manage in My listings
          </Link>
        ) : (
          <button
            onClick={startChat}
            disabled={busy || sold}
            className="w-full bg-[#0f3d2e] px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-[#0f3d2e]/90 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
          >
            {sold ? "Sold out" : busy ? "Opening chat…" : "Chat with seller"}
          </button>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="border-t border-slate-200 pt-4">
          <div className="flex gap-6 border-b border-slate-200">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 pb-2 text-[11px] font-bold uppercase tracking-widest ${tab === t.key ? "border-[#0f3d2e] text-[#0f3d2e]" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="space-y-2 pt-4 text-sm text-slate-700">
            {tab === "details" && <p><span className={label}>Location: </span>{listing.location_text}</p>}
            {tab === "delivery" && (
              <>
                <p><span className={label}>Handover: </span>{FULFILLMENT_LABEL[listing.fulfillment]}</p>
                {listing.delivery_note && <p><span className={label}>Notes: </span>{listing.delivery_note}</p>}
              </>
            )}
            {tab === "safety" && <p>Payment is arranged directly with the seller. Meet on campus and inspect the item before you pay.</p>}
          </div>
        </div>

        {!isOwner && (
          <div className="text-xs text-slate-500">
            {reported ? "Thanks, an admin will review this listing." : reporting ? (
              <div className="space-y-2">
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="What's wrong with this listing?" className="w-full border border-slate-300 p-2 text-sm focus:border-[#0f3d2e] focus:outline-none" />
                <button disabled={reason.trim().length < 3} onClick={submitReport} className="bg-red-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white disabled:opacity-50">Send report</button>
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
