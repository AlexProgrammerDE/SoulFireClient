import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import ControlsMenu from "@/components/controls-menu.tsx";
import InstancePageLayout from "@/components/nav/instance/instance-page-layout.tsx";
import { TerminalComponent } from "@/components/terminal.tsx";
import { Badge } from "@/components/ui/badge";
import { InstancePermission } from "@/generated/soulfire/common.ts";
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
    </div>
  );
}
