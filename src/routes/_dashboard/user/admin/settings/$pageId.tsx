import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { LoadingComponent } from "@/components/loading-component.tsx";
import UserPageLayout from "@/components/nav/user/user-page-layout";
import { NotFoundComponent } from "@/components/not-found-component.tsx";
import { ServerPluginInfoCard } from "@/components/plugin-info-card.tsx";
import { AdminSettingsPageComponent } from "@/components/settings-page.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

export const Route = createFileRoute("/_dashboard/user/admin/settings/$pageId")(
  {
    component: SettingsPage,
  },
);

function SettingsPage() {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <Content />
    </Suspense>
  );
}

function ContentSkeleton() {
  const { t } = useTranslation("common");

  return (
    <UserPageLayout
      showUserCrumb={false}
      extraCrumbs={[
        {
          id: "admin",
          content: t("breadcrumbs.admin"),
        },
        {
          id: "settings",
          content: t("breadcrumbs.settings"),
        },
      ]}
      pageName={<Skeleton className="h-4 w-24" />}
    >
      <LoadingComponent />
    </UserPageLayout>
  );
}

function Content() {
  const { t } = useTranslation("common");
  const { pageId } = Route.useParams();
  const { serverInfoQueryOptions } = Route.useRouteContext();
  const { data: serverInfo } = useSuspenseQuery(serverInfoQueryOptions);
  const settingsEntry = serverInfo.serverSettings.find((s) => s.id === pageId);
  if (!settingsEntry) {
    return <NotFoundComponent />;
  }

  const plugin = settingsEntry.owningPluginId
    ? serverInfo.plugins.find((p) => p.id === settingsEntry.owningPluginId)
    : undefined;

  return (
    <UserPageLayout
      showUserCrumb={false}
      extraCrumbs={[
        {
          id: "admin",
          content: t("breadcrumbs.admin"),
        },
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
      <div className="flex h-full w-full grow flex-row gap-2 pl-2">
        <div className="flex h-full grow flex-col gap-4">
          {plugin && (
            <ServerPluginInfoCard
              settingsEntry={settingsEntry}
              plugin={plugin}
            />
          )}
          <div className="flex flex-col gap-2">
            <AdminSettingsPageComponent data={settingsEntry} />
          </div>
        </div>
      </div>
    </UserPageLayout>
  );
}
