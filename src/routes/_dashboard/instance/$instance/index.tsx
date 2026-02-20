import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import ControlsMenu from "@/components/controls-menu.tsx";
import {
  BandwidthChart,
  BotsOnlineChart,
  ChunksEntitiesChart,
  ConnectionEventsChart,
  DimensionPieChart,
  GameModePieChart,
  HealthDistributionChart,
  HealthFoodChart,
  MetricsSummaryCards,
  NetworkTrafficChart,
  PositionScatterChart,
  TickDurationChart,
} from "@/components/instance-metrics/metrics-charts.tsx";
import InstancePageLayout from "@/components/nav/instance/instance-page-layout.tsx";
import { TerminalComponent } from "@/components/terminal.tsx";
import { Badge } from "@/components/ui/badge";
import { InstancePermission } from "@/generated/soulfire/common.ts";
import { InstanceState } from "@/generated/soulfire/instance.ts";
import type { LogScope } from "@/generated/soulfire/logs.ts";
import { translateInstanceState } from "@/lib/types.ts";
import { hasInstancePermission } from "@/lib/utils.tsx";

export const Route = createFileRoute("/_dashboard/instance/$instance/")({
  component: Overview,
});

function Overview() {
  const { t } = useTranslation("common");

  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: "controls",
          content: t("breadcrumbs.controls"),
        },
      ]}
      pageName={t("pageName.overview")}
    >
      <Content />
    </InstancePageLayout>
  );
}

function Content() {
  const { i18n } = useTranslation("common");
  const { instanceInfoQueryOptions, metricsQueryOptions } =
    Route.useRouteContext();
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const { data: metricsData } = useSuspenseQuery(metricsQueryOptions);
  const logScope = useMemo<LogScope>(
    () => ({
      scope: {
        oneofKind: "instance",
        instance: {
          instanceId: instanceInfo.id,
        },
      },
    }),
    [instanceInfo.id],
  );

  const hasMetricsPermission = hasInstancePermission(
    instanceInfo,
    InstancePermission.READ_BOT_INFO,
  );
  const isActiveState =
    instanceInfo.state === InstanceState.RUNNING ||
    instanceInfo.state === InstanceState.STARTING ||
    instanceInfo.state === InstanceState.PAUSED;
  const hasSnapshots = metricsData.snapshots.length >= 2;
  const showMetrics = hasMetricsPermission && (isActiveState || hasSnapshots);

  return (
    <div className="flex h-full w-full grow flex-col gap-2">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row items-center gap-2">
          <h2 className="max-w-64 truncate text-xl font-semibold">
            {instanceInfo.friendlyName}
          </h2>
          <Badge className="uppercase" variant="secondary">
            {translateInstanceState(i18n, instanceInfo.state)}
          </Badge>
        </div>
        {hasInstancePermission(
          instanceInfo,
          InstancePermission.INSTANCE_SUBSCRIBE_LOGS,
        ) && <TerminalComponent scope={logScope} />}
      </div>
      <ControlsMenu />
      {showMetrics && (
        <div className="flex flex-col gap-2">
          <MetricsSummaryCards data={metricsData} />
          {hasSnapshots && (
            <>
              <div className="grid min-w-0 grid-cols-1 gap-2 lg:grid-cols-2">
                <BotsOnlineChart snapshots={metricsData.snapshots} />
                <NetworkTrafficChart snapshots={metricsData.snapshots} />
                <BandwidthChart snapshots={metricsData.snapshots} />
                <TickDurationChart snapshots={metricsData.snapshots} />
                <HealthFoodChart snapshots={metricsData.snapshots} />
                <ChunksEntitiesChart snapshots={metricsData.snapshots} />
                <ConnectionEventsChart snapshots={metricsData.snapshots} />
              </div>
              {metricsData.distributions && (
                <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <HealthDistributionChart
                    histogram={metricsData.distributions.healthHistogram}
                  />
                  <DimensionPieChart
                    dimensionCounts={metricsData.distributions.dimensionCounts}
                  />
                  <GameModePieChart
                    gameModeCounts={metricsData.distributions.gameModeCounts}
                  />
                  <PositionScatterChart
                    positions={metricsData.distributions.botPositions}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
