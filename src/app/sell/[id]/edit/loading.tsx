import { ListSkeleton, PageSkeleton } from "@/components/skeleton/Skeletons";

export default function Loading() {
  return (
    <PageSkeleton>
      <div className="mx-auto max-w-xl">
        <ListSkeleton rows={4} />
      </div>
    </PageSkeleton>
  );
}
