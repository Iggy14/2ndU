import { notFound, redirect } from "next/navigation";
import { createClient, getUserId } from "@/lib/supabase/server";
import type { Listing, Message } from "@/lib/types";
import ChatRoom from "./ChatRoom";

export default async function ConversationPage({ params }: PageProps<"/inbox/[conversationId]">) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) redirect(`/login?next=/inbox/${conversationId}`);

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id, listings(*)")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (
    <ChatRoom
      conversationId={conversationId}
      userId={userId}
      isSeller={conv.seller_id === userId}
      listing={conv.listings as unknown as Listing}
      initialMessages={(messages ?? []) as Message[]}
    />
  );
}
