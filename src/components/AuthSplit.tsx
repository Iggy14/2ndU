import Image from "next/image";

// Split auth layout: form on the left, dark-green panel on the right with a ghost logo
// layered behind the cut-out image. On mobile the panel is replaced by the same artwork as a
// blurred full-bleed background, with the form on a white card above it.
export default function AuthSplit({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="relative ml-[calc(50%-50vw)] grid min-h-[calc(100svh-6rem)] w-screen md:min-h-[calc(100svh-5rem)] md:grid-cols-2">
      <div aria-hidden className="absolute inset-0 overflow-hidden bg-[#0f3d2e] md:hidden">
        <Image src="/auth-mobile-bg.png" alt="" fill sizes="100vw" className="scale-110 object-cover blur-md" />
        <div className="absolute inset-0 bg-[#0f3d2e]/40" />
      </div>

      <div className="relative flex items-center justify-center px-4 py-10 sm:px-12">
        <div className="w-full max-w-sm space-y-6 bg-white/90 p-6 shadow-xl backdrop-blur-sm max-md:border max-md:border-white/40 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase tracking-widest text-[#0f3d2e]">{title}</h1>
            {subtitle && <div className="text-sm text-slate-600">{subtitle}</div>}
          </div>
          {children}
        </div>
      </div>

      <div aria-hidden className="relative hidden overflow-hidden bg-[#0f3d2e] md:block">
        <Image src="/auth-bg.jpg" alt="" fill sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 flex select-none items-center justify-center opacity-30">
          <Image src="/logo-white.png" alt="" width={600} height={258} className="w-[80%] max-w-none" />
        </div>
        <Image
          src="/parrot.png"
          alt=""
          fill
          sizes="50vw"
          className="object-contain p-10 drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)]"
        />
      </div>
    </section>
  );
}
