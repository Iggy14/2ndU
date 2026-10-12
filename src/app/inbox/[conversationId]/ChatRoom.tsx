"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Listing, Message } from "@/lib/types";

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
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    const markRead = () =>
      supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .is("read_at", null)
        .then(() => {});
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
    bottom.current?.scrollIntoView({ behavior: "smooth" });
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
    <div className="mx-auto flex max-w-2xl flex-col rounded-lg border border-slate-200 bg-white" style={{ height: "calc(100vh - 11rem)" }}>
      <Link href={`/listing/${listing.id}`} className="flex items-center gap-3 border-b border-slate-200 p-3 hover:bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={listing.images[0]} alt="" className="h-12 w-12 rounded object-cover" />
        <div className="min-w-0">
          <p className="truncate font-medium">{listing.title}</p>
          <p className="text-sm text-emerald-700">฿{listing.price.toLocaleString()}</p>
        </div>
        <span className="ml-auto text-xs text-slate-500">{isSeller ? "You are selling" : "Chatting with seller"}</span>
      </Link>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-center text-sm text-slate-500">Say hi and agree on price and handover.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === userId ? "justify-end" : "justify-start"}`}>
            <p className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${m.sender_id === userId ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>
              {m.body}
            </p>
          </div>
        ))}
        <div ref={bottom} />
      </div>

      {closed ? (
        <p className="border-t border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-600">
          {listing.status === "sold" ? "This item has been sold, so the chat is closed." : "This listing is no longer available."}
        </p>
      ) : (
        <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Type a message…" className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none" />
          <button className="rounded-md bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700">Send</button>
        </form>
      )}
      {error && <p className="px-3 pb-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
