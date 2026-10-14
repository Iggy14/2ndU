import { notFound } from "next/navigation";
import { createClient, getUserId } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";
import ListingCard from "@/components/ListingCard";

export default async function SellerPage({ params }: PageProps<"/seller/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const userId = await getUserId(supabase);

  // Only public fields: student ID and school email stay out of this page.
  const { data: seller } = await supabase
    .from("profiles")
    .select("display_name, is_seller, banned, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!seller || !seller.is_seller || seller.banned) notFound();

  const [{ data }, { data: favs }] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("seller_id", id)
      .neq("status", "removed")
      .order("status", { ascending: true })
      .order("created_at", { ascending: false }),
    userId ? supabase.from("favorites").select("listing_id").eq("user_id", userId) : Promise.resolve({ data: [] }),
  ]);
  const listings = (data ?? []) as Listing[];
  const favoriteIds = new Set((favs ?? []).map((f) => f.listing_id));
  const available = listings.filter((l) => l.status === "available").length;
  const sold = listings.length - available;
  const since = new Date(seller.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="space-y-8 pt-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-20 items-center justify-center bg-[#0f3d2e] text-3xl font-black text-white" aria-hidden>
          {(seller.display_name || "?").charAt(0).toUpperCase()}
        </span>
        <h1 className="text-2xl font-black uppercase tracking-widest text-[#0f3d2e] sm:text-3xl">{seller.display_name || "Seller"}</h1>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e]">
          Member since {since} · {available} for sale · {sold} sold
        </p>
      </header>
      {listings.length === 0 ? (
        <p className="py-12 text-center text-slate-500">This seller has no listings yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} viewerId={userId} favorited={favoriteIds.has(l.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
