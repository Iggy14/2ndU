import { DetailSkeleton } from "@/components/skeleton/Skeletons";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading">
      <DetailSkeleton />
    </div>
  );
}
