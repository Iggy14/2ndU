"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthSplit from "@/components/AuthSplit";
import { SCHOOL_EMAIL_DOMAIN, isSchoolEmail, isValidStudentId } from "@/lib/validation";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(params.get("error"));
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wantsToSell, setWantsToSell] = useState(false);
  const [studentId, setStudentId] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();

    if (mode === "signup") {
      if (wantsToSell) {
        if (!isSchoolEmail(email)) { setBusy(false); return setError(`To sell, sign up with your school email ending in @${SCHOOL_EMAIL_DOMAIN}.`); }
        if (!isValidStudentId(studentId)) { setBusy(false); return setError("Student ID must be 7 digits starting with 6, e.g. 6603282."); }
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${wantsToSell ? "/become-seller" : "/"}`,
          data: wantsToSell ? { student_id: studentId.trim() } : undefined,
        },
      });
      setBusy(false);
      if (error) return setError(error.message);
      if (!data.session) return setNotice(
          wantsToSell
            ? "Check your school inbox and click the confirmation link. You'll become a seller automatically."
            : "Check your inbox and click the confirmation link, then log in.",
        );
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        setUnconfirmed(error.code === "email_not_confirmed");
        return setError(error.message);
      }
    }
    const next = params.get("next");
    router.push(next && next.startsWith("/") ? next : "/");
    router.refresh();
  }

  async function resend() {
    const { error } = await createClient().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=/` },
    });
    if (error) return setError(error.message);
    setError(null);
    setUnconfirmed(false);
    setNotice("Confirmation email sent again. Check your inbox.");
  }

  const input = "w-full border border-slate-300 px-4 py-3 text-sm focus:border-[#0f3d2e] focus:outline-none";

  return (
    <AuthSplit
      title={mode === "login" ? "Welcome back" : "Create an account"}
      subtitle={mode === "login" ? "Log in to your account." : "Join Rangsit's second-hand marketplace."}
    >
    <form onSubmit={submit} className="space-y-5">
      {mode === "signup" && (
        <>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Account type">
            {[
              { sell: false, title: "Just buying", hint: "Any email" },
              { sell: true, title: "Buy and sell", hint: `Rangsit students (@${SCHOOL_EMAIL_DOMAIN})` },
            ].map((o) => (
              <button
                key={o.title}
                type="button"
                role="radio"
                aria-checked={wantsToSell === o.sell}
                onClick={() => setWantsToSell(o.sell)}
                className={`border p-3 text-left ${wantsToSell === o.sell ? "border-[#0f3d2e] bg-[#0f3d2e] text-white" : "border-slate-300 text-slate-900 hover:border-[#0f3d2e]"}`}
              >
                <span className="block text-[11px] font-bold uppercase tracking-widest">{o.title}</span>
                <span className="block text-xs opacity-80">{o.hint}</span>
              </button>
            ))}
          </div>
          {wantsToSell && <p className="text-sm text-slate-600">Use your school email below. We&apos;ll send the confirmation link there, and that verifies you as a student.</p>}
        </>
      )}
      <input className={input} type="email" required placeholder={mode === "signup" && wantsToSell ? `you@${SCHOOL_EMAIL_DOMAIN}` : "Email"} value={email} onChange={(e) => setEmail(e.target.value)} />
      {mode === "signup" && wantsToSell && (
        <input className={input} inputMode="numeric" required maxLength={7} placeholder="Student ID (7 digits)" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
      )}
      <input className={input} type="password" required minLength={8} placeholder="Password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {unconfirmed && (
        <button type="button" onClick={resend} className="text-sm font-bold text-[#0f3d2e] underline">
          Resend confirmation email
        </button>
      )}
      {notice && <p className="text-sm text-[#0f3d2e]">{notice}</p>}
      <button disabled={busy} className="w-full bg-[#0f3d2e] py-3.5 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-[#0f3d2e]/90 disabled:opacity-50">
        {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
      </button>
      {mode === "login" && (
        <p className="text-center text-sm">
          <Link className="font-bold text-[#0f3d2e] underline" href="/forgot-password">Forgot password?</Link>
        </p>
      )}
      <p className="text-center text-sm text-slate-600">
        {mode === "login" ? (
          <>No account? <Link className="font-bold text-[#0f3d2e] underline" href="/signup">Sign up</Link></>
        ) : (
          <>Already registered? <Link className="font-bold text-[#0f3d2e] underline" href="/login">Log in</Link></>
        )}
      </p>
    </form>
    </AuthSplit>
  );
}
