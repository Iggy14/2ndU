import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Prev / Next links for the home grid. Keeps the current search and category.
const btn = "rounded-none border-[#0f3d2e] text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e] hover:bg-[#0f3d2e] hover:text-white";

export default function Pagination({
  q,
  cat,
  page,
  totalPages,
}: {
  q: string;
  cat: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (cat) sp.set("cat", cat);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/${qs ? `?${qs}` : ""}#browse`;
  };

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-4 pt-4">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(buttonVariants({ variant: "outline" }), btn)}>
          Previous
        </Link>
      ) : (
        <span className={cn(buttonVariants({ variant: "outline" }), btn, "pointer-events-none opacity-50")}>Previous</span>
      )}
      <span className="text-sm text-slate-500">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={href(page + 1)} className={cn(buttonVariants({ variant: "outline" }), btn)}>
          Next
        </Link>
      ) : (
        <span className={cn(buttonVariants({ variant: "outline" }), btn, "pointer-events-none opacity-50")}>Next</span>
      )}
    </nav>
  );
}
