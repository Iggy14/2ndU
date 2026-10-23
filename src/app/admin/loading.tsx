import { ListSkeleton, PageSkeleton } from "@/components/skeleton/Skeletons";

export default function Loading() {
  return (
    <PageSkeleton>
      <ListSkeleton />
    </PageSkeleton>
  );
}
