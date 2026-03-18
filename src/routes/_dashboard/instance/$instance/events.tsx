import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { InstanceEventsPanel } from "@/components/instance-events.tsx";
import InstancePageLayout from "@/components/nav/instance/instance-page-layout.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { InstancePermission } from "@/generated/soulfire/common.ts";
import type { EventScope } from "@/generated/soulfire/events.ts";
import { hasInstancePermission } from "@/lib/utils.tsx";

export const Route = createFileRoute("/_dashboard/instance/$instance/events")({
  component: Events,
});

function EventsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-[calc(100dvh-14rem)] w-full rounded-xl" />
    </div>
  );
}

function Events() {
  const { t } = useTranslation("common");

  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: "controls",
          content: t("breadcrumbs.controls"),
        },
      ]}
      pageName={t("pageName.events")}
      loadingSkeleton={<EventsSkeleton />}
    >
      <Content />
    </InstancePageLayout>
  );
}

function Content() {
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const eventScope = useMemo<EventScope>(
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

  return (
    <InstanceEventsPanel scope={eventScope} instanceId={instanceInfo.id} />
  );
}
