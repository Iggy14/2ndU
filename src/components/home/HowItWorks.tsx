import Reveal from "../Reveal";

const STEPS = [
  { title: "Find", body: "Browse what other students are selling, from desks to dresses." },
  { title: "Chat", body: "Message the seller in the app to agree on a price and a time." },
  { title: "Meet", body: "Swap on campus or at the agreed spot. No shipping, no waiting." },
];

// A real sequence, so the numbers stay. Full-bleed mint band separates it from the white sections.
export default function HowItWorks() {
  return (
    <section className="ml-[calc(50%-50vw)] mt-20 w-screen bg-green-50 px-4 py-16">
      <Reveal className="mx-auto max-w-5xl space-y-10">
        <h2 className="text-2xl font-black uppercase tracking-widest text-[#0f3d2e] sm:text-3xl">How it works</h2>
        <ol className="grid gap-8 sm:grid-cols-3 sm:gap-0">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t-4 border-[#0f3d2e] pt-4 sm:pr-8 sm:[&:not(:first-child)]:pl-8 sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-l-[#0f3d2e]/20">
              <span className="text-6xl font-black leading-none text-[#0f3d2e]/20">{i + 1}</span>
              <h3 className="mt-3 text-xl font-black uppercase tracking-widest text-[#0f3d2e]">{s.title}</h3>
              <p className="mt-2 max-w-[18rem] text-sm text-slate-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
