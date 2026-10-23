import Link from "next/link";
import Reveal from "../Reveal";

// Full-bleed dark-green call to action closing the home page. No gap above: it sits flush under the mint band.
export default function SellBand() {
  return (
    <section className="ml-[calc(50%-50vw)] w-screen bg-[#0f3d2e] px-4 py-16 text-white sm:py-20">
      <Reveal className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl space-y-3">
          <h2 className="text-3xl font-black uppercase tracking-widest sm:text-4xl">Got something to sell?</h2>
          <p className="text-sm text-white/80">Clear out your room and give your things a second life. Listing takes about a minute.</p>
        </div>
        <Link
          href="/sell/new"
          className="shrink-0 self-start bg-white px-10 py-4 text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e] transition duration-200 hover:-translate-y-0.5 hover:bg-green-100 active:translate-y-0 sm:self-auto"
        >
          Sell yours
        </Link>
      </Reveal>
    </section>
  );
}
