"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthSplit from "@/components/AuthSplit";
import { SCHOOL_EMAIL_DOMAIN, isSchoolEmail, isValidStudentId } from "@/lib/validation";

type Props = { email: string; emailVerified: boolean; pendingEmail: string | null };

export default function BecomeSellerForm({ email, emailVerified, pendingEmail }: Props) {
  const router = useRouter();
  const [schoolEmail, setSchoolEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(!!pendingEmail);
  const [busy, setBusy] = useState(false);

  const input = "w-full border border-slate-300 px-4 py-3 text-sm focus:border-[#0f3d2e] focus:outline-none";
  const button = "w-full bg-[#0f3d2e] py-3.5 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-[#0f3d2e]/90 disabled:opacity-50";

  async function sendEmailLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isSchoolEmail(schoolEmail)) return setError(`Use your school email ending in @${SCHOOL_EMAIL_DOMAIN}.`);
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ email: schoolEmail.trim().toLowerCase() });
    setBusy(false);
    if (error) return setError(error.message);
    setSent(true);
  }

  async function submitId(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidStudentId(studentId)) return setError("Student ID must be 7 digits starting with 6, e.g. 6603282.");
    setBusy(true);
    const { error } = await createClient().rpc("become_seller", { p_student_id: studentId.trim() });
    setBusy(false);
    if (error) return setError(error.message);
    router.push("/");
    router.refresh();
  }

  return (
    <AuthSplit
      title="Become a seller"
      subtitle={
        <>
          <p className="text-base font-bold text-[#0f3d2e]">Sellers must be Rangsit University students</p>
          <p className="mt-1">Note: we check the format of your student ID.</p>
        </>
      }
    >
    <div className="space-y-5">

      {!emailVerified ? (
        <form onSubmit={sendEmailLink} className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Step 1 · Verify your school email</h2>
          <p className="text-sm text-slate-600">
            Your account email will change from <b>{email}</b> to your school email, which you&apos;ll use to log in from now on.
          </p>
          {sent ? (
            <p className="text-sm text-[#0f3d2e]">
              We sent a confirmation link{pendingEmail ? ` to ${pendingEmail}` : ""}. Click it, then come back to this page.
            </p>
          ) : (
            <>
              <input className={input} type="email" required placeholder={`you@${SCHOOL_EMAIL_DOMAIN}`} value={schoolEmail} onChange={(e) => setSchoolEmail(e.target.value)} />
              <button disabled={busy} className={button}>{busy ? "Sending…" : "Send confirmation link"}</button>
            </>
          )}
        </form>
      ) : (
        <form onSubmit={submitId} className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Step 2 · Enter your student ID</h2>
          <p className="text-sm font-bold text-[#0f3d2e]">✓ {email} verified</p>
          <input className={input} inputMode="numeric" required maxLength={7} placeholder="Student ID (7 digits)" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
          <button disabled={busy} className={button}>{busy ? "Checking…" : "Start selling"}</button>
        </form>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
    </AuthSplit>
  );
}
