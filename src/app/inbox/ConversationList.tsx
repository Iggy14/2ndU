"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UNREAD_CHANGED } from "@/lib/unreadEvents";

export type ConversationRow = {
  id: string;
  role: "buying" | "selling";
  title: string;
  image: string | null;
  sold: boolean;
  lastAt: string;
  lastMessage: { body: string; mine: boolean } | null;
  unread: number;
};

function shortTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

export default function ConversationList({ rows, isSeller }: { rows: ConversationRow[]; isSeller: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeId = pathname.split("/")[2];
  const [tab, setTab] = useState<"all" | "buying" | "selling">("all");
  const [q, setQ] = useState("");

  // The rows come from the server layout, which doesn't re-render on client navigation. Re-fetch it
  // (debounced) when a message arrives or is read, and on a timer as a backup for dropped Realtime events.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(t);
      t = setTimeout(() => router.refresh(), 300);
    };
    const poll = setInterval(() => document.visibilityState === "visible" && router.refresh(), 8000);
    window.addEventListener("focus", refresh);
    window.addEventListener(UNREAD_CHANGED, refresh);
    const supabase = createClient();
    const channel = supabase
      .channel(`inbox-list-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refresh)
      .subscribe();
    return () => {
      clearTimeout(t);
      clearInterval(poll);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(UNREAD_CHANGED, refresh);
      supabase.removeChannel(channel);
    };
  }, [router]);

  const visible = rows.filter(
    (r) => (tab === "all" || r.role === tab) && r.title.toLowerCase().includes(q.trim().toLowerCase()),
  );
  const tabs = isSeller ? (["all", "buying", "selling"] as const) : (["all"] as const);

  return (
    // On mobile the list and the chat share the screen: list on /inbox, chat on /inbox/[id].
    <aside className={`${activeId ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r border-slate-200 bg-white text-slate-900 md:w-80`}>
      <div className="p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search chats…"
          className="w-full border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-[#0f3d2e] focus:outline-none"
        />
      </div>
      <div className="flex gap-4 px-4 pb-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 pb-1 transition-colors text-[11px] font-bold uppercase tracking-widest ${tab === t ? "border-[#0f3d2e] text-[#0f3d2e]" : "border-transparent text-slate-500 hover:text-[#0f3d2e]"}`}
          >
            {t === "all" ? "All messages" : t}
          </button>
        ))}
      </div>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 pt-1">
        {visible.length === 0 && (
          <li className="p-1 text-sm text-slate-500">
            {rows.length === 0 ? "No chats yet. Open an item and tap “Chat with seller”." : "No chats found."}
          </li>
        )}
        {visible.map((c) => {
          const active = c.id === activeId;
          const unread = active ? 0 : c.unread;
          return (
            <li key={c.id}>
              <Link
                href={`/inbox/${c.id}`}
                className={`flex items-center gap-3 bg-[#0f3d2e] px-3 py-3 text-white transition-colors ${active ? "ring-2 ring-inset ring-white/60" : "hover:bg-[#0f3d2e]/90"}`}
              >
                {c.image ? <Image src={c.image} alt="" width={88} height={88} className="size-11 shrink-0 object-cover" /> : <div className="size-11 shrink-0 bg-white/20" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[11px] font-bold uppercase tracking-widest">{c.title}</p>
                    <span suppressHydrationWarning className="shrink-0 text-[10px] text-white/50">
                      {shortTime(c.lastAt)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-white/60">
                      {c.sold ? "Sold · " : ""}
                      {c.lastMessage ? `${c.lastMessage.mine ? "You: " : ""}${c.lastMessage.body}` : "No messages yet"}
                    </p>
                    {unread > 0 && (
                      <span className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
