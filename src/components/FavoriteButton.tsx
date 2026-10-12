"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Heart toggle. Optimistic: flips immediately and rolls back if the write fails.
export default function FavoriteButton({
  listingId,
  viewerId,
  initial,
  className = "",
}: {
  listingId: string;
  viewerId: string | null;
  initial: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!viewerId) return router.push(`/login?next=/listing/${listingId}`);
    if (busy) return;
    const next = !saved;
    setBusy(true);
    setSaved(next);
    const table = createClient().from("favorites");
    const { error } = next
      ? await table.insert({ user_id: viewerId, listing_id: listingId })
      : await table.delete().eq("user_id", viewerId).eq("listing_id", listingId);
    if (error) setSaved(!next);
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? "Remove from favourites" : "Save to favourites"}
      className={`flex size-9 items-center justify-center bg-white/90 text-[#0f3d2e] hover:bg-white ${className}`}
    >
      <HeartIcon className={`size-5 ${saved ? "fill-[#0f3d2e]" : ""}`} aria-hidden />
    </button>
  );
}
