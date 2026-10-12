import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";
import ListingCard from "@/components/ListingCard";

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/favorites");

  const { data } = await supabase
    .from("favorites")
    .select("listing:listings(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  // Removed listings are hidden by RLS, so their embedded row comes back null.
  const listings = (data ?? []).map((f) => f.listing as unknown as Listing | null).filter((l): l is Listing => !!l);

  return (
    <div className="space-y-6 pt-8">
      <h1 className="text-center text-2xl font-black uppercase tracking-widest text-[#0f3d2e] sm:text-3xl">Favourites</h1>
      {listings.length === 0 ? (
        <p className="py-12 text-center text-slate-500">Nothing saved yet. Tap the heart on an item to keep it here.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} viewerId={user.id} favorited />
          ))}
        </div>
      )}
    </div>
  );
}
