"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Listing, Message } from "@/lib/types";
import { notifyUnreadChanged } from "@/lib/unreadEvents";

export default function ChatRoom({
  conversationId,
  userId,
  isSeller,
  listing: initialListing,
  initialMessages,
}: {
  conversationId: string;
  userId: string;
  isSeller: boolean;
  listing: Listing;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [listing, setListing] = useState(initialListing);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    const markRead = () =>
      supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .is("read_at", null)
        .then(() => notifyUnreadChanged());
    markRead();

    // Backup for when the realtime socket is slow, dropped or not authorised yet:
    // pull anything new every few seconds and when the tab regains focus.
    const sync = async () => {
      if (document.visibilityState !== "visible") return;
      const [msgs, lst] = await Promise.all([
        supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true }),
        supabase.from("listings").select("*").eq("id", initialListing.id).maybeSingle(),
      ]);
      if (msgs.data) {
        const fetched = msgs.data as Message[];
        setMessages((cur) => {
          const have = new Set(cur.map((m) => m.id));
          const added = fetched.filter((m) => !have.has(m.id));
          return added.length ? [...cur, ...added] : cur;
        });
        if (fetched.some((m) => m.sender_id !== userId && !m.read_at)) markRead();
      }
      if (lst.data) {
        const next = lst.data as Listing;
        setListing((cur) => (JSON.stringify(cur) === JSON.stringify(next) ? cur : next));
      }
    };
    const timer = setInterval(sync, 4000);
    window.addEventListener("focus", sync);

    // Unique topic per mount: avoids reusing a half-closed channel from a previous mount.
    const channel = supabase
      .channel(`chat-${conversationId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
          if (m.sender_id !== userId) markRead();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "listings", filter: `id=eq.${initialListing.id}` },
        (payload) => setListing(payload.new as Listing),
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[2ndU chat] realtime unavailable, falling back to polling:", status, err);
        }
      });
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", sync);
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, initialListing.id]);

  useEffect(() => {
    // Scroll only the message pane (scrollIntoView would also move the page).
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setError(null);
    setText("");
    const { data, error } = await createClient()
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: userId, body })
      .select("*")
      .single();
    if (error) {
      setText(body);
      return setError(error.message);
    }
    setMessages((cur) => (cur.some((x) => x.id === data.id) ? cur : [...cur, data as Message]));
  }

  const closed = listing.status !== "available";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
      <div className="flex items-center border-b border-slate-200">
        <Link href="/inbox" aria-label="Back to all chats" className="flex size-14 shrink-0 items-center justify-center text-[#0f3d2e] hover:bg-slate-50 md:hidden">
          <ChevronLeft className="size-6" />
        </Link>
        <Link href={`/listing/${listing.id}`} className="flex min-w-0 flex-1 items-center gap-3 p-3 hover:bg-slate-50 max-md:pl-0">
          <Image src={listing.images[0]} alt="" width={112} height={112} className="size-14 shrink-0 object-cover" />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold uppercase tracking-widest text-slate-900">{listing.title}</p>
            <p className="text-lg font-black tracking-tight text-[#0f3d2e]">฿{listing.price.toLocaleString()}</p>
          </div>
          <span className="ml-auto hidden text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:block">{isSeller ? "You are selling" : "Chatting with seller"}</span>
        </Link>
      </div>

      <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
        {messages.length === 0 && <p className="text-center text-sm text-slate-500">Say hi and agree on price and handover.</p>}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] border px-3 py-2 ${mine ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                <p className="whitespace-pre-wrap text-sm text-slate-900">{m.body}</p>
                <p suppressHydrationWarning className="mt-1 text-right text-[10px] text-slate-400">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {closed ? (
        <p className="border-t border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-600">
          {listing.status === "sold" ? "This item has been sold, so the chat is closed." : "This listing is no longer available."}
        </p>
      ) : (
        <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Type a message…" className="flex-1 border border-slate-300 px-3 py-2 text-sm focus:border-[#0f3d2e] focus:outline-none" />
          <button className="bg-[#0f3d2e] px-6 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-[#0f3d2e]/90">Send</button>
        </form>
      )}
      {error && <p className="px-3 pb-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
