import { Skeleton } from '@/components/ui/skeleton'

export default function MigracionLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      <div className="max-w-3xl mx-auto">
        {/* Stepper skeleton */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <Skeleton className="h-0.5 w-12" />}
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          ))}
        </div>
        {/* Card skeleton */}
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    </div>
  )
}
