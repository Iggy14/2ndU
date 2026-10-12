import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSchoolEmail, isValidStudentId } from "@/lib/validation";
import BecomeSellerForm from "./BecomeSellerForm";

export default async function BecomeSellerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/become-seller");

  const { data: profile } = await supabase.from("profiles").select("is_seller").eq("id", user.id).single();
  if (profile?.is_seller) redirect("/");

  const emailVerified = !!user.email_confirmed_at && isSchoolEmail(user.email ?? "");

  // Signed up as a seller: the student ID was saved with the account, and the confirmation
  // link just verified the school email, so finish the application without asking again.
  const signupId = user.user_metadata?.student_id;
  if (emailVerified && typeof signupId === "string" && isValidStudentId(signupId)) {
    const { error } = await supabase.rpc("become_seller", { p_student_id: signupId });
    if (!error) redirect("/sell/new");
  }
  // A pending email change means the confirmation link hasn't been clicked yet.
  const pendingEmail = user.new_email ?? null;

  return <BecomeSellerForm email={user.email ?? ""} emailVerified={emailVerified} pendingEmail={pendingEmail} />;
}
