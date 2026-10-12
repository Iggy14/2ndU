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
  const tab = sp.tab === "selling" ? "selling" : "buying";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/inbox");

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
    { key: "selling", label: "Selling", unread: unreadFor(false) },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Chats</h1>
      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/inbox?tab=${t.key}`}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === t.key ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-600 hover:text-emerald-700"}`}
          >
            {t.label}
            {t.unread > 0 && (
              <span className="ml-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-xs font-bold text-white">{t.unread}</span>
            )}
          </Link>
        ))}
      </div>
      {rows.length === 0 && (
        <p className="text-slate-500">
          {tab === "buying"
            ? "You haven't contacted any sellers yet. Open an item and tap “Chat with seller”."
            : "No buyers have messaged you yet."}
        </p>
      )}
      <ul className="space-y-2">
        {rows.map((c) => (
          <li key={c.id}>
            <Link href={`/inbox/${c.id}`} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-emerald-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {c.listings && <img src={c.listings.images[0]} alt="" className="h-12 w-12 rounded object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.listings?.title ?? "Listing removed"}</p>
                <p className="text-xs text-slate-500">
                  {c.buyer_id === user.id ? "You are buying" : "You are selling"}
                  {c.listings?.status === "sold" ? " · sold" : ""}
                </p>
              </div>
              {unreadBy.get(c.id) ? (
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">{unreadBy.get(c.id)}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
