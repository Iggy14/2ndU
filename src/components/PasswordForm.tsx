"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthSplit from "@/components/AuthSplit";

const input = "w-full border border-slate-300 px-4 py-3 text-sm focus:border-[#0f3d2e] focus:outline-none";
const button = "w-full bg-[#0f3d2e] py-3.5 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-[#0f3d2e]/90 disabled:opacity-50";

// "forgot": asks for an email and sends the reset link. "reset": sets the new password
// (the user arrives signed in via the emailed link, see /auth/confirm).
export default function PasswordForm({ mode }: { mode: "forgot" | "reset" }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(value.trim(), {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      });
      setBusy(false);
      if (error) return setError(error.message);
      return setSent(true);
    }
    const { error } = await supabase.auth.updateUser({ password: value });
    setBusy(false);
    if (error) return setError(error.message);
    router.push("/");
    router.refresh();
  }

  return (
    <AuthSplit
      title={mode === "forgot" ? "Forgot password" : "New password"}
      subtitle={mode === "forgot" ? "Enter your account email and we'll send you a link to reset your password." : "Choose a new password for your account."}
    >
    <form onSubmit={submit} className="space-y-5">
      {sent ? (
        <p className="text-sm text-[#0f3d2e]">If that email has an account, a reset link is on its way. Check your inbox.</p>
      ) : (
        <>
          <input
            className={input}
            type={mode === "forgot" ? "email" : "password"}
            required
            minLength={mode === "reset" ? 8 : undefined}
            placeholder={mode === "forgot" ? "Email" : "New password (min 8 characters)"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={busy} className={button}>
            {busy ? "Please wait…" : mode === "forgot" ? "Send reset link" : "Save password"}
          </button>
        </>
      )}
      {mode === "forgot" && (
        <p className="text-center text-sm text-slate-600">
          <Link className="font-bold text-[#0f3d2e] underline" href="/login">Back to log in</Link>
        </p>
      )}
    </form>
    </AuthSplit>
  );
}
