import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Row = {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  listings: { title: string; images: string[]; status: string } | null;
};

export default async function InboxPage({ searchParams }: PageProps<"/inbox">) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/inbox");

  // Non-sellers only have buying chats, so the Selling tab is hidden for them.
  const { data: profile } = await supabase.from("profiles").select("is_seller").eq("id", user.id).single();
  const isSeller = !!profile?.is_seller;
  const tab = isSeller && sp.tab === "selling" ? "selling" : "buying";

  const { data } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id, last_message_at, listings(title, images, status)")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });
  const all = (data ?? []) as unknown as Row[];
  const rows = all.filter((c) => (tab === "buying" ? c.buyer_id === user.id : c.seller_id === user.id));

  const { data: unread } = await supabase
    .from("messages")
    .select("conversation_id")
    .is("read_at", null)
    .neq("sender_id", user.id);
  const unreadBy = new Map<string, number>();
  (unread ?? []).forEach((m) => unreadBy.set(m.conversation_id, (unreadBy.get(m.conversation_id) ?? 0) + 1));

  // Unread badge per tab, so a new buyer message is visible even from the other tab.
  const unreadFor = (isBuyer: boolean) =>
    all
      .filter((c) => (isBuyer ? c.buyer_id === user.id : c.seller_id === user.id))
      .reduce((n, c) => n + (unreadBy.get(c.id) ?? 0), 0);
  const tabs = [
    { key: "buying", label: "Buying", unread: unreadFor(true) },
    ...(isSeller ? [{ key: "selling", label: "Selling", unread: unreadFor(false) }] : []),
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-8">
      <h1 className="text-2xl font-black uppercase tracking-widest text-[#0f3d2e] sm:text-3xl">Chats</h1>
      {isSeller && <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/inbox?tab=${t.key}`}
            className={`-mb-px border-b-2 px-4 py-2 text-[11px] font-bold uppercase tracking-widest ${tab === t.key ? "border-[#0f3d2e] text-[#0f3d2e]" : "border-transparent text-slate-500 hover:text-[#0f3d2e]"}`}
          >
            {t.label}
            {t.unread > 0 && (
              <span className="ml-1 bg-[#0f3d2e] px-1.5 py-0.5 text-[10px] font-bold text-white">{t.unread}</span>
            )}
          </Link>
        ))}
      </div>}
      {rows.length === 0 && (
        <p className="text-sm text-slate-500">
          {tab === "buying"
            ? "You haven't contacted any sellers yet. Open an item and tap “Chat with seller”."
            : "No buyers have messaged you yet."}
        </p>
      )}
      <ul className="space-y-2">
        {rows.map((c) => (
          <li key={c.id}>
            <Link href={`/inbox/${c.id}`} className="flex items-center gap-3 border border-slate-200 bg-white p-3 hover:border-[#0f3d2e]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {c.listings && <img src={c.listings.images[0]} alt="" className="size-14 object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold uppercase tracking-widest text-slate-900">{c.listings?.title ?? "Listing removed"}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {isSeller && (c.buyer_id === user.id ? "You are buying" : "You are selling")}
                  {c.listings?.status === "sold" ? `${isSeller ? " · " : ""}sold` : ""}
                </p>
              </div>
              {unreadBy.get(c.id) ? (
                <span className="bg-[#0f3d2e] px-2 py-0.5 text-xs font-bold text-white">{unreadBy.get(c.id)}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
