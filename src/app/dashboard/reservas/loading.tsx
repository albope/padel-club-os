import { Skeleton } from '@/components/ui/skeleton';

export default function ReservasLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      <Skeleton className="h-[600px] w-full rounded-lg" />
    </div>
  );
}
