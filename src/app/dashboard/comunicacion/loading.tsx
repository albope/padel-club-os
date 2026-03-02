import { Skeleton } from "@/components/ui/skeleton"

export default function ComunicacionLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 py-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full max-w-md" />
            <div className="flex gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
