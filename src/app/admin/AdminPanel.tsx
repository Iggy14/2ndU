"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export type ReportRow = {
  id: string;
  reason: string;
  created_at: string;
  listings: {
    id: string;
    title: string;
    status: string;
    seller_id: string;
    profiles: { display_name: string; banned: boolean; student_id: string | null } | null;
  } | null;
};

export default function AdminPanel({ initial }: { initial: ReportRow[] }) {
  const [reports, setReports] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const drop = (id: string) => setReports((cur) => cur.filter((r) => r.id !== id));
  const check = (error: { message: string } | null) => {
    if (error) setError(error.message);
    return !error;
  };

  async function resolve(r: ReportRow) {
    if (check((await supabase.from("reports").update({ resolved: true }).eq("id", r.id)).error)) drop(r.id);
  }
  async function removeListing(r: ReportRow) {
    if (!r.listings) return;
    const res = await supabase.from("listings").update({ status: "removed" }).eq("id", r.listings.id);
    if (check(res.error)) await resolve(r);
  }
  async function banSeller(r: ReportRow) {
    if (!r.listings || !confirm("Ban this seller? They won't be able to post or chat.")) return;
    const res = await supabase.from("profiles").update({ banned: true }).eq("id", r.listings.seller_id);
    if (check(res.error)) await removeListing(r);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pt-8">
      <h1 className="text-2xl font-black uppercase tracking-widest text-[#0f3d2e] sm:text-3xl">Open reports ({reports.length})</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {reports.length === 0 && <p className="text-sm text-slate-500">Nothing to review.</p>}
      <ul className="space-y-3">
        {reports.map((r) => (
          <li key={r.id} className="space-y-3 border border-slate-200 bg-white p-4">
            <p className="text-sm">
              <Link href={`/listing/${r.listings?.id}`} className="text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e] hover:underline">
                {r.listings?.title ?? "(deleted listing)"}
              </Link>{" "}
              <span className="text-slate-500">
                · seller {r.listings?.profiles?.display_name} ({r.listings?.profiles?.student_id ?? "no ID"})
                {r.listings?.profiles?.banned ? " · BANNED" : ""} · {r.listings?.status}
              </span>
            </p>
            <p className="text-sm text-slate-700">“{r.reason}”</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => resolve(r)} className="border border-[#0f3d2e] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e] hover:bg-[#0f3d2e] hover:text-white">Dismiss</button>
              <button onClick={() => removeListing(r)} className="bg-amber-600 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-amber-700">Remove listing</button>
              <button onClick={() => banSeller(r)} className="bg-red-600 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-red-700">Ban seller</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
