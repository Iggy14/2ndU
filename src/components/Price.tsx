import { cn } from "@/lib/utils";

// Sale price, with the original price struck through before it when the seller set one.
export default function Price({ price, originalPrice, className }: { price: number; originalPrice?: number | null; className?: string }) {
  return (
    <p className={cn("font-black tracking-tight text-[#0f3d2e]", className)}>
      {originalPrice != null && originalPrice > price && (
        <span className="mr-2 text-[0.6em] font-bold text-slate-400 line-through">฿{originalPrice.toLocaleString()}</span>
      )}
      ฿{price.toLocaleString()}
    </p>
  );
}
