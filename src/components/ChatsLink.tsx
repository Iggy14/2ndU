"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// "Chats" nav link with a live unread-message badge. Realtime respects RLS, so
// only events for the user's own conversations arrive.
export default function ChatsLink({ userId, initialUnread, className }: { userId: string; initialUnread: number; className: string }) {
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

  return (
    <Link href="/inbox" className={`${className} relative`}>
      Chats
      {unread > 0 && (
        <span className="ml-1 bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#0f3d2e] ring-1 ring-[#0f3d2e]">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
