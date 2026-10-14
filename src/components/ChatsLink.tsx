"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircleIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { UNREAD_CHANGED } from "@/lib/unreadEvents";

// Red round badge with a header-coloured ring, as in the chat-bubble reference.
const badge = "absolute flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#0f3d2e]";

// "Chats" nav link with a live unread-message badge. Realtime respects RLS, so
// only events for the user's own conversations arrive.
export default function ChatsLink({ userId, initialUnread, className, icon = false }: { userId: string; initialUnread: number; className: string; icon?: boolean }) {
  const [unread, setUnread] = useState(initialUnread);
  const pathname = usePathname();
  const instanceId = useId(); // Nav renders this link twice (desktop + drawer); channel names must be unique

  useEffect(() => {
    const supabase = createClient();
    const refresh = async () => {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .is("read_at", null)
        .neq("sender_id", userId);
      setUnread(count ?? 0);
    };
    refresh();
    // Realtime can drop events, so also re-read on a timer, on focus and when a chat marks itself read.
    const timer = setInterval(() => document.visibilityState === "visible" && refresh(), 5000);
    window.addEventListener("focus", refresh);
    window.addEventListener(UNREAD_CHANGED, refresh);
    const channel = supabase
      .channel(`nav-unread-${instanceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refresh)
      .subscribe();
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(UNREAD_CHANGED, refresh);
      supabase.removeChannel(channel);
    };
  }, [userId, instanceId, pathname]);

  const count = unread > 99 ? "99+" : unread;

  if (icon) {
    return (
      <Link href="/inbox" aria-label={unread > 0 ? `Chats, ${count} unread` : "Chats"} className={`${className} relative`}>
        <MessageCircleIcon className="size-6 fill-current" />
        {unread > 0 && (
          <span className={`${badge} right-0 top-0`}>
            {count}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link href="/inbox" className={`${className} relative`}>
      Chats
      {unread > 0 && (
        <span className={`${badge} -right-4 -top-3`}>
          {count}
        </span>
      )}
    </Link>
  );
}
