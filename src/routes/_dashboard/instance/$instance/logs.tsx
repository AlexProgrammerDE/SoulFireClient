import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import InstancePageLayout from "@/components/nav/instance/instance-page-layout.tsx";
import { TerminalComponent } from "@/components/terminal.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { InstancePermission } from "@/generated/soulfire/common.ts";
import type { LogScope } from "@/generated/soulfire/logs.ts";
import { hasInstancePermission } from "@/lib/utils.tsx";

export const Route = createFileRoute("/_dashboard/instance/$instance/logs")({
  component: Logs,
});

function LogsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-[calc(100dvh-14rem)] w-full rounded-xl" />
    </div>
  );
}

function Logs() {
  const { t } = useTranslation("common");

  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: "controls",
          content: t("breadcrumbs.controls"),
        },
      ]}
      pageName={t("pageName.logs")}
      loadingSkeleton={<LogsSkeleton />}
    >
      <Content />
    </InstancePageLayout>
  );
}

function Content() {
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
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

  if (
    !hasInstancePermission(
      instanceInfo,
      InstancePermission.INSTANCE_SUBSCRIBE_LOGS,
    )
  ) {
    return null;
  }

  return <TerminalComponent scope={logScope} />;
}
