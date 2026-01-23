import {
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { ColumnDef, Row } from "@tanstack/react-table";
import type { Table as ReactTable } from "@tanstack/table-core";
import {
  GlobeIcon,
  Grid2x2Icon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SquareCodeIcon,
  TextIcon,
  TrashIcon,
} from "lucide-react";
import { createContext, use, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table.tsx";
import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/components/data-table/data-table-action-bar.tsx";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header.tsx";
import {
  SelectAllHeader,
  SelectRowHeader,
} from "@/components/data-table/data-table-selects.tsx";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list.tsx";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar.tsx";
import { ManageScriptDialog } from "@/components/dialog/manage-script-dialog.tsx";
import { CopyInfoButton } from "@/components/info-buttons.tsx";
import { TransportContext } from "@/components/providers/transport-context.tsx";
import { SFTimeAgo } from "@/components/sf-timeago.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import type { Timestamp } from "@/generated/google/protobuf/timestamp";
import { ScriptServiceClient } from "@/generated/soulfire/script.client.ts";
import {
  ScriptLanguage,
  type ScriptListResponse,
  type ScriptListResponse_Script,
  type ScriptScope,
} from "@/generated/soulfire/script.ts";
import { useDataTable } from "@/hooks/use-data-table.ts";
import {
  getEnumEntries,
  getEnumKeyByValue,
  mapUnionToValue,
} from "@/lib/types.ts";
import { timestampToDate } from "@/lib/utils.tsx";
import { createTransport } from "@/lib/web-rpc.ts";

export type ScriptsProps = {
  queryKey: QueryKey;
  scope: ScriptScope;
  scriptList: ScriptListResponse;
};

const ScriptsContext = createContext<ScriptsProps>(null as never);

const scriptLanguageToIcon = (type: keyof typeof ScriptLanguage) =>
  mapUnionToValue(type, (key) => {
    switch (key) {
      case "JAVASCRIPT":
      case "TYPESCRIPT":
      case "PYTHON":
        return SquareCodeIcon;
    }
  });

const columns: ColumnDef<ScriptListResponse_Script>[] = [
  {
    id: "select",
    header: SelectAllHeader,
    cell: SelectRowHeader,
    size: 32,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "scriptName",
    accessorKey: "scriptName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Name" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-row items-center gap-2">
        <span className="max-w-64 truncate">{row.original.scriptName}</span>
        <CopyInfoButton value={row.original.id} />
      </div>
    ),
    meta: {
      label: "Name",
      placeholder: "Search names...",
      variant: "text",
      icon: TextIcon,
    },
    enableColumnFilter: true,
  },
  {
    id: "scriptScope",
    accessorFn: (row) => row.scriptScope?.scope.oneofKind ?? "",
    accessorKey: "scriptScope",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Scope" />
    ),
    cell: ({ row }) => {
      return row.original.scriptScope?.scope.oneofKind === "instanceScript" ? (
        <div className="flex flex-row items-center gap-2">
          <Badge variant="outline" className="capitalize">
            <Grid2x2Icon />
            <Trans i18nKey="common:scripts.instanceScript" />
          </Badge>
          <CopyInfoButton
            value={row.original.scriptScope?.scope.instanceScript.id}
          />
        </div>
      ) : (
        <Badge variant="outline" className="capitalize">
          <GlobeIcon />
          <Trans i18nKey="common:scripts.globalScript" />
        </Badge>
      );
    },
    meta: {
      label: "Scope",
      variant: "multiSelect",
      options: [
        {
          label: "Global",
          value: "globalScript",
          icon: GlobeIcon,
        },
        {
          label: "Instance",
          value: "instanceScript",
          icon: Grid2x2Icon,
        },
      ],
    },
    enableColumnFilter: true,
  },
  {
    id: "language",
    accessorFn: (row) => getEnumKeyByValue(ScriptLanguage, row.language),
    accessorKey: "language",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Language" />
    ),
    cell: ({ cell }) => {
      const type = cell.getValue<keyof typeof ScriptLanguage>();
      const Icon = scriptLanguageToIcon(type);

      return (
        <Badge variant="outline" className="capitalize">
          <Icon />
          {type}
        </Badge>
      );
    },
    meta: {
      label: "Language",
      variant: "multiSelect",
      options: getEnumEntries(ScriptLanguage).map((type) => {
        return {
          label: type.key,
          value: type.key,
          icon: scriptLanguageToIcon(type.key),
        };
      }),
    },
    enableColumnFilter: true,
  },
  {
    id: "elevatedPermissions",
    accessorKey: "elevatedPermissions",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Elevated permissions" />
    ),
    meta: {
      label: "Elevated permissions",
      placeholder: "Search elevated permissions...",
      variant: "boolean",
    },
    enableColumnFilter: true,
  },
  {
    id: "createdAt",
    accessorFn: (row) => timestampToDate(row.createdAt as Timestamp),
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Created at" />
    ),
    cell: ({ row }) => (
      <SFTimeAgo date={timestampToDate(row.original.createdAt as Timestamp)} />
    ),
    enableGlobalFilter: false,
    sortingFn: "datetime",
    meta: {
      label: "Created at",
      placeholder: "Search created ats...",
      variant: "dateRange",
    },
    filterFn: "inNumberRange",
    enableColumnFilter: true,
  },
  {
    id: "actions",
    header: () => <Trans i18nKey="common:scripts.table.actions" />,
    cell: ({ row }) => (
      <div className="flex flex-row gap-2">
        <UpdateScriptButton row={row} />
        <RestartScriptButton row={row} />
      </div>
    ),
    size: 64,
    enableSorting: false,
    enableHiding: false,
  },
];

