import { ListSkeleton } from "@/components/skeleton/Skeletons";

export default function Loading() {
  return (
    <div className="pt-4" role="status" aria-label="Loading">
      <ListSkeleton rows={4} />
    </div>
  );
}
