import { notFound, redirect } from "next/navigation";
import { createClient, getUserId } from "@/lib/supabase/server";
import ListingForm from "@/components/ListingForm";
import type { Listing } from "@/lib/types";

export default async function EditListingPage({ params }: PageProps<"/sell/[id]/edit">) {
  const { id } = await params;
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) redirect(`/login?next=/sell/${id}/edit`);

  const { data: profile } = await supabase.from("profiles").select("is_seller, banned").eq("id", userId).single();
  if (!profile?.is_seller) redirect("/become-seller");
  if (profile.banned) redirect("/");

  const { data: listing } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  // Only the owner edits; removed listings are locked (an admin took them down).
  if (!listing || listing.seller_id !== userId || listing.status === "removed") notFound();

  return (
    <ListingForm userId={userId} listing={listing as Listing} />
  );
}
