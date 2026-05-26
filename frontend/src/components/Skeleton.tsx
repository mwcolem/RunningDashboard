interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse rounded-md bg-gray-100 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <Skeleton className="h-3 w-16 mb-3" />
      <Skeleton className="h-7 w-20" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex gap-6">
        <Skeleton className="h-3.5 w-12" />
        <Skeleton className="h-3.5 w-14" />
        <Skeleton className="h-3.5 w-12" />
        <Skeleton className="h-3.5 w-14" />
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return <Skeleton className="h-56 w-full" />;
}
