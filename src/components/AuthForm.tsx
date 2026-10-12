"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setBusy(false);
      if (error) return setError(error.message);
      if (!data.session) return setNotice("Check your inbox and click the confirmation link, then log in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setError(error.message);
    }
    const next = params.get("next");
    router.push(next && next.startsWith("/") ? next : "/");
    router.refresh();
  }

  const input = "w-full border border-slate-300 px-4 py-3 text-sm focus:border-[#0f3d2e] focus:outline-none";

  return (
    <form onSubmit={submit} className="mx-auto mt-10 max-w-sm space-y-5 border border-slate-200 bg-white p-8">
      <h1 className="text-2xl font-black uppercase tracking-widest text-[#0f3d2e]">{mode === "login" ? "Log in" : "Create an account"}</h1>
      {mode === "signup" && (
        <p className="text-sm text-slate-600">
          Anyone can sign up to buy. To sell, you&apos;ll verify your Rangsit email and student ID afterwards.
        </p>
      )}
      <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className={input} type="password" required minLength={8} placeholder="Password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {notice && <p className="text-sm text-[#0f3d2e]">{notice}</p>}
      <button disabled={busy} className="w-full bg-[#0f3d2e] py-3.5 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-[#0f3d2e]/90 disabled:opacity-50">
        {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
      </button>
      <p className="text-center text-sm text-slate-600">
        {mode === "login" ? (
          <>No account? <Link className="font-bold text-[#0f3d2e] underline" href="/signup">Sign up</Link></>
        ) : (
          <>Already registered? <Link className="font-bold text-[#0f3d2e] underline" href="/login">Log in</Link></>
        )}
      </p>
    </form>
  );
}
