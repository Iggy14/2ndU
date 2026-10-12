import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import SignOutButton from "./SignOutButton";
import ChatsLink from "./ChatsLink";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  let unread = 0;
  if (user) {
    const [p, u] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .is("read_at", null)
        .neq("sender_id", user.id),
    ]);
    profile = p.data;
    unread = u.count ?? 0;
  }

  const link = "text-sm font-medium text-slate-700 hover:text-emerald-700";

  return (
    <header className="border-b border-slate-200 bg-white">
      {profile?.banned && (
        <p className="bg-red-600 px-4 py-2 text-center text-sm text-white">
          Your account has been suspended. You can browse, but you can&apos;t post or chat.
        </p>
      )}
      <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-emerald-700">
          2ndU
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/" className={link}>Browse</Link>
          {profile?.is_seller && !profile.banned && (
            <>
              <Link href="/sell/new" className={link}>Post item</Link>
              <Link href="/sell/mine" className={link}>My listings</Link>
            </>
          )}
          {user && !profile?.is_seller && !profile?.banned && (
            <Link href="/become-seller" className={link}>Become a seller</Link>
          )}
          {user && <ChatsLink userId={user.id} initialUnread={unread} className={link} />}
          {profile?.role === "admin" && <Link href="/admin" className={link}>Admin</Link>}
          {user ? (
            <SignOutButton />
          ) : (
            <>
              <Link href="/login" className={link}>Log in</Link>
              <Link
                href="/signup"
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
