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

  return (
    <ListingDetail
      initial={listing as Listing}
      sellerName={seller?.display_name ?? "Seller"}
      viewerId={user?.id ?? null}
    />
  );
}
