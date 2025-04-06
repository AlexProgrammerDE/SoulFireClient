import { createFileRoute } from '@tanstack/react-router';
import { UserListResponse } from '@/generated/soulfire/user.ts';
import * as React from 'react';
import { useMemo } from 'react';
import { Label, Pie, PieChart } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { UserRole } from '@/generated/soulfire/common.ts';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  InstanceListResponse,
  InstanceState,
} from '@/generated/soulfire/instance.ts';
import UserPageLayout from '@/components/nav/user-page-layout.tsx';
import { Trans, useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_dashboard/user/admin/')({
  component: OverviewPage,
});

const usersChartConfig = {
  users: {
    label: <Trans i18nKey="admin:overview.usersChart.label.role" />,
  },
  user: {
    label: <Trans i18nKey="admin:overview.usersChart.label.user" />,
    color: 'hsl(var(--chart-2))',
  },
  admin: {
    label: <Trans i18nKey="admin:overview.usersChart.label.admin" />,
    color: 'hsl(var(--chart-1))',
  },
  other: {
    label: <Trans i18nKey="admin:overview.usersChart.label.other" />,
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

function forType(userList: UserListResponse, type: UserRole) {
  return userList.users.filter((user) => user.role === type).length;
}

export function UsersChart(props: { userList: UserListResponse }) {
  const { t } = useTranslation('admin');
  const chartData = useMemo(
    () => [
      {
        role: 'admin',
        users: forType(props.userList, UserRole.ADMIN),
        fill: 'var(--color-admin)',
      },
      {
        role: 'user',
        users: forType(props.userList, UserRole.USER),
        fill: 'var(--color-user)',
      },
    ],
    [props.userList],
  );

  const totalUsers = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.users, 0);
  }, [chartData]);

  return (
    <Card className="flex flex-col border-0">
      <CardHeader className="items-center pb-0">
        <CardTitle>{t('overview.usersChart.title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={usersChartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
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
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
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
                          {t('overview.usersChart.users')}
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
    color: 'hsl(var(--chart-2))',
  },
  stopped: {
    label: <Trans i18nKey="admin:overview.instancesChart.label.stopped" />,
    color: 'hsl(var(--chart-1))',
  },
  other: {
    label: <Trans i18nKey="admin:overview.instancesChart.label.other" />,
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export function InstancesChart(props: { instanceList: InstanceListResponse }) {
  const { t } = useTranslation('admin');
  const chartData = useMemo(
    () => [
      {
        state: 'active',
        instances: props.instanceList.instances.filter(
          (instance) => instance.state !== InstanceState.STOPPED,
        ).length,
        fill: 'var(--color-active)',
      },
      {
        state: 'stopped',
        instances: props.instanceList.instances.filter(
          (instance) => instance.state === InstanceState.STOPPED,
        ).length,
        fill: 'var(--color-stopped)',
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
        <CardTitle>{t('overview.instancesChart.title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={instancesChartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
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
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
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
                          {t('overview.instancesChart.instances')}
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
  const { t } = useTranslation('common');
  const {
    usersQueryOptions,
    clientDataQueryOptions,
    instanceListQueryOptions,
  } = Route.useRouteContext();
  const { data: userList } = useSuspenseQuery(usersQueryOptions);
  const { data: clientInfo } = useSuspenseQuery(clientDataQueryOptions);
  const { data: instanceList } = useSuspenseQuery(instanceListQueryOptions);

  return (
    <UserPageLayout
      showUserCrumb={false}
      extraCrumbs={[t('breadcrumbs.admin')]}
      pageName={t('pageName.overview')}
    >
      <div className="flex h-full w-full grow flex-col gap-2 pl-2">
        <h2 className="text-xl font-semibold">
          {t('admin:overview.welcome', {
            name: clientInfo.username,
          })}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2">
          <UsersChart userList={userList} />
          <InstancesChart instanceList={instanceList} />
        </div>
      </div>
    </UserPageLayout>
  );
}
