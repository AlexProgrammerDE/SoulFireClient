import { useIsFetching } from "@tanstack/react-query";
import { RefreshCwIcon } from "lucide-react";

export function GlobalQueryIndicator() {
  const isFetching = useIsFetching();

  return isFetching ? (
    <RefreshCwIcon className="text-muted-foreground size-4 animate-spin" />
  ) : null;
}
