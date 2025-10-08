import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  PlayIcon,
  SquareIcon,
  SquareTerminalIcon,
  TextIcon,
  TimerIcon,
  TimerOffIcon,
} from "lucide-react";
import * as React from "react";
import { Trans, useTranslation } from "react-i18next";
import { DataTable } from "@/components/data-table/data-table.tsx";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header.tsx";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list.tsx";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar.tsx";
import InstancePageLayout from "@/components/nav/instance/instance-page-layout.tsx";
import { SFTimeAgo } from "@/components/sf-timeago.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { UserAvatar } from "@/components/user-avatar.tsx";
import { InstanceServiceClient } from "@/generated/soulfire/instance.client.ts";
import {
  type InstanceAuditLogResponse,
  type InstanceAuditLogResponse_AuditLogEntry,
  InstanceAuditLogResponse_AuditLogEntryType,
} from "@/generated/soulfire/instance.ts";
import { useDataTable } from "@/hooks/use-data-table.ts";
import {
  getEnumEntries,
  getEnumKeyByValue,
  mapUnionToValue,
} from "@/lib/types.ts";
import { timestampToDate } from "@/lib/utils.tsx";
import { createTransport } from "@/lib/web-rpc.ts";

export const Route = createFileRoute(
  "/_dashboard/instance/$instance/audit-log",
)({
  beforeLoad: (props) => {
    const { instance } = props.params;
    const auditLogQueryOptions = queryOptions({
      queryKey: ["instance-audit-log", instance],
      queryFn: async (props): Promise<InstanceAuditLogResponse> => {
        const transport = createTransport();
        if (transport === null) {
          return {
            entry: [],
          };
        }

        const instanceService = new InstanceServiceClient(transport);
        const result = await instanceService.getAuditLog(
          {
            id: instance,
          },
          {
            abort: props.signal,
          },
        );

        return result.response;
      },
      refetchInterval: 3_000,
    });
    props.abortController.signal.addEventListener("abort", () => {
      void props.context.queryClient.cancelQueries({
        queryKey: auditLogQueryOptions.queryKey,
      });
    });
    return {
      auditLogQueryOptions,
    };
  },
  loader: (props) => {
    void props.context.queryClient.prefetchQuery(
      props.context.auditLogQueryOptions,
    );
  },
  component: AuditLog,
});

function toI18nKey(type: InstanceAuditLogResponse_AuditLogEntryType) {
  switch (type) {
    case InstanceAuditLogResponse_AuditLogEntryType.START_ATTACK:
      return "auditLog.startedAttack";
    case InstanceAuditLogResponse_AuditLogEntryType.STOP_ATTACK:
      return "auditLog.stoppedAttack";
    case InstanceAuditLogResponse_AuditLogEntryType.RESUME_ATTACK:
      return "auditLog.resumedAttack";
    case InstanceAuditLogResponse_AuditLogEntryType.PAUSE_ATTACK:
      return "auditLog.pausedAttack";
    case InstanceAuditLogResponse_AuditLogEntryType.EXECUTE_COMMAND:
      return "auditLog.executedCommand";
  }
}

const logTypeToIcon = (
  type: keyof typeof InstanceAuditLogResponse_AuditLogEntryType,
) =>
  mapUnionToValue(type, (key) => {
    switch (key) {
      case "EXECUTE_COMMAND":
        return SquareTerminalIcon;
      case "START_ATTACK":
        return PlayIcon;
      case "PAUSE_ATTACK":
        return TimerIcon;
      case "RESUME_ATTACK":
        return TimerOffIcon;
      case "STOP_ATTACK":
        return SquareIcon;
    }
  });

const columns: ColumnDef<InstanceAuditLogResponse_AuditLogEntry>[] = [
  {
    id: "user",
    accessorFn: (row) => `${row.user!.username} ${row.user!.email}`,
    accessorKey: "user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-row items-center justify-start gap-2">
        <UserAvatar
          username={row.original.user!.username}
          email={row.original.user!.email}
          className="size-8"
        />
        {row.original.user!.username}
      </div>
    ),
    meta: {
      label: "User",
      placeholder: "Search users...",
      variant: "text",
      icon: TextIcon,
    },
    enableColumnFilter: true,
  },
  {
    id: "type",
    accessorFn: (row) =>
      getEnumKeyByValue(InstanceAuditLogResponse_AuditLogEntryType, row.type),
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const Icon = logTypeToIcon(
        getEnumKeyByValue(
          InstanceAuditLogResponse_AuditLogEntryType,
          row.original.type,
        ),
      );

      return (
        <Badge variant="outline" className="capitalize">
          <Icon />
          <Trans
            i18nKey={toI18nKey(row.original.type)}
            values={{
              data: row.original.data,
            }}
          />
        </Badge>
      );
    },
    meta: {
      label: "Type",
      variant: "multiSelect",
      options: getEnumEntries(InstanceAuditLogResponse_AuditLogEntryType).map(
        (type) => {
          return {
            label: type.key,
            value: type.key,
            icon: logTypeToIcon(type.key),
          };
        },
      ),
    },
    enableColumnFilter: true,
  },
  {
    id: "timestamp",
    accessorFn: (row) => timestampToDate(row.timestamp!),
    accessorKey: "timestamp",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Timestamp" />
    ),
    cell: ({ row }) => (
      <SFTimeAgo date={timestampToDate(row.original.timestamp!)} />
    ),
    enableGlobalFilter: false,
    sortingFn: "datetime",
    meta: {
      label: "Timestamp",
      placeholder: "Search timestamps...",
      variant: "dateRange",
    },
    filterFn: "inNumberRange",
    enableColumnFilter: true,
  },
];

function AuditLog() {
  const { t } = useTranslation("common");

  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: "controls",
          content: t("breadcrumbs.controls"),
        },
      ]}
      pageName={t("pageName.audit-log")}
    >
      <Content />
    </InstancePageLayout>
  );
}

function Content() {
  const { auditLogQueryOptions } = Route.useRouteContext();
  const { data: auditLog } = useSuspenseQuery(auditLogQueryOptions);
  const { table } = useDataTable({
    data: auditLog.entry,
    columns,
    getRowId: (row) => row.id,
  });

  return (
    <div className="container flex h-full w-full grow flex-col gap-4">
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}
