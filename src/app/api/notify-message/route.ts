import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Called by a Supabase Database Webhook on INSERT into `messages`. Emails the other
// participant via Resend. Auth is a shared secret header; the service-role key is only
// used here, on the server, to read the recipient's email from auth.
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function secretOk(header: string | null) {
  const expected = process.env.NOTIFY_WEBHOOK_SECRET;
  if (!expected || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!secretOk(request.headers.get("x-webhook-secret"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { RESEND_API_KEY, EMAIL_FROM, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!RESEND_API_KEY || !EMAIL_FROM || !NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "email not configured" }, { status: 500 });
  }

  const payload = await request.json().catch(() => null);
  const msg = payload?.type === "INSERT" ? payload.record : null;
  if (!msg?.id || !msg.conversation_id || !msg.sender_id) return NextResponse.json({ skipped: "not a message insert" });

  const admin = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const { data: conv } = await admin
    .from("conversations")
    .select("id, buyer_id, seller_id, listing:listings(title)")
    .eq("id", msg.conversation_id)
    .single();
  if (!conv) return NextResponse.json({ skipped: "no conversation" });

  // One email per burst: skip if the sender already has an earlier unread message here.
  const { count } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conv.id)
    .eq("sender_id", msg.sender_id)
    .is("read_at", null)
    .neq("id", msg.id);
  if (count) return NextResponse.json({ skipped: "already notified" });

  const recipientId = msg.sender_id === conv.buyer_id ? conv.seller_id : conv.buyer_id;
  const [{ data: recipient }, { data: sender }, { data: userRes }] = await Promise.all([
    admin.from("profiles").select("banned").eq("id", recipientId).single(),
    admin.from("profiles").select("display_name").eq("id", msg.sender_id).single(),
    admin.auth.admin.getUserById(recipientId),
  ]);
  const to = userRes.user?.email;
  if (!to || recipient?.banned) return NextResponse.json({ skipped: "no recipient" });

  const title = (conv.listing as unknown as { title: string } | null)?.title ?? "your listing";
  const from = sender?.display_name || "Someone";
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin).replace(/\/$/, "");
  const link = `${site}/inbox/${conv.id}`;
  const preview = String(msg.body).slice(0, 200);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject: `New message about "${title}"`,
      html: `<p><b>${esc(from)}</b> sent you a message about <b>${esc(title)}</b>:</p>
<blockquote>${esc(preview)}</blockquote>
<p><a href="${esc(link)}">Open the chat on 2ndU</a></p>`,
    }),
  });
  if (!res.ok) return NextResponse.json({ error: "send failed", status: res.status }, { status: 502 });
  return NextResponse.json({ sent: true });
}
