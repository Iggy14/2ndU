import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ConversationList, { type ConversationRow } from "./ConversationList";

type Row = {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  listings: { title: string; images: string[]; status: string } | null;
};

// Two-pane chat layout: conversation list on the left, the open chat (or empty state) on the right.
export default async function InboxLayout({ children }: LayoutProps<"/inbox">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/inbox");

  // Non-sellers only have buying chats, so the Selling tab is hidden for them.
  const { data: profile } = await supabase.from("profiles").select("is_seller").eq("id", user.id).single();
  const isSeller = !!profile?.is_seller;

  const { data } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id, last_message_at, listings(title, images, status)")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });
  const all = (data ?? []) as unknown as Row[];

  const [{ data: unread }, { data: recent }] = await Promise.all([
    supabase.from("messages").select("conversation_id").is("read_at", null).neq("sender_id", user.id),
    supabase
      .from("messages")
      .select("conversation_id, body, sender_id")
      .in(
        "conversation_id",
        all.map((c) => c.id),
      )
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  const unreadBy = new Map<string, number>();
  (unread ?? []).forEach((m) => unreadBy.set(m.conversation_id, (unreadBy.get(m.conversation_id) ?? 0) + 1));
  const lastBy = new Map<string, { body: string; mine: boolean }>();
  (recent ?? []).forEach((m) => {
    if (!lastBy.has(m.conversation_id)) lastBy.set(m.conversation_id, { body: m.body, mine: m.sender_id === user.id });
  });

  const rows: ConversationRow[] = all.map((c) => ({
    id: c.id,
    role: c.buyer_id === user.id ? "buying" : "selling",
    title: c.listings?.title ?? "Listing removed",
    image: c.listings?.images[0] ?? null,
    sold: c.listings?.status === "sold",
    lastAt: c.last_message_at,
    lastMessage: lastBy.get(c.id) ?? null,
    unread: unreadBy.get(c.id) ?? 0,
  }));

  return (
    // Breaks out of the centred <main> to span the screen. Height = viewport minus nav (6rem / 5rem on md),
    // footer (~3.1rem); -mb-6 cancels main's bottom padding. Only the two panes scroll, not the page.
    <div className="relative left-1/2 -mb-6 flex h-[calc(100dvh-9.2rem)] w-screen -translate-x-1/2 overflow-hidden border-b border-slate-200 md:h-[calc(100dvh-8.2rem)]">
      <ConversationList rows={rows} isSeller={isSeller} />
      {children}
    </div>
  );
}
