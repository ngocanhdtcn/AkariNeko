type LoadingSkeletonProps = {
  variant?: "card" | "list" | "table" | "stats";
  rows?: number;
  className?: string;
};

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-full bg-gradient-to-r from-pink-100 via-rose-50 to-violet-100 ${className}`}
    />
  );
}

export function LoadingSkeleton({
  variant = "card",
  rows = 4,
  className = "",
}: LoadingSkeletonProps) {
  if (variant === "stats") {
    return (
      <div className={`grid gap-3 ${className || "sm:grid-cols-3"}`}>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-3xl border border-pink-50 bg-white p-4 shadow-sm"
          >
            <SkeletonLine className="h-3 w-20" />
            <SkeletonLine className="mt-4 h-8 w-16" />
            <SkeletonLine className="mt-3 h-3 w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={`animate-pulse rounded-3xl border border-pink-50 bg-white p-4 ${className}`}>
        <SkeletonLine className="h-4 w-48" />
        <div className="mt-4 grid gap-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_1fr_1.5fr_0.6fr] gap-3 rounded-2xl border border-pink-50 bg-pink-50/30 p-3"
            >
              <SkeletonLine className="h-4" />
              <SkeletonLine className="h-4" />
              <SkeletonLine className="h-4" />
              <SkeletonLine className="h-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={`grid animate-pulse gap-3 ${className}`}>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-pink-50 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-pink-100/80" />
              <div className="min-w-0 flex-1">
                <SkeletonLine className="h-4 w-2/3" />
                <SkeletonLine className="mt-3 h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`animate-pulse rounded-3xl border border-pink-50 bg-white p-5 shadow-sm ${className}`}
    >
      <SkeletonLine className="h-4 w-36" />
      <SkeletonLine className="mt-4 h-10 w-24" />
      <SkeletonLine className="mt-4 h-3 w-full" />
      <SkeletonLine className="mt-3 h-3 w-4/5" />
    </div>
  );
}
