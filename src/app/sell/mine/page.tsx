import { redirect } from "next/navigation";
import { createClient, getUserId } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";
import MyListings from "./MyListings";

export default async function MyListingsPage() {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) redirect("/login?next=/sell/mine");
  const { data: profile } = await supabase.from("profiles").select("is_seller").eq("id", userId).single();
  if (!profile?.is_seller) redirect("/become-seller");

  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });

  return <MyListings initial={(data ?? []) as Listing[]} />;
}
