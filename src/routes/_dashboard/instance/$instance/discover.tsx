import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { InstancePluginInfoCard } from "@/components/instance-plugin-info-card.tsx";
import InstancePageLayout from "@/components/nav/instance/instance-page-layout.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

export const Route = createFileRoute("/_dashboard/instance/$instance/discover")(
  {
    component: Discover,
  },
);

function PluginCardSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
    </div>
  );
}

function DiscoverSkeleton() {
  return (
    <div className="grid h-full w-full grow grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list
        <PluginCardSkeleton key={i} />
      ))}
    </div>
  );
}

function Discover() {
  const { t } = useTranslation("common");

  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: "plugins",
          content: t("breadcrumbs.plugins"),
        },
      ]}
      pageName={t("pageName.discoverPlugins")}
      loadingSkeleton={<DiscoverSkeleton />}
    >
      <Content />
    </InstancePageLayout>
  );
}

function Content() {
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);

  return (
    <div className="grid h-full w-full grow grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {instanceInfo.instanceSettings
        .filter(
          (settings) =>
            settings.owningPluginId !== undefined &&
            settings.enabledIdentifier !== undefined,
        )
        .map((settings) => {
          const plugin = instanceInfo.plugins.find(
            (p) => p.id === settings.owningPluginId,
          );
          if (!plugin) return null;
          return (
            <InstancePluginInfoCard
              key={settings.id}
              settingsEntry={settings}
              plugin={plugin}
            />
          );
        })}
    </div>
  );
}
