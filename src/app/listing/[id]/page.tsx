import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";
import ListingDetail from "./ListingDetail";

export default async function ListingPage({ params }: PageProps<"/listing/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listing } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  if (!listing) notFound();

  const { data: seller } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", listing.seller_id)
    .single();

  const { data: fav } = user
    ? await supabase.from("favorites").select("listing_id").eq("user_id", user.id).eq("listing_id", id).maybeSingle()
    : { data: null };

  return (
    <ListingDetail
      initial={listing as Listing}
      favorited={!!fav}
      sellerName={seller?.display_name ?? "Seller"}
      viewerId={user?.id ?? null}
    />
  );
}
