export default function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="group relative border-b border-r border-gray-200 p-4 sm:p-6">
      <div className="aspect-h-1 aspect-w-1 overflow-hidden rounded-lg bg-gray-200">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="mt-4 space-y-2 text-center">
        <Skeleton className="mx-auto h-4 w-3/4" />
        <Skeleton className="mx-auto h-3 w-1/2" />
        <Skeleton className="mx-auto h-5 w-1/3" />
      </div>
    </div>
  );
}
