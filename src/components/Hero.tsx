import Link from "next/link";

// Dark-green landing hero: oversized ghost headline with the wardrobe cut-out layered on top.
export default function Hero() {
  return (
    <section className="relative ml-[calc(50%-50vw)] flex h-[calc(100svh-6rem)] min-h-[34rem] w-screen flex-col overflow-hidden bg-[#0f3d2e] text-white md:h-[calc(100svh-5rem)]">
      <div className="relative min-h-0 flex-1">
        <h1 className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-[13vw] font-black uppercase leading-none tracking-tight text-white/10 select-none md:text-[12.5vw]">
          Secondhand
        </h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/classic-wardrobe.png"
          alt="Shirts hanging on a rail above a row of shoes"
          className="absolute inset-0 mx-auto h-full w-auto max-w-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)]"
        />
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 pb-8 pt-2 sm:px-10 md:grid-cols-3 md:items-end">
        <div className="hidden space-y-1 md:block">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Campus picks</p>
          <p className="max-w-[16rem] text-sm text-white/80">Shirts, shoes, desks, books and more, all from students you can meet on campus.</p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link href="#browse" className="bg-white px-8 py-3 text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e] hover:bg-green-100">
            Shop now
          </Link>
          <Link href="/sell/new" className="border border-white px-8 py-3 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-white/10">
            Sell yours
          </Link>
        </div>

        <div className="space-y-1 text-center md:text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Made for Rangsit</p>
          <p className="text-sm text-white/80 md:ml-auto md:max-w-[16rem]">Give great finds a second life and make every semester a little lighter.</p>
        </div>
      </div>
    </section>
  );
}
