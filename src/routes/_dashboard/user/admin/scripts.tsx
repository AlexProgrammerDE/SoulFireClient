import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useContext, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { DataTable } from '@/components/data-table.tsx';
import { ColumnDef, Row, Table as ReactTable } from '@tanstack/react-table';
import { getEnumKeyByValue } from '@/lib/types.ts';
import { toast } from 'sonner';
import { PencilIcon, PlusIcon, RotateCcwIcon, TrashIcon } from 'lucide-react';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import {
  SelectAllHeader,
  SelectRowHeader,
} from '@/components/data-table-selects.tsx';
import { createTransport } from '@/lib/web-rpc.ts';
import { queryClientInstance } from '@/lib/query.ts';
import { LoadingComponent } from '@/components/loading-component.tsx';
import UserPageLayout from '@/components/nav/user-page-layout.tsx';
import { timestampToDate } from '@/lib/utils.tsx';
import { SFTimeAgo } from '@/components/sf-timeago.tsx';
import {
  ScriptLanguage,
  ScriptListResponse,
  ScriptListResponse_Script,
} from '@/generated/soulfire/script.ts';
import { ScriptServiceClient } from '@/generated/soulfire/script.client.ts';
import { ManageScriptPopup } from '@/components/dialog/manage-script-popup.tsx';

export const Route = createFileRoute('/_dashboard/user/admin/scripts')({
  beforeLoad: (props) => {
    const globalScriptsQueryOptions = queryOptions({
      queryKey: ['global-scripts'],
      queryFn: async (
        props,
      ): Promise<{
        scriptList: ScriptListResponse;
      }> => {
        const transport = createTransport();
        if (transport === null) {
          return {
            scriptList: {
              scripts: [],
            },
          };
        }

        const scriptService = new ScriptServiceClient(transport);
        const result = await scriptService.listScripts(
          {
            scope: {
              scope: {
                oneofKind: 'globalScript',
                globalScript: {},
              },
            },
          },
          {
            abort: props.signal,
          },
        );

        return {
          scriptList: result.response,
        };
      },
      refetchInterval: 3_000,
    });
    props.abortController.signal.addEventListener('abort', () => {
      void queryClientInstance.cancelQueries({
        queryKey: globalScriptsQueryOptions.queryKey,
      });
    });
    return {
      globalScriptsQueryOptions,
    };
  },
  loader: async (props) => {
    await queryClientInstance.prefetchQuery(
      props.context.globalScriptsQueryOptions,
    );
  },
  component: Users,
});

const columns: ColumnDef<ScriptListResponse_Script>[] = [
  {
    id: 'select',
    header: SelectAllHeader,
    cell: SelectRowHeader,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'scriptName',
    header: () => <Trans i18nKey="common:scripts.table.scriptName" />,
    sortingFn: 'fuzzySort',
  },
  {
    accessorFn: (row) => getEnumKeyByValue(ScriptLanguage, row.language),
    accessorKey: 'language',
    header: () => <Trans i18nKey="common:scripts.table.language" />,
    sortingFn: 'fuzzySort',
  },
  {
    accessorKey: 'elevatedPermissions',
    header: () => <Trans i18nKey="common:scripts.table.elevatedPermissions" />,
    sortingFn: 'fuzzySort',
  },
  {
    accessorFn: (row) => timestampToDate(row.createdAt!),
    accessorKey: 'createdAt',
    header: () => <Trans i18nKey="common:scripts.table.createdAt" />,
    cell: ({ row }) => (
      <SFTimeAgo date={timestampToDate(row.original.createdAt!)} />
    ),
    enableGlobalFilter: false,
    sortingFn: 'datetime',
    filterFn: 'isWithinRange',
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
    enableSorting: false,
    enableHiding: false,
  },
];

function UpdateScriptButton(props: { row: Row<ScriptListResponse_Script> }) {
  const [open, setOpen] = useState(false);
  const { globalScriptsQueryOptions } = Route.useRouteContext();

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
      <ManageScriptPopup
        mode="edit"
        script={props.row.original}
        open={open}
        setOpen={setOpen}
        scope={{
          scope: {
            oneofKind: 'globalScript',
            globalScript: {},
          },
        }}
        scriptsQueryKey={globalScriptsQueryOptions.queryKey}
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
  const transport = useContext(TransportContext);
  const [createOpen, setCreateOpen] = useState(false);
  const { globalScriptsQueryOptions } = Route.useRouteContext();
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
        queryKey: globalScriptsQueryOptions.queryKey,
      });
    },
  });

  return (
    <>
      <Button variant="outline" onClick={() => setCreateOpen(true)}>
        <PlusIcon className="h-4 w-4" />
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
        <TrashIcon className="h-4 w-4" />
      </Button>
      <ManageScriptPopup
        mode="add"
        open={createOpen}
        setOpen={setCreateOpen}
        scope={{
          scope: {
            oneofKind: 'globalScript',
            globalScript: {},
          },
        }}
        scriptsQueryKey={globalScriptsQueryOptions.queryKey}
      />
    </>
  );
}

function Users() {
  const { t } = useTranslation('common');
  const { globalScriptsQueryOptions } = Route.useRouteContext();
  const userList = useQuery(globalScriptsQueryOptions);

  if (userList.isError) {
    throw userList.error;
  }

  if (userList.isLoading || !userList.data) {
    return <LoadingComponent />;
  }

  return (
    <UserPageLayout
      showUserCrumb={false}
      extraCrumbs={[t('breadcrumbs.settings')]}
      pageName={t('pageName.adminScripts')}
    >
      <div className="flex h-full w-full max-w-4xl grow flex-col gap-4">
        <DataTable
          filterPlaceholder={t('common:scripts.filterPlaceholder')}
          columns={columns}
          data={userList.data.scriptList.scripts}
          extraHeader={ExtraHeader}
        />
      </div>
    </UserPageLayout>
  );
}
