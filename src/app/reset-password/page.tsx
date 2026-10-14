import { redirect } from "next/navigation";
import { createClient, getUserId } from "@/lib/supabase/server";
import PasswordForm from "@/components/PasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  // Reached only through the emailed link, which signs the user in first.
  if (!userId) redirect("/forgot-password");
  return <PasswordForm mode="reset" />;
}
