import type { QueryKey } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { emit } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { InstanceState } from "@/generated/soulfire/instance";
import type { GetInstanceMetricsResponse } from "@/generated/soulfire/metrics";
import type {
  CastMetricsSnapshot,
  CastMetricsUpdateMessage,
} from "@/lib/cast-protocol";
import type { InstanceInfoQueryData } from "@/lib/types";
import { isTauri } from "@/lib/utils.tsx";

const BROADCAST_INTERVAL_MS = 5_000;
const MAX_POSITIONS = 50;

const STATE_LABELS: Record<number, string> = {
  [InstanceState.STARTING]: "Starting",
  [InstanceState.RUNNING]: "Running",
  [InstanceState.PAUSED]: "Paused",
  [InstanceState.STOPPING]: "Stopping",
  [InstanceState.STOPPED]: "Stopped",
};

export function useCastBroadcast(
  metricsQueryKey: QueryKey,
  instanceInfoQueryKey: QueryKey,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isTauri()) return;

    const interval = setInterval(() => {
      const metricsData =
        queryClient.getQueryData<GetInstanceMetricsResponse>(metricsQueryKey);
      const instanceData =
        queryClient.getQueryData<InstanceInfoQueryData>(instanceInfoQueryKey);

      if (!metricsData || !instanceData) return;

      const latestSnapshot =
        metricsData.snapshots.length > 0
          ? metricsData.snapshots[metricsData.snapshots.length - 1]
          : null;

      if (!latestSnapshot) return;

      const snapshot: CastMetricsSnapshot = {
        timestamp: latestSnapshot.timestamp
          ? new Date(
              Number(latestSnapshot.timestamp.seconds) * 1000 +
                latestSnapshot.timestamp.nanos / 1_000_000,
            ).toISOString()
          : new Date().toISOString(),
        botsOnline: latestSnapshot.botsOnline,
        botsTotal: latestSnapshot.botsTotal,
        packetsSentPerSecond: latestSnapshot.packetsSentPerSecond,
        packetsReceivedPerSecond: latestSnapshot.packetsReceivedPerSecond,
        bytesSentPerSecond: latestSnapshot.bytesSentPerSecond,
        bytesReceivedPerSecond: latestSnapshot.bytesReceivedPerSecond,
        avgTickDurationMs: latestSnapshot.avgTickDurationMs,
        maxTickDurationMs: latestSnapshot.maxTickDurationMs,
        avgHealth: latestSnapshot.avgHealth,
        avgFoodLevel: latestSnapshot.avgFoodLevel,
        totalLoadedChunks: latestSnapshot.totalLoadedChunks,
        totalTrackedEntities: latestSnapshot.totalTrackedEntities,
        connections: latestSnapshot.connections,
        disconnections: latestSnapshot.disconnections,
      };

      const distributions = metricsData.distributions;
      const positions = (distributions?.botPositions ?? []).slice(
        0,
        MAX_POSITIONS,
      );

      const message: CastMetricsUpdateMessage = {
        type: "METRICS_UPDATE",
        snapshot,
        distributions: {
          healthHistogram: distributions?.healthHistogram ?? [],
          foodHistogram: distributions?.foodHistogram ?? [],
          dimensionCounts: distributions?.dimensionCounts ?? {},
          gameModeCounts: distributions?.gameModeCounts ?? {},
          botPositions: positions.map((p) => ({
            x: p.x,
            z: p.z,
            dimension: p.dimension,
          })),
        },
        instanceInfo: {
          friendlyName: instanceData.friendlyName,
          state: STATE_LABELS[instanceData.state] ?? "Unknown",
        },
      };

      void emit("cast-global-message", message);
    }, BROADCAST_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      void emit("cast-global-message", { type: "METRICS_STOP" });
    };
  }, [queryClient, metricsQueryKey, instanceInfoQueryKey]);
}
