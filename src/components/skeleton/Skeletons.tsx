import { cn } from "@/lib/utils";

// Placeholder shapes shown while a page's data streams in. Square corners and slate-100 to match the site.
const block = "animate-pulse bg-slate-100 motion-reduce:animate-none";

export function GridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3", className)} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className={cn(block, "aspect-square")} />
          <div className={cn(block, "mx-auto h-3 w-3/4")} />
          <div className={cn(block, "mx-auto h-5 w-1/3")} />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={cn(block, "h-16")} />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="grid gap-8 pt-8 md:grid-cols-2" aria-hidden>
      <div className={cn(block, "aspect-square")} />
      <div className="space-y-4">
        <div className={cn(block, "h-8 w-3/4")} />
        <div className={cn(block, "h-8 w-1/3")} />
        <div className={cn(block, "h-24")} />
        <div className={cn(block, "h-12 w-1/2")} />
      </div>
    </div>
  );
}

// Heading placeholder + a body, used by the simple page-level loading.tsx files.
export function PageSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 pt-8" role="status" aria-label="Loading">
      <div className={cn(block, "mx-auto h-8 w-48")} />
      {children}
    </div>
  );
}
