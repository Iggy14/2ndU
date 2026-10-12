import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListingForm from "@/components/ListingForm";
import type { Listing } from "@/lib/types";

export default async function EditListingPage({ params }: PageProps<"/sell/[id]/edit">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/sell/${id}/edit`);

  const { data: profile } = await supabase.from("profiles").select("is_seller, banned").eq("id", user.id).single();
  if (!profile?.is_seller) redirect("/become-seller");
  if (profile.banned) redirect("/");

  const { data: listing } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  // Only the owner edits; removed listings are locked (an admin took them down).
  if (!listing || listing.seller_id !== user.id || listing.status === "removed") notFound();

  return (
    <ListingForm userId={user.id} listing={listing as Listing} />
  );
}
