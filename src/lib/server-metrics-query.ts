import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import { type QueryClient, queryOptions } from "@tanstack/react-query";
import type { GetServerMetricsResponse } from "@/generated/soulfire/metrics";
import { MetricsServiceClient } from "@/generated/soulfire/metrics.client";
import { mergeSnapshots } from "@/lib/metrics-utils";

export function serverMetricsQueryOptions(
  transport: RpcTransport | null,
  queryClient: QueryClient,
) {
  const queryKey = ["server-metrics"] as const;

  return queryOptions({
    queryKey,
    queryFn: async ({ signal }): Promise<GetServerMetricsResponse> => {
      if (!transport) {
        return {
          snapshots: [],
        };
      }

      const previous =
        queryClient.getQueryData<GetServerMetricsResponse>(queryKey);
      const since =
        previous && previous.snapshots.length > 0
          ? previous.snapshots[previous.snapshots.length - 1].timestamp
          : undefined;

      const client = new MetricsServiceClient(transport);
      const result = await client.getServerMetrics(since ? { since } : {}, {
        abort: signal,
      });
      const response = result.response;

      if (!previous || !since) {
        return response;
      }

      return {
        snapshots: mergeSnapshots(previous.snapshots, response.snapshots),
      };
    },
    refetchInterval: 3_000,
  });
}
