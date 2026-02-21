import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Label, Pie, PieChart } from "recharts";
import {
  AggregateBotsChart,
  CpuUsageChart,
  MemoryUsageChart,
  ServerMetricsSummaryCards,
  ThreadCountChart,
} from "@/components/admin-metrics/server-metrics-charts.tsx";
import UserPageLayout from "@/components/nav/user/user-page-layout.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type CustomTooltipProps,
} from "@/components/ui/chart";
import { UserRole } from "@/generated/soulfire/common.ts";
import {
  type InstanceListResponse,
  InstanceState,
} from "@/generated/soulfire/instance.ts";
import type { UserListResponse } from "@/generated/soulfire/user.ts";

export const Route = createFileRoute("/_dashboard/user/admin/")({
  component: OverviewPage,
});

const usersChartConfig = {
  users: {
    label: <Trans i18nKey="admin:overview.usersChart.label.role" />,
  },
  user: {
    label: <Trans i18nKey="admin:overview.usersChart.label.user" />,
    color: "var(--chart-2)",
  },
  admin: {
    label: <Trans i18nKey="admin:overview.usersChart.label.admin" />,
    color: "var(--chart-1)",
  },
  other: {
    label: <Trans i18nKey="admin:overview.usersChart.label.other" />,
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function forType(userList: UserListResponse, type: UserRole) {
  return userList.users.filter((user) => user.role === type).length;
}

export function UsersChart(props: { userList: UserListResponse }) {
  const { t } = useTranslation("admin");
  const chartData = useMemo(
    () => [
      {
        role: "admin",
        users: forType(props.userList, UserRole.ADMIN),
        fill: "var(--color-admin)",
      },
      {
        role: "user",
        users: forType(props.userList, UserRole.USER),
        fill: "var(--color-user)",
      },
    ],
    [props.userList],
  );

  const totalUsers = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.users, 0);
  }, [chartData]);

  return (
    <Card className="flex flex-col border-0">
      <CardHeader className="items-center">
        <CardTitle>{t("overview.usersChart.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer
          config={usersChartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={(props: CustomTooltipProps) => (
                <ChartTooltipContent {...props} hideLabel />
              )}
            />
            <Pie
              data={chartData}
              dataKey="users"
              nameKey="role"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalUsers.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {t("overview.usersChart.users")}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const instancesChartConfig = {
  instances: {
    label: <Trans i18nKey="admin:overview.instancesChart.label.state" />,
  },
  active: {
    label: <Trans i18nKey="admin:overview.instancesChart.label.active" />,
    color: "var(--chart-2)",
  },
  stopped: {
    label: <Trans i18nKey="admin:overview.instancesChart.label.stopped" />,
    color: "var(--chart-1)",
  },
  other: {
    label: <Trans i18nKey="admin:overview.instancesChart.label.other" />,
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function InstancesChart(props: { instanceList: InstanceListResponse }) {
  const { t } = useTranslation("admin");
  const chartData = useMemo(
    () => [
      {
        state: "active",
        instances: props.instanceList.instances.filter(
          (instance) => instance.state !== InstanceState.STOPPED,
        ).length,
        fill: "var(--color-active)",
      },
      {
        state: "stopped",
        instances: props.instanceList.instances.filter(
          (instance) => instance.state === InstanceState.STOPPED,
        ).length,
        fill: "var(--color-stopped)",
      },
    ],
    [props.instanceList],
  );

  const totalInstances = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.instances, 0);
  }, [chartData]);

  return (
    <Card className="flex flex-col border-0">
      <CardHeader className="items-center pb-0">
        <CardTitle>{t("overview.instancesChart.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={instancesChartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={(props: CustomTooltipProps) => (
                <ChartTooltipContent {...props} hideLabel />
              )}
            />
            <Pie
              data={chartData}
              dataKey="instances"
              nameKey="state"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalInstances.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {t("overview.instancesChart.instances")}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function OverviewPage() {
  const { t } = useTranslation("common");

  return (
    <UserPageLayout
      showUserCrumb={false}
      extraCrumbs={[
        {
          id: "admin",
          content: t("breadcrumbs.admin"),
        },
      ]}
      pageName={t("pageName.overview")}
    >
      <Content />
    </UserPageLayout>
  );
}

function Content() {
  const { t } = useTranslation("common");
  const {
    usersQueryOptions,
    clientDataQueryOptions,
    instanceListQueryOptions,
    serverMetricsOptions,
  } = Route.useRouteContext();
  const { data: userList } = useSuspenseQuery(usersQueryOptions);
  const { data: clientInfo } = useSuspenseQuery(clientDataQueryOptions);
  const { data: instanceList } = useSuspenseQuery(instanceListQueryOptions);
  const { data: serverMetrics } = useSuspenseQuery(serverMetricsOptions);

  return (
    <div className="flex h-full w-full grow flex-col gap-2 pl-2">
      <h2 className="text-xl font-semibold">
        {t("admin:overview.welcome", {
          name: clientInfo.username,
        })}
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <UsersChart userList={userList} />
        <InstancesChart instanceList={instanceList} />
      </div>
      <h3 className="mt-4 text-lg font-semibold">
        {t("admin:overview.serverMetrics.sectionTitle")}
      </h3>
      <ServerMetricsSummaryCards data={serverMetrics} />
      {serverMetrics.snapshots.length >= 2 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CpuUsageChart snapshots={serverMetrics.snapshots} />
          <MemoryUsageChart snapshots={serverMetrics.snapshots} />
          <ThreadCountChart snapshots={serverMetrics.snapshots} />
          <AggregateBotsChart snapshots={serverMetrics.snapshots} />
        </div>
      )}
    </div>
  );
}
