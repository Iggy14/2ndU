// Split auth layout: form on the left, dark-green panel on the right with a ghost "2ndU"
// layered behind the cut-out image. The panel is hidden on mobile.
export default function AuthSplit({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="relative ml-[calc(50%-50vw)] grid min-h-[calc(100svh-6rem)] w-screen md:min-h-[calc(100svh-5rem)] md:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase tracking-widest text-[#0f3d2e]">{title}</h1>
            {subtitle && <div className="text-sm text-slate-600">{subtitle}</div>}
          </div>
          {children}
        </div>
      </div>

      <div aria-hidden className="relative hidden overflow-hidden bg-[#0f3d2e] bg-[url('/auth-bg.jpg')] bg-cover bg-center md:block">
        <span className="absolute inset-0 flex select-none items-center justify-center text-[18vw] font-black leading-none tracking-tight text-white/30">
          2ndU
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/parrot.png"
          alt=""
          className="absolute inset-0 mx-auto h-full w-auto max-w-full object-contain p-10 drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)]"
        />
      </div>
    </section>
  );
}
