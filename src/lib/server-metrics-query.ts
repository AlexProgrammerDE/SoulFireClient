import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import { queryOptions } from "@tanstack/react-query";
import type { GetServerMetricsResponse } from "@/generated/soulfire/metrics";
import { MetricsServiceClient } from "@/generated/soulfire/metrics.client";

export function serverMetricsQueryOptions(transport: RpcTransport | null) {
  return queryOptions({
    queryKey: ["server-metrics"],
    queryFn: async ({ signal }): Promise<GetServerMetricsResponse> => {
      if (!transport) {
        return {
          snapshots: [],
        };
      }
      const client = new MetricsServiceClient(transport);
      const result = await client.getServerMetrics({}, { abort: signal });
      return result.response;
    },
    refetchInterval: 3_000,
  });
}
