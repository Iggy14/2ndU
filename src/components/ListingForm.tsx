"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resizeImage } from "@/lib/images";
import { FULFILLMENT_LABEL, LISTING_CATEGORIES, type Listing } from "@/lib/types";
import { PRICE_MAX, PRICE_MIN, validateListing } from "@/lib/validation";
import PhotoUploader from "./PhotoUploader";

const BUCKET = "listing-images";

// Public URLs look like .../object/public/listing-images/<userId>/<file>.jpg
function storagePath(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

// Used for both posting (no `listing`) and editing (existing `listing`).
export default function ListingForm({ userId, listing }: { userId: string; listing?: Listing }) {
  const router = useRouter();
  const editing = !!listing;
  const [kept, setKept] = useState<string[]>(listing?.images ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<string[]>(listing?.categories ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const input = "w-full border border-slate-300 px-3 py-2 text-sm font-normal normal-case tracking-normal focus:border-[#0f3d2e] focus:outline-none";
  const label = "block space-y-1 text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e]";
  const total = kept.length + files.length;

  function toggleCategory(c: string) {
    setCategories((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const price = Number(f.get("price"));
    const problem = validateListing({ price, imageCount: total });
    if (problem) return setError(problem);
    if (!categories.length) return setError("Pick at least one category");

    setBusy(true);
    const uploaded: string[] = [];
    const supabase = createClient();
    try {
      for (const file of files) {
        const blob = await resizeImage(file);
        const path = `${userId}/${crypto.randomUUID()}.jpg`;
        const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw up.error;
        uploaded.push(path);
      }
      const images = [
        ...kept,
        ...uploaded.map((p) => supabase.storage.from(BUCKET).getPublicUrl(p).data.publicUrl),
      ];
      const fields = {
        title: String(f.get("title")).trim(),
        description: String(f.get("description")).trim(),
        price,
        categories,
        images,
        location_text: String(f.get("location")).trim(),
        fulfillment: String(f.get("fulfillment")) as Listing["fulfillment"],
        delivery_note: String(f.get("delivery_note")).trim(),
      };

      if (listing) {
        const { error } = await supabase.from("listings").update(fields).eq("id", listing.id);
        if (error) throw error;
        // Best effort: drop photos the seller removed so storage doesn't fill with orphans.
        const dropped = listing.images.filter((u) => !kept.includes(u)).map(storagePath).filter((p): p is string => !!p);
        if (dropped.length) await supabase.storage.from(BUCKET).remove(dropped);
        router.push(`/listing/${listing.id}`);
      } else {
        const { data, error } = await supabase
          .from("listings")
          .insert({ seller_id: userId, ...fields })
          .select("id")
          .single();
        if (error) throw error;
        router.push(`/listing/${data.id}`);
      }
      router.refresh();
    } catch (err) {
      // Don't leave freshly uploaded photos behind if saving failed.
      if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6 pt-8">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-widest text-[#0f3d2e] sm:text-3xl">{editing ? "Edit listing" : "List an item"}</h1>
        <p className="mt-1 text-sm text-slate-500">Never share private information (phone, address) in your listing. Use chat instead.</p>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-5">
          <label className={label}>Title
            <input name="title" required minLength={3} maxLength={100} defaultValue={listing?.title} className={input} placeholder="e.g. Samsung fridge 7 cu.ft." />
          </label>
          <label className={label}>Description
            <textarea name="description" rows={5} maxLength={2000} defaultValue={listing?.description} className={input} placeholder="Condition, age, brand, reason for selling…" />
          </label>
          <fieldset className={label}>
            <legend>Categories (pick one or more)</legend>
            <div className="flex flex-wrap gap-2 pt-1">
              {LISTING_CATEGORIES.map((c) => {
                const on = categories.includes(c);
                return (
                  <label key={c} className={`cursor-pointer border px-3 py-2 ${on ? "border-[#0f3d2e] bg-[#0f3d2e] text-white" : "border-slate-300 hover:border-[#0f3d2e]"}`}>
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleCategory(c)} />
                    {c}
                  </label>
                );
              })}
            </div>
            <span className="text-xs font-normal normal-case tracking-normal text-slate-500">Every item shows on the main page. Pick &ldquo;all&rdquo; if it fits no category; add categories to also show it when people filter by them.</span>
          </fieldset>
          <label className={label}>Where is the item?
            <input name="location" required minLength={2} maxLength={200} defaultValue={listing?.location_text} className={input} placeholder="e.g. Lake Rangsit apartments, building B" />
          </label>
          <label className={label}>Handover
            <select name="fulfillment" className={input} defaultValue={listing?.fulfillment ?? "pickup"}>
              {(Object.keys(FULFILLMENT_LABEL) as Listing["fulfillment"][]).map((k) => (
                <option key={k} value={k}>{FULFILLMENT_LABEL[k]}</option>
              ))}
            </select>
          </label>
          <label className={label}>Delivery notes (optional)
            <input name="delivery_note" maxLength={300} defaultValue={listing?.delivery_note} className={input} placeholder="Areas you can deliver to, extra fee, available times…" />
          </label>
        </div>

        <div className="space-y-8">
          <PhotoUploader kept={kept} setKept={setKept} files={files} setFiles={setFiles} />

          <div className="space-y-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#0f3d2e]">Add price</h2>
            <label className={label}>Price (THB)
              <input name="price" type="number" required min={PRICE_MIN} max={PRICE_MAX} defaultValue={listing?.price} className={input} />
              <span className="text-xs font-normal normal-case tracking-normal text-slate-500">{PRICE_MIN}–{PRICE_MAX.toLocaleString()} THB</span>
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button disabled={busy} className="flex-1 bg-[#0f3d2e] py-3 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-[#0f3d2e]/90 disabled:opacity-50">
              {busy ? "Saving…" : editing ? "Save changes" : "Publish"}
            </button>
            {editing && (
              <button type="button" disabled={busy} onClick={() => router.back()} className="border border-[#0f3d2e] px-6 text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e] hover:bg-[#0f3d2e] hover:text-white">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
