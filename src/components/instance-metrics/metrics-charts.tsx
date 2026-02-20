import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type CustomTooltipProps,
} from "@/components/ui/chart";
import type {
  GetInstanceMetricsResponse,
  MetricsSnapshot,
} from "@/generated/soulfire/metrics";

function formatTime(snapshot: MetricsSnapshot): string {
  if (!snapshot.timestamp) return "";
  const date = new Date(
    Number(snapshot.timestamp.seconds) * 1000 +
      snapshot.timestamp.nanos / 1_000_000,
  );
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes.toFixed(0)} B/s`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
}

function formatNumber(n: number): string {
  if (n < 1000) return n.toFixed(0);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// Summary cards at the top
export function MetricsSummaryCards({
  data,
}: {
  data: GetInstanceMetricsResponse;
}) {
  const latest =
    data.snapshots.length > 0
      ? data.snapshots[data.snapshots.length - 1]
      : null;

  const items = [
    {
      label: "Online",
      value: latest ? `${latest.botsOnline}/${latest.botsTotal}` : "-/-",
    },
    {
      label: "Pkt/s",
      value: latest
        ? formatNumber(
            latest.packetsSentPerSecond + latest.packetsReceivedPerSecond,
          )
        : "-",
    },
    {
      label: "Traffic",
      value: latest
        ? formatBytes(latest.bytesSentPerSecond + latest.bytesReceivedPerSecond)
        : "-",
    },
    {
      label: "Health",
      value: latest ? latest.avgHealth.toFixed(1) : "-",
    },
    {
      label: "Tick",
      value: latest ? `${latest.avgTickDurationMs.toFixed(1)}ms` : "-",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label} size="sm">
          <CardContent className="flex flex-col items-center py-2">
            <span className="text-muted-foreground text-xs">{item.label}</span>
            <span className="font-mono text-lg font-bold">{item.value}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Bots Online area chart
const botsOnlineConfig = {
  online: { label: "Online", color: "var(--chart-1)" },
  total: { label: "Total", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function BotsOnlineChart({
  snapshots,
}: {
  snapshots: MetricsSnapshot[];
}) {
  const chartData = useMemo(
    () =>
      snapshots.map((s) => ({
        time: formatTime(s),
        online: s.botsOnline,
        total: s.botsTotal,
      })),
    [snapshots],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Bots Online</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={botsOnlineConfig}
          className="min-h-[200px] w-full"
        >
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <ChartTooltip
              content={(props: CustomTooltipProps) => (
                <ChartTooltipContent {...props} />
              )}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="var(--color-total)"
              fill="var(--color-total)"
              fillOpacity={0.1}
              strokeWidth={1}
              strokeDasharray="4 2"
            />
            <Area
              type="monotone"
              dataKey="online"
              stroke="var(--color-online)"
              fill="var(--color-online)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Network traffic (packets/s)
const networkConfig = {
  sent: { label: "Sent/s", color: "var(--chart-1)" },
  received: { label: "Recv/s", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function NetworkTrafficChart({
  snapshots,
}: {
  snapshots: MetricsSnapshot[];
}) {
  const chartData = useMemo(
    () =>
      snapshots.map((s) => ({
        time: formatTime(s),
        sent: Math.round(s.packetsSentPerSecond),
        received: Math.round(s.packetsReceivedPerSecond),
      })),
    [snapshots],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Packets / Second</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={networkConfig} className="min-h-[200px] w-full">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <ChartTooltip
              content={(props: CustomTooltipProps) => (
                <ChartTooltipContent {...props} />
              )}
            />
            <Line
              type="monotone"
              dataKey="sent"
              stroke="var(--color-sent)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="received"
              stroke="var(--color-received)"
              strokeWidth={2}
              dot={false}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Bandwidth (bytes/s)
const bandwidthConfig = {
  upload: { label: "Upload", color: "var(--chart-1)" },
  download: { label: "Download", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function BandwidthChart({
  snapshots,
}: {
  snapshots: MetricsSnapshot[];
}) {
  const chartData = useMemo(
    () =>
      snapshots.map((s) => ({
        time: formatTime(s),
        upload: s.bytesSentPerSecond,
        download: s.bytesReceivedPerSecond,
      })),
    [snapshots],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Bandwidth</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={bandwidthConfig}
          className="min-h-[200px] w-full"
        >
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => formatBytes(v).replace("/s", "")}
            />
            <ChartTooltip
              content={(props: CustomTooltipProps) => (
                <ChartTooltipContent
                  {...props}
                  formatter={(value, name, item) => (
                    <>
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex flex-1 items-center justify-between leading-none">
                        <span className="text-muted-foreground">
                          {bandwidthConfig[name as keyof typeof bandwidthConfig]
                            ?.label ?? name}
                        </span>
                        <span className="text-foreground font-mono font-medium tabular-nums">
                          {formatBytes(typeof value === "number" ? value : 0)}
                        </span>
                      </div>
                    </>
                  )}
                />
              )}
            />
            <Area
              type="monotone"
              dataKey="upload"
              stroke="var(--color-upload)"
              fill="var(--color-upload)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="download"
              stroke="var(--color-download)"
              fill="var(--color-download)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Tick duration
const tickConfig = {
  avg: { label: "Avg (ms)", color: "var(--chart-1)" },
  max: { label: "Max (ms)", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function TickDurationChart({
  snapshots,
}: {
  snapshots: MetricsSnapshot[];
}) {
  const chartData = useMemo(
    () =>
      snapshots.map((s) => ({
        time: formatTime(s),
        avg: Number(s.avgTickDurationMs.toFixed(2)),
        max: Number(s.maxTickDurationMs.toFixed(2)),
      })),
    [snapshots],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Tick Duration</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={tickConfig} className="min-h-[200px] w-full">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => `${v}ms`}
            />
            <ChartTooltip
              content={(props: CustomTooltipProps) => (
                <ChartTooltipContent {...props} />
              )}
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="var(--color-avg)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="max"
              stroke="var(--color-max)"
              strokeWidth={1}
              strokeDasharray="4 2"
              dot={false}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Health & Food line chart
const healthFoodConfig = {
  health: { label: "Avg Health", color: "var(--chart-1)" },
  food: { label: "Avg Food", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function HealthFoodChart({
  snapshots,
}: {
  snapshots: MetricsSnapshot[];
}) {
  const chartData = useMemo(
    () =>
      snapshots.map((s) => ({
        time: formatTime(s),
        health: Number(s.avgHealth.toFixed(1)),
        food: Number(s.avgFoodLevel.toFixed(1)),
      })),
    [snapshots],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Health / Food</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={healthFoodConfig}
          className="min-h-[200px] w-full"
        >
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 20]} tick={{ fontSize: 10 }} />
            <ChartTooltip
              content={(props: CustomTooltipProps) => (
                <ChartTooltipContent {...props} />
              )}
            />
            <Line
              type="monotone"
              dataKey="health"
              stroke="var(--color-health)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="food"
              stroke="var(--color-food)"
              strokeWidth={2}
              dot={false}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Chunks & Entities area chart
const chunksEntitiesConfig = {
  chunks: { label: "Chunks", color: "var(--chart-1)" },
  entities: { label: "Entities", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function ChunksEntitiesChart({
  snapshots,
}: {
  snapshots: MetricsSnapshot[];
}) {
  const chartData = useMemo(
    () =>
      snapshots.map((s) => ({
        time: formatTime(s),
        chunks: s.totalLoadedChunks,
        entities: s.totalTrackedEntities,
      })),
    [snapshots],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Chunks / Entities</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chunksEntitiesConfig}
          className="min-h-[200px] w-full"
        >
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <ChartTooltip
              content={(props: CustomTooltipProps) => (
                <ChartTooltipContent {...props} />
              )}
            />
            <Area
              type="monotone"
              dataKey="chunks"
              stroke="var(--color-chunks)"
              fill="var(--color-chunks)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="entities"
              stroke="var(--color-entities)"
              fill="var(--color-entities)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Connection events bar chart
const connectionConfig = {
  connections: { label: "Connections", color: "var(--chart-1)" },
  disconnections: { label: "Disconnections", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function ConnectionEventsChart({
  snapshots,
}: {
  snapshots: MetricsSnapshot[];
}) {
  const chartData = useMemo(
    () =>
      snapshots.map((s) => ({
        time: formatTime(s),
        connections: s.connections,
        disconnections: s.disconnections,
      })),
    [snapshots],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Connection Events</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={connectionConfig}
          className="min-h-[200px] w-full"
        >
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <ChartTooltip
              content={(props: CustomTooltipProps) => (
                <ChartTooltipContent {...props} />
              )}
            />
            <Bar
              dataKey="connections"
              fill="var(--color-connections)"
              radius={2}
            />
            <Bar
              dataKey="disconnections"
              fill="var(--color-disconnections)"
              radius={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Health distribution histogram
const healthDistConfig = {
  count: { label: "Bots", color: "var(--chart-1)" },
} satisfies ChartConfig;

const HEALTH_BUCKETS = [
  "0-2",
  "2-4",
  "4-6",
  "6-8",
  "8-10",
  "10-12",
  "12-14",
  "14-16",
  "16-18",
  "18-20",
];

export function HealthDistributionChart({
  histogram,
}: {
  histogram: number[];
}) {
  const chartData = useMemo(
    () =>
      HEALTH_BUCKETS.map((label, i) => ({
        bucket: label,
        count: histogram[i] ?? 0,
      })),
    [histogram],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Health Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={healthDistConfig}
          className="min-h-[200px] w-full"
        >
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bucket" tick={{ fontSize: 9 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <ChartTooltip
              content={(props: CustomTooltipProps) => (
                <ChartTooltipContent {...props} />
              )}
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={2} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Dimension pie chart
const dimensionPieConfig = {
  bots: { label: "Bots" },
} satisfies ChartConfig;

export function DimensionPieChart({
  dimensionCounts,
}: {
  dimensionCounts: Record<string, number>;
}) {
  const chartData = useMemo(() => {
    const entries = Object.entries(dimensionCounts);
    if (entries.length === 0) return [];
    return entries.map(([dim, count], i) => ({
      dimension: dim.replace("minecraft:", ""),
      bots: count,
      fill: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [dimensionCounts]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Dimensions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center text-sm">No data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Dimensions</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={dimensionPieConfig}
          className="mx-auto aspect-square max-h-[200px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={(props: CustomTooltipProps) => (
                <ChartTooltipContent {...props} nameKey="dimension" />
              )}
            />
            <Pie
              data={chartData}
              dataKey="bots"
              nameKey="dimension"
              innerRadius={40}
              strokeWidth={3}
            >
              {chartData.map((entry) => (
                <Cell key={entry.dimension} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Game mode pie chart
const gameModePieConfig = {
  bots: { label: "Bots" },
} satisfies ChartConfig;

export function GameModePieChart({
  gameModeCounts,
}: {
  gameModeCounts: Record<string, number>;
}) {
  const chartData = useMemo(() => {
    const entries = Object.entries(gameModeCounts);
    if (entries.length === 0) return [];
    return entries.map(([mode, count], i) => ({
      mode: mode.charAt(0) + mode.slice(1).toLowerCase(),
      bots: count,
      fill: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [gameModeCounts]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Game Modes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center text-sm">No data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Game Modes</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={gameModePieConfig}
          className="mx-auto aspect-square max-h-[200px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={(props: CustomTooltipProps) => (
                <ChartTooltipContent {...props} nameKey="mode" />
              )}
            />
            <Pie
              data={chartData}
              dataKey="bots"
              nameKey="mode"
              innerRadius={40}
              strokeWidth={3}
            >
              {chartData.map((entry) => (
                <Cell key={entry.mode} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Position scatter chart
const positionConfig = {
  position: { label: "Bot", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function PositionScatterChart({
  positions,
}: {
  positions: { x: number; z: number; dimension: string }[];
}) {
  const chartData = useMemo(
    () =>
      positions.map((p) => ({
        x: Math.round(p.x),
        z: Math.round(p.z),
        dimension: p.dimension.replace("minecraft:", ""),
      })),
    [positions],
  );

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Bot Positions (XZ)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center text-sm">No data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Bot Positions (XZ)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={positionConfig}
          className="min-h-[200px] w-full"
        >
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" name="X" type="number" tick={{ fontSize: 10 }} />
            <YAxis dataKey="z" name="Z" type="number" tick={{ fontSize: 10 }} />
            <ChartTooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={(props: CustomTooltipProps) => (
                <ChartTooltipContent {...props} />
              )}
            />
            <Scatter
              data={chartData}
              fill="var(--color-position)"
              shape="circle"
            />
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
