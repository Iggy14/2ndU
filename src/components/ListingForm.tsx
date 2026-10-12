"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resizeImage } from "@/lib/images";
import { CATEGORIES, FULFILLMENT_LABEL, type Listing } from "@/lib/types";
import { IMAGES_MAX, IMAGES_MIN, PRICE_MAX, PRICE_MIN, validateListing } from "@/lib/validation";

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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const input = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none";
  const label = "block space-y-1 text-sm font-medium";
  const total = kept.length + files.length;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const price = Number(f.get("price"));
    const problem = validateListing({ price, imageCount: total });
    if (problem) return setError(problem);

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
        category: String(f.get("category")),
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
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold">{editing ? "Edit listing" : "Post an item"}</h1>

      <label className={label}>Title
        <input name="title" required minLength={3} maxLength={100} defaultValue={listing?.title} className={input} placeholder="e.g. Samsung fridge 7 cu.ft." />
      </label>
      <label className={label}>Price (THB)
        <input name="price" type="number" required min={PRICE_MIN} max={PRICE_MAX} defaultValue={listing?.price} className={input} />
        <span className="text-xs font-normal text-slate-500">{PRICE_MIN}–{PRICE_MAX.toLocaleString()} THB</span>
      </label>
      <label className={label}>Category
        <select name="category" defaultValue={listing?.category} className={`${input} capitalize`}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className={label}>Description
        <textarea name="description" rows={4} maxLength={2000} defaultValue={listing?.description} className={input} placeholder="Condition, age, brand, reason for selling…" />
      </label>

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

      <div className={label}>
        Photos ({IMAGES_MIN}–{IMAGES_MAX})
        {kept.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {kept.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-20 w-20 rounded object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => setKept((cur) => cur.filter((u) => u !== url))}
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-600 text-xs leading-5 text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file" accept="image/*" multiple
          disabled={kept.length >= IMAGES_MAX}
          onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, IMAGES_MAX - kept.length))}
          className="block w-full text-sm"
        />
        <span className="text-xs font-normal text-slate-500">
          {editing ? `${kept.length} kept + ${files.length} new` : `${files.length} selected`} · {total}/{IMAGES_MAX}
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button disabled={busy} className="flex-1 rounded-md bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
          {busy ? "Saving…" : editing ? "Save changes" : "Publish"}
        </button>
        {editing && (
          <button type="button" disabled={busy} onClick={() => router.back()} className="rounded-md border border-slate-300 px-4 text-sm hover:border-emerald-600">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
