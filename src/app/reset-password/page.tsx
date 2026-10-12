import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PasswordForm from "@/components/PasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Reached only through the emailed link, which signs the user in first.
  if (!user) redirect("/forgot-password");
  return <PasswordForm mode="reset" />;
}
