"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { type Listing, isNegotiating } from "@/lib/types";

export default function MyListings({ initial }: { initial: Listing[] }) {
  const [listings, setListings] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(id: string, status: "sold" | "available") {
    setError(null);
    const { data, error } = await createClient()
      .from("listings")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return setError(error.message);
    setListings((cur) => cur.map((l) => (l.id === id ? (data as Listing) : l)));
  }

  async function remove(id: string) {
    if (!confirm("Delete this listing permanently?")) return;
    const { error } = await createClient().from("listings").delete().eq("id", id);
    if (error) return setError(error.message);
    setListings((cur) => cur.filter((l) => l.id !== id));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pt-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black uppercase tracking-widest text-[#0f3d2e] sm:text-3xl">My listings</h1>
        <Link href="/sell/new" className="bg-[#0f3d2e] px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-[#0f3d2e]/90">
          Post item
        </Link>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {listings.length === 0 && <p className="text-sm text-slate-500">You haven&apos;t posted anything yet.</p>}
      <ul className="space-y-3">
        {listings.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center gap-3 border border-slate-200 bg-white p-3 sm:gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.images[0]} alt="" className="size-20 object-cover" />
            <div className="min-w-0 flex-1">
              <Link href={`/listing/${l.id}`} className="block truncate text-[11px] font-bold uppercase tracking-widest text-slate-900 hover:text-[#0f3d2e]">{l.title}</Link>
              <p className="mt-1 text-lg font-black tracking-tight text-[#0f3d2e]">฿{l.price.toLocaleString()}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {l.status === "removed" ? "Removed by admin" : l.status === "sold" ? "Sold" : isNegotiating(l) ? "Being negotiated" : "Available"}
              </p>
            </div>
            {l.status !== "removed" && (
              <Link href={`/sell/${l.id}/edit`} className="border border-[#0f3d2e] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e] hover:bg-[#0f3d2e] hover:text-white">
                Edit
              </Link>
            )}
            {l.status === "available" && (
              <button onClick={() => setStatus(l.id, "sold")} className="bg-[#0f3d2e] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-[#0f3d2e]/90">
                Mark as sold
              </button>
            )}
            {l.status === "sold" && (
              <button onClick={() => setStatus(l.id, "available")} className="border border-[#0f3d2e] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e] hover:bg-[#0f3d2e] hover:text-white">
                Relist
              </button>
            )}
            <button onClick={() => remove(l.id)} className="px-2 text-[11px] font-bold uppercase tracking-widest text-red-600 hover:underline">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
