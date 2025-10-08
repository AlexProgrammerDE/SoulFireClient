import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import CommandInput from "@/components/command-input.tsx";
import InstancePageLayout from "@/components/nav/instance/instance-page-layout.tsx";
import { TerminalComponent } from "@/components/terminal.tsx";
import type { CommandScope } from "@/generated/soulfire/command.ts";
import { InstancePermission } from "@/generated/soulfire/common.ts";
import type { LogScope } from "@/generated/soulfire/logs.ts";
import { hasInstancePermission } from "@/lib/utils.tsx";

export const Route = createFileRoute("/_dashboard/instance/$instance/terminal")(
  {
    component: Terminal,
  },
);

function Terminal() {
  const { t } = useTranslation("common");

  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: "controls",
          content: t("breadcrumbs.controls"),
        },
      ]}
      pageName={t("pageName.terminal")}
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
        oneofKind: "personal",
        personal: {},
      },
    }),
    [instanceInfo.id],
  );
  const commandScope = useMemo<CommandScope>(
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
    <div className="flex flex-col gap-2">
      <TerminalComponent scope={logScope} />
      {hasInstancePermission(
        instanceInfo,
        InstancePermission.INSTANCE_COMMAND_EXECUTION,
      ) && <CommandInput scope={commandScope} />}
    </div>
  );
}
