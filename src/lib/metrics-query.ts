import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import { queryOptions } from "@tanstack/react-query";
import type { GetInstanceMetricsResponse } from "@/generated/soulfire/metrics";
import { MetricsServiceClient } from "@/generated/soulfire/metrics.client";

export function instanceMetricsQueryOptions(
  transport: RpcTransport | null,
  instanceId: string,
) {
  return queryOptions({
    queryKey: ["instance-metrics", instanceId],
    queryFn: async ({ signal }): Promise<GetInstanceMetricsResponse> => {
      if (!transport) {
        return {
          snapshots: [],
          distributions: {
            healthHistogram: [],
            foodHistogram: [],
            dimensionCounts: {},
            gameModeCounts: {},
            botPositions: [],
          },
        };
      }
      const client = new MetricsServiceClient(transport);
      const result = await client.getInstanceMetrics(
        { instanceId },
        { abort: signal },
      );
      return result.response;
    },
    refetchInterval: 3_000,
  });
}
