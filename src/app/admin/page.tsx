import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminPanel, { type ReportRow } from "./AdminPanel";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") notFound();

  const { data: reports } = await supabase
    .from("reports")
    .select("id, reason, created_at, resolved, listings(id, title, status, seller_id, profiles:seller_id(display_name, banned, student_id))")
    .eq("resolved", false)
    .order("created_at", { ascending: false });

  return <AdminPanel initial={(reports ?? []) as unknown as ReportRow[]} />;
}
