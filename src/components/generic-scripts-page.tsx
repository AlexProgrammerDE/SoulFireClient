import { ColumnDef, Row } from '@tanstack/react-table';
import {
  ScriptLanguage,
  ScriptListResponse,
  ScriptListResponse_Script,
  ScriptScope,
} from '@/generated/soulfire/script.ts';
import {
  SelectAllHeader,
  SelectRowHeader,
} from '@/components/data-table/data-table-selects.tsx';
import { Trans, useTranslation } from 'react-i18next';
import { CopyInfoButton } from '@/components/info-buttons.tsx';
import { getEnumKeyByValue } from '@/lib/types.ts';
import { timestampToDate } from '@/lib/utils.tsx';
import { SFTimeAgo } from '@/components/sf-timeago.tsx';
import * as React from 'react';
import { createContext, use, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { PencilIcon, PlusIcon, RotateCcwIcon, TrashIcon } from 'lucide-react';
import { ManageScriptDialog } from '@/components/dialog/manage-script-dialog.tsx';
import { createTransport } from '@/lib/web-rpc.ts';
import { ScriptServiceClient } from '@/generated/soulfire/script.client.ts';
import { toast } from 'sonner';
import { Table as ReactTable } from '@tanstack/table-core';
import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { DataTable } from '@/components/data-table/data-table.tsx';
import { useDataTable } from '@/hooks/use-data-table.ts';
import { DataTableSortList } from '@/components/data-table/data-table-sort-list.tsx';
import { DataTableActionBar } from '@/components/data-table/data-table-action-bar.tsx';
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar.tsx';
import { DataTableFilterMenu } from '@/components/data-table/data-table-filter-menu.tsx';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header.tsx';

export type ScriptsProps = {
  queryKey: QueryKey;
  scope: ScriptScope;
  scriptList: ScriptListResponse;
};

const ScriptsContext = createContext<ScriptsProps>(null as never);

const columns: ColumnDef<ScriptListResponse_Script>[] = [
  {
    id: 'select',
    header: SelectAllHeader,
    cell: SelectRowHeader,
    size: 32,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'scriptName',
    accessorKey: 'scriptName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-row items-center gap-2">
        <span className="max-w-64 truncate">{row.original.scriptName}</span>
        <CopyInfoButton value={row.original.id} />
      </div>
    ),
  },
  {
    id: 'scriptScope',
    accessorFn: (row) => row.scriptScope?.scope.oneofKind ?? '',
    accessorKey: 'scriptScope',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Scope" />
    ),
    cell: ({ row }) => {
      return row.original.scriptScope?.scope.oneofKind === 'instanceScript' ? (
        <div className="flex flex-row items-center gap-2">
          <span className="max-w-64 truncate">
            <Trans i18nKey="common:scripts.instanceScript" />
          </span>
          <CopyInfoButton
            value={row.original.scriptScope?.scope.instanceScript.id}
          />
        </div>
      ) : (
        <Trans i18nKey="common:scripts.globalScript" />
      );
    },
  },
  {
    id: 'language',
    accessorFn: (row) => getEnumKeyByValue(ScriptLanguage, row.language),
    accessorKey: 'language',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Language" />
    ),
  },
  {
    id: 'elevatedPermissions',
    accessorKey: 'elevatedPermissions',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Elevated permissions" />
    ),
  },
  {
    id: 'createdAt',
    accessorFn: (row) => timestampToDate(row.createdAt!),
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created at" />
    ),
    cell: ({ row }) => (
      <SFTimeAgo date={timestampToDate(row.original.createdAt!)} />
    ),
    enableGlobalFilter: false,
    sortingFn: 'datetime',
  },
  {
    id: 'actions',
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
  const { t } = useTranslation('common');

  return (
    <>
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
              loading: t('scripts.restartToast.loading'),
              success: () => {
                return t('scripts.restartToast.success');
              },
              error: (e) => {
                console.error(e);
                return t('scripts.restartToast.error');
              },
            },
          );
        }}
      >
        <RotateCcwIcon />
      </Button>
    </>
  );
}

function ExtraHeader(props: { table: ReactTable<ScriptListResponse_Script> }) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const transport = use(TransportContext);
  const [createOpen, setCreateOpen] = useState(false);
  const { queryKey, scope } = use(ScriptsContext);
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
      <Button variant="outline" onClick={() => setCreateOpen(true)}>
        <PlusIcon />
      </Button>
      <Button
        variant="outline"
        disabled={props.table.getFilteredSelectedRowModel().rows.length === 0}
        onClick={() => {
          const selectedRows = props.table
            .getFilteredSelectedRowModel()
            .rows.map((r) => r.original);

          toast.promise(deleteScriptsMutation(selectedRows), {
            loading: t('scripts.removeToast.loading'),
            success: t('scripts.removeToast.success'),
            error: (e) => {
              console.error(e);
              return t('scripts.removeToast.error');
            },
          });
        }}
      >
        <TrashIcon />
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

export function GenericScripts(props: ScriptsProps) {
  const { table } = useDataTable({
    data: props.scriptList.scripts,
    columns,
    pageCount: -1,
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
          <DataTableAdvancedToolbar table={table}>
            <DataTableFilterMenu table={table} />
            <DataTableSortList table={table} />
          </DataTableAdvancedToolbar>
        </DataTable>
      </ScriptsContext>
    </div>
  );
}
