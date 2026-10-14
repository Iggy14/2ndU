import { redirect } from "next/navigation";
import { createClient, getUserId } from "@/lib/supabase/server";
import ListingForm from "@/components/ListingForm";

export default async function NewListingPage() {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) redirect("/login?next=/sell/new");
  const { data: profile } = await supabase.from("profiles").select("is_seller, banned").eq("id", userId).single();
  if (!profile?.is_seller) redirect("/become-seller");
  if (profile.banned) redirect("/");

  return <ListingForm userId={userId} />;
}
