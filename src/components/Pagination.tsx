import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { browseHref, type ListingFilters } from "@/lib/listingsQuery";

// Prev / Next links for the browse grid. Keeps every active filter and the sort.
const btn = "rounded-none border-[#0f3d2e] text-[11px] font-bold uppercase tracking-widest text-[#0f3d2e] hover:bg-[#0f3d2e] hover:text-white";

export default function Pagination({ filters, totalPages }: { filters: ListingFilters; totalPages: number }) {
  const { page } = filters;
  if (totalPages <= 1) return null;

  const href = (p: number) => browseHref({ ...filters, page: p });

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
