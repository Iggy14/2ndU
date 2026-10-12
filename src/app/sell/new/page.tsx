import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListingForm from "@/components/ListingForm";

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/sell/new");
  const { data: profile } = await supabase.from("profiles").select("is_seller, banned").eq("id", user.id).single();
  if (!profile?.is_seller) redirect("/become-seller");
  if (profile.banned) redirect("/");

  return <ListingForm userId={user.id} />;
}
