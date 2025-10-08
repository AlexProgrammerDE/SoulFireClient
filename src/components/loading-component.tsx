import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";

function LoadingSkeleton() {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 75}%`;
  }, []);

  return (
    <Skeleton
      className="h-6 max-w-(--skeleton-width)"
      style={
        {
          "--skeleton-width": width,
        } as React.CSSProperties
      }
    />
  );
}

export function LoadingComponent() {
  return (
    <div className="flex size-full grow flex-col gap-4 p-4">
      {Array.from({ length: 10 }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list, order doesn't matter
        <LoadingSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
}
