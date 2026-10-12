import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Landing point for every link Supabase emails out (signup, password reset, email change).
// Handles both link styles: `?code=` (default templates, PKCE) and `?token_hash=&type=`
// (custom templates; works even if the link is opened on another device).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const supabase = await createClient();
  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  }

  if (!ok) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("That link is invalid or has expired. Please request a new one.")}`);
  }
  // Password-reset links always land on the reset form, whatever `next` says.
  return NextResponse.redirect(`${origin}${type === "recovery" ? "/reset-password" : next}`);
}
