import { Suspense } from "react";
import { connection } from "next/server";
import { createClient, getUserId } from "@/lib/supabase/server";
import Hero from "@/components/Hero";
import CategoryIndex from "@/components/home/CategoryIndex";
import JustListed from "@/components/home/JustListed";
import HowItWorks from "@/components/home/HowItWorks";
import SellBand from "@/components/home/SellBand";
import { getHomeData } from "@/lib/homeData";

// Only the viewer-specific bits (hearts, "being negotiated") depend on cookies; the listings are cached.
async function PersonalJustListed() {
  await connection(); // request-time only: the "being negotiated" badge reads the current time
  const [{ listings }, supabase] = await Promise.all([getHomeData(), createClient()]);
  const userId = await getUserId(supabase);
  const { data: favs } = userId
    ? await supabase.from("favorites").select("listing_id").eq("user_id", userId)
    : { data: [] };
  return <JustListed listings={listings} viewerId={userId} favoriteIds={(favs ?? []).map((f) => f.listing_id)} />;
}

async function AnonymousJustListed() {
  const { listings } = await getHomeData();
  return <JustListed listings={listings} viewerId={null} favoriteIds={[]} showNegotiating={false} />;
}

async function Categories() {
  const { counts } = await getHomeData();
  return <CategoryIndex counts={counts} />;
}

export default function Home() {
  return (
    <div>
      <Hero />
      <Categories />
      {/* the fallback is the same cached grid without hearts, so the page never shows an empty gap */}
      <Suspense fallback={<AnonymousJustListed />}>
        <PersonalJustListed />
      </Suspense>
      <HowItWorks />
      <SellBand />
    </div>
  );
}
