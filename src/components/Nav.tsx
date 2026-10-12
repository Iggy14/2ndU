import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import SignOutButton from "./SignOutButton";
import ChatsLink from "./ChatsLink";
import MobileNav from "./MobileNav";
import SearchSheet from "./SearchSheet";

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

  const link = "text-[11px] font-bold uppercase tracking-widest text-white/90 hover:text-white";
  const circle = "flex size-9 md:size-10 items-center justify-center rounded-full text-white hover:bg-white/10";
  const signUp = "border border-white px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-white hover:text-[#0f3d2e]";

  const links = (cls: string) => (
    <>
      <Link href="/" className={cls}>Browse</Link>
      {profile?.is_seller && !profile.banned && (
        <>
          <Link href="/sell/new" className={cls}>Post item</Link>
          <Link href="/sell/mine" className={cls}>My listings</Link>
        </>
      )}
      {user && !profile?.is_seller && !profile?.banned && (
        <Link href="/become-seller" className={cls}>Become a seller</Link>
      )}
      {user && <ChatsLink userId={user.id} initialUnread={unread} className={cls} />}
      {profile?.role === "admin" && <Link href="/admin" className={cls}>Admin</Link>}
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-[#0f3d2e] text-white">
      {profile?.banned && (
        <p className="bg-red-600 px-4 py-2 text-center text-sm text-white">
          Your account has been suspended. You can browse, but you can&apos;t post or chat.
        </p>
      )}
      <nav className="relative mx-auto flex h-24 w-full max-w-7xl items-center justify-between gap-x-3 px-4 md:h-20 md:gap-x-6 sm:px-10">
        <Link href="/" className="text-xl font-black tracking-tight text-white md:text-2xl">
          2ndU
        </Link>
        <div className="hidden items-center gap-10 md:absolute md:left-1/2 md:flex md:-translate-x-1/2">{links(link)}</div>
        <div className="flex items-center gap-2 md:gap-3">
          <SearchSheet className={circle} />
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <SignOutButton className={link} />
                <span className="flex size-10 items-center justify-center rounded-full bg-white text-sm font-bold text-[#0f3d2e]" aria-hidden>
                  {(profile?.display_name || user.email || "?").charAt(0).toUpperCase()}
                </span>
              </>
            ) : (
              <>
                <Link href="/login" className={link}>Log in</Link>
                <Link href="/signup" className={signUp}>Sign up</Link>
              </>
            )}
          </div>
          <MobileNav>
            {links("font-medium text-[#1c1f1a]")}
            <div className="my-2 border-t border-black/5" />
            {user ? (
              <SignOutButton />
            ) : (
              <>
                <Link href="/login" className="font-medium text-[#1c1f1a]">Log in</Link>
                <Link href="/signup" className="font-medium text-[#1c1f1a]">Sign up</Link>
              </>
            )}
          </MobileNav>
        </div>
      </nav>
    </header>
  );
}
