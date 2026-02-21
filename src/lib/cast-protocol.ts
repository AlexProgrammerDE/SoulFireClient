export type CastMetricsSnapshot = {
  timestamp: string;
  botsOnline: number;
  botsTotal: number;
  packetsSentPerSecond: number;
  packetsReceivedPerSecond: number;
  bytesSentPerSecond: number;
  bytesReceivedPerSecond: number;
  avgTickDurationMs: number;
  maxTickDurationMs: number;
  avgHealth: number;
  avgFoodLevel: number;
  totalLoadedChunks: number;
  totalTrackedEntities: number;
  connections: number;
  disconnections: number;
};

export type CastBotPosition = {
  x: number;
  z: number;
  dimension: string;
};

export type CastMetricsDistributions = {
  healthHistogram: number[];
  foodHistogram: number[];
  dimensionCounts: Record<string, number>;
  gameModeCounts: Record<string, number>;
  botPositions: CastBotPosition[];
};

export type CastInstanceInfo = {
  friendlyName: string;
  state: string;
};

export type CastMetricsUpdateMessage = {
  type: "METRICS_UPDATE";
  snapshot: CastMetricsSnapshot;
  distributions: CastMetricsDistributions;
  instanceInfo: CastInstanceInfo;
};

export type CastMetricsStopMessage = {
  type: "METRICS_STOP";
};

export type CastMetricsMessage =
  | CastMetricsUpdateMessage
  | CastMetricsStopMessage;
