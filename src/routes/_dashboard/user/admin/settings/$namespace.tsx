import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { LoadingComponent } from "@/components/loading-component.tsx";
import UserPageLayout from "@/components/nav/user/user-page-layout";
import { NotFoundComponent } from "@/components/not-found-component.tsx";
import { PluginInfoCard } from "@/components/plugin-info-card.tsx";
import { AdminSettingsPageComponent } from "@/components/settings-page.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

export const Route = createFileRoute(
  "/_dashboard/user/admin/settings/$namespace",
)({
  component: SettingsNamespace,
});

function SettingsNamespace() {
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
  const { namespace } = Route.useParams();
  const { serverInfoQueryOptions } = Route.useRouteContext();
  const { data: serverInfo } = useSuspenseQuery(serverInfoQueryOptions);
  const settingsEntry = serverInfo.serverSettings.find(
    (s) => s.namespace === namespace,
  );
  if (!settingsEntry) {
    return <NotFoundComponent />;
  }

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
      pageName={settingsEntry.pageName}
    >
      <div className="flex h-full w-full grow flex-row gap-2 pl-2">
        <div className="flex h-full grow flex-col gap-4">
          {settingsEntry.owningPlugin && (
            <PluginInfoCard settingsEntry={settingsEntry} />
          )}
          <div className="flex flex-col gap-2">
            <AdminSettingsPageComponent data={settingsEntry} />
          </div>
        </div>
      </div>
    </UserPageLayout>
  );
}