function UpdateScriptButton(props: { row: Row<ScriptListResponse_Script> }) {
  const [open, setOpen] = useState(false);
  const { queryKey, scope } = use(ScriptsContext);

  return (
    <>
      <Button
        disabled={!props.row.getCanSelect()}
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <PencilIcon />
      </Button>
      <ManageScriptDialog
        mode="edit"
        script={props.row.original}
        open={open}
        setOpen={setOpen}
        scope={scope}
        scriptsQueryKey={queryKey}
      />
    </>
  );
}

function RestartScriptButton(props: { row: Row<ScriptListResponse_Script> }) {
  const { t } = useTranslation("common");

  return (
    <Button
      disabled={!props.row.getCanSelect()}
      variant="secondary"
      size="sm"
      onClick={() => {
        const transport = createTransport();
        if (transport === null) {
          return;
        }

        const scriptService = new ScriptServiceClient(transport);
        toast.promise(
          scriptService
            .restartScript({
              id: props.row.original.id,
            })
            .then((r) => r.response),
          {
            loading: t("scripts.restartToast.loading"),
            success: () => {
              return t("scripts.restartToast.success");
            },
            error: (e) => {
              console.error(e);
              return t("scripts.restartToast.error");
            },
          },
        );
      }}
    >
      <RotateCcwIcon />
    </Button>
  );
}

function AddButton() {
  const [createOpen, setCreateOpen] = useState(false);
  const { queryKey, scope } = use(ScriptsContext);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
        <PlusIcon />
      </Button>
      <ManageScriptDialog
        mode="add"
        open={createOpen}
        setOpen={setCreateOpen}
        scope={scope}
        scriptsQueryKey={queryKey}
      />
    </>
  );
}

function ExtraHeader(props: { table: ReactTable<ScriptListResponse_Script> }) {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const transport = use(TransportContext);
  const { queryKey } = use(ScriptsContext);
  const { mutateAsync: deleteScriptsMutation } = useMutation({
    mutationFn: async (user: ScriptListResponse_Script[]) => {
      if (transport === null) {
        return;
      }

      const scriptService = new ScriptServiceClient(transport);
      for (const u of user) {
        await scriptService.deleteScript({
          id: u.id,
        });
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKey,
      });
    },
  });

  return (
    <>
      <DataTableActionBarAction
        tooltip="Remove selected scripts"
        onClick={() => {
          const selectedRows = props.table
            .getFilteredSelectedRowModel()
            .rows.map((r) => r.original);

          toast.promise(deleteScriptsMutation(selectedRows), {
            loading: t("scripts.removeToast.loading"),
            success: t("scripts.removeToast.success"),
            error: (e) => {
              console.error(e);
              return t("scripts.removeToast.error");
            },
          });
        }}
      >
        <TrashIcon />
      </DataTableActionBarAction>
      <DataTableActionBarSelection table={props.table} />
    </>
  );
}

export function GenericScripts(props: ScriptsProps) {
  const { table } = useDataTable({
    data: props.scriptList.scripts,
    columns,
    getRowId: (row) => row.id,
  });

  return (
    <div className="container flex h-full w-full grow flex-col gap-4">
      <ScriptsContext value={props}>
        <DataTable
          table={table}
          actionBar={
            <DataTableActionBar table={table}>
              <ExtraHeader table={table} />
            </DataTableActionBar>
          }
        >
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} />
            <AddButton />
          </DataTableToolbar>
        </DataTable>
      </ScriptsContext>
    </div>
  );
}
