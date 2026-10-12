"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const activeId = pathname.split("/")[2];
  const [tab, setTab] = useState<"all" | "buying" | "selling">("all");
  const [q, setQ] = useState("");

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
            className={`border-b-2 pb-1 text-[11px] font-bold uppercase tracking-widest ${tab === t ? "border-[#0f3d2e] text-[#0f3d2e]" : "border-transparent text-slate-500 hover:text-[#0f3d2e]"}`}
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
                className={`flex items-center gap-3 bg-[#0f3d2e] px-3 py-3 text-white ${active ? "ring-2 ring-inset ring-white/60" : "hover:bg-[#0f3d2e]/90"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.image ? <img src={c.image} alt="" className="size-11 shrink-0 object-cover" /> : <div className="size-11 shrink-0 bg-white/20" />}
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
                    {unread > 0 && <span className="shrink-0 bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#0f3d2e]">{unread}</span>}
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
