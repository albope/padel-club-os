import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Step indicator skeleton */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <Skeleton className="h-0.5 w-8 sm:w-16" />}
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-3 w-16 hidden sm:block" />
              </div>
            </div>
          ))}
        </div>

        {/* Card skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
