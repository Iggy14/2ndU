import Link from "next/link";
import { CATEGORIES } from "@/lib/types";
import Reveal from "../Reveal";

// "Shop by category": one compact row of square tiles, styled like the browse pills and listing cards
// (thin border, small bold uppercase label, green fill on hover) with the live item count underneath.
export default function CategoryIndex({ counts }: { counts: Record<string, number> }) {
  return (
    <section className="pt-16">
      <Reveal className="space-y-5">
        <h2 className="text-2xl font-black uppercase tracking-widest text-[#0f3d2e] sm:text-3xl">Shop by category</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {CATEGORIES.map((c) => (
            <li key={c}>
              <Link
                href={`/browse?cat=${c}`}
                className="group flex h-20 flex-col items-center justify-center gap-1 border border-slate-300 px-2 text-center transition-colors duration-200 hover:border-[#0f3d2e] hover:bg-[#0f3d2e] focus-visible:border-[#0f3d2e] focus-visible:bg-[#0f3d2e] focus-visible:outline-none"
              >
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e] group-hover:text-white group-focus-visible:text-white">
                  {c}
                </span>
                <span className="text-xs text-slate-500 group-hover:text-white/70 group-focus-visible:text-white/70">
                  {counts[c] ?? 0} {counts[c] === 1 ? "item" : "items"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
