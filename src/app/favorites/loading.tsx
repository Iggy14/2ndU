import { GridSkeleton, PageSkeleton } from "@/components/skeleton/Skeletons";

export default function Loading() {
  return (
    <PageSkeleton>
      <GridSkeleton count={8} className="lg:grid-cols-4" />
    </PageSkeleton>
  );
}
