import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { LoadingComponent } from "@/components/loading-component.tsx";
import InstancePageLayout from "@/components/nav/instance/instance-page-layout.tsx";
import { NotFoundComponent } from "@/components/not-found-component.tsx";
import { PluginInfoCard } from "@/components/plugin-info-card.tsx";
import { InstanceSettingsPageComponent } from "@/components/settings-page.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

export const Route = createFileRoute(
  "/_dashboard/instance/$instance/settings/$pageId",
)({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <Content />
    </Suspense>
  );
}

function ContentSkeleton() {
  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: "loading",
          content: <Skeleton className="h-4 w-24" />,
        },
      ]}
      pageName={<Skeleton className="h-4 w-24" />}
    >
      <LoadingComponent />
    </InstancePageLayout>
  );
}

function Content() {
  const { t } = useTranslation("common");
  const { pageId } = Route.useParams();
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const settingsEntry = instanceInfo.instanceSettings.find(
    (s) => s.id === pageId,
  );
  if (!settingsEntry) {
    return <NotFoundComponent />;
  }

  const plugin = settingsEntry.owningPluginId
    ? instanceInfo.plugins.find((p) => p.id === settingsEntry.owningPluginId)
    : undefined;

  return (
    <InstancePageLayout
      extraCrumbs={[
        plugin
          ? {
              id: "plugin",
              content: t("breadcrumbs.plugins"),
            }
          : {
              id: "settings",
              content: t("breadcrumbs.settings"),
            },
      ]}
      pageName={settingsEntry.pageName}
    >
      <div className="flex h-full w-full grow flex-row gap-2">
        <div className="flex h-full grow flex-col gap-4">
          {plugin && (
            <PluginInfoCard settingsEntry={settingsEntry} plugin={plugin} />
          )}
          <div className="flex flex-col gap-2">
            <InstanceSettingsPageComponent data={settingsEntry} />
          </div>
        </div>
      </div>
    </InstancePageLayout>
  );
}
