import { Skeleton } from "@/components/ui/skeleton";

export function AdminSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="at-in space-y-8">
      {/* KPI cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="border border-border bg-card p-4"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="mb-3 flex items-center justify-between">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="size-4" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="mt-2 h-2.5 w-16" />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-24" />
        </div>
        <div className="space-y-0">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-t border-border py-3 first:border-t-0"
            >
              <Skeleton className="size-8 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
