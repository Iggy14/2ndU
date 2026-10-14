"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { MessageCircleIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// "Chats" nav link with a live unread-message badge. Realtime respects RLS, so
// only events for the user's own conversations arrive.
export default function ChatsLink({ userId, initialUnread, className, icon = false }: { userId: string; initialUnread: number; className: string; icon?: boolean }) {
  const [unread, setUnread] = useState(initialUnread);
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
    const channel = supabase
      .channel(`nav-unread-${instanceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, instanceId]);

  const count = unread > 99 ? "99+" : unread;

  if (icon) {
    return (
      <Link href="/inbox" aria-label={unread > 0 ? `Chats, ${count} unread` : "Chats"} className={`${className} relative`}>
        <MessageCircleIcon className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center bg-white px-1 text-[10px] font-bold leading-4 text-[#0f3d2e]">
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
        <span className="ml-1 bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#0f3d2e] ring-1 ring-[#0f3d2e]">
          {count}
        </span>
      )}
    </Link>
  );
}
