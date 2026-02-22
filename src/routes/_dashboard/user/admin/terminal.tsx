import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import CommandInput from "@/components/command-input.tsx";
import UserPageLayout from "@/components/nav/user/user-page-layout";
import { TerminalComponent } from "@/components/terminal.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import type { CommandScope } from "@/generated/soulfire/command.ts";
import { GlobalPermission } from "@/generated/soulfire/common.ts";
import type { LogScope } from "@/generated/soulfire/logs.ts";
import { hasGlobalPermission } from "@/lib/utils.tsx";

export const Route = createFileRoute("/_dashboard/user/admin/terminal")({
  component: Terminal,
});

function TerminalSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-[calc(75vh-8rem)] w-full rounded-md" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}

function Terminal() {
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
      pageName={t("pageName.terminal")}
      loadingSkeleton={<TerminalSkeleton />}
    >
      <Content />
    </UserPageLayout>
  );
}

function Content() {
  const { clientDataQueryOptions } = Route.useRouteContext();
  const { data: clientData } = useSuspenseQuery(clientDataQueryOptions);
  const logScope = useMemo<LogScope>(
    () => ({
      scope: {
        oneofKind: "personal",
        personal: {},
      },
    }),
    [],
  );
  const commandScope = useMemo<CommandScope>(
    () => ({
      scope: {
        oneofKind: "global",
        global: {},
      },
    }),
    [],
  );

  return (
    <div className="flex flex-col gap-2">
      <TerminalComponent scope={logScope} />
      {hasGlobalPermission(
        clientData,
        GlobalPermission.GLOBAL_COMMAND_EXECUTION,
      ) && <CommandInput scope={commandScope} />}
    </div>
  );
}
