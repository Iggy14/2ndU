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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My listings</h1>
        <Link href="/sell/new" className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
          Post item
        </Link>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {listings.length === 0 && <p className="text-slate-500">You haven&apos;t posted anything yet.</p>}
      <ul className="space-y-3">
        {listings.map((l) => (
          <li key={l.id} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.images[0]} alt="" className="h-16 w-16 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <Link href={`/listing/${l.id}`} className="block truncate font-medium hover:text-emerald-700">{l.title}</Link>
              <p className="text-sm text-slate-600">
                ฿{l.price.toLocaleString()} ·{" "}
                {l.status === "removed" ? "Removed by admin" : l.status === "sold" ? "Sold" : isNegotiating(l) ? "Being negotiated" : "Available"}
              </p>
            </div>
            {l.status !== "removed" && (
              <Link href={`/sell/${l.id}/edit`} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:border-emerald-600">
                Edit
              </Link>
            )}
            {l.status === "available" && (
              <button onClick={() => setStatus(l.id, "sold")} className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
                Mark as sold
              </button>
            )}
            {l.status === "sold" && (
              <button onClick={() => setStatus(l.id, "available")} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:border-emerald-600">
                Relist
              </button>
            )}
            <button onClick={() => remove(l.id)} className="text-sm text-red-600 hover:underline">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
