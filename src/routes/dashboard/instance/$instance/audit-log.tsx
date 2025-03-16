import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { DataTable } from '@/components/data-table.tsx';
import { ColumnDef } from '@tanstack/react-table';
import { getEnumKeyByValue } from '@/lib/types.ts';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import { createTransport } from '@/lib/web-rpc.ts';
import { queryClientInstance } from '@/lib/query.ts';
import { LoadingComponent } from '@/components/loading-component.tsx';
import { UserAvatar } from '@/components/user-avatar.tsx';
import {
  InstanceAuditLogResponse,
  InstanceAuditLogResponse_AuditLogEntry,
  InstanceAuditLogResponse_AuditLogEntryType,
} from '@/generated/soulfire/instance.ts';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import InstancePageLayout from '@/components/nav/instance-page-layout.tsx';
import { timestampToDate } from '@/lib/utils.tsx';
import ReactTimeago from 'react-timeago';

export const Route = createFileRoute('/dashboard/instance/$instance/audit-log')(
  {
    beforeLoad: (props) => {
      const { instance } = props.params;
      const auditLogQueryOptions = queryOptions({
        queryKey: ['instance-audit-log', instance],
        queryFn: async (
          props,
        ): Promise<{
          auditLog: InstanceAuditLogResponse;
        }> => {
          const transport = createTransport();
          if (transport === null) {
            return {
              auditLog: {
                entry: [],
              },
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

          return {
            auditLog: result.response,
          };
        },
        refetchInterval: 3_000,
      });
      props.abortController.signal.addEventListener('abort', () => {
        void queryClientInstance.cancelQueries(auditLogQueryOptions);
      });
      return {
        auditLogQueryOptions,
      };
    },
    loader: async (props) => {
      await queryClientInstance.prefetchQuery(
        props.context.auditLogQueryOptions,
      );
    },
    component: AuditLog,
  },
);

function toI18nKey(type: InstanceAuditLogResponse_AuditLogEntryType) {
  switch (type) {
    case InstanceAuditLogResponse_AuditLogEntryType.START_ATTACK:
      return 'auditLog.startedAttack';
    case InstanceAuditLogResponse_AuditLogEntryType.STOP_ATTACK:
      return 'auditLog.stoppedAttack';
    case InstanceAuditLogResponse_AuditLogEntryType.RESUME_ATTACK:
      return 'auditLog.resumedAttack';
    case InstanceAuditLogResponse_AuditLogEntryType.PAUSE_ATTACK:
      return 'auditLog.pausedAttack';
    case InstanceAuditLogResponse_AuditLogEntryType.EXECUTE_COMMAND:
      return 'auditLog.executedCommand';
  }
}

const columns: ColumnDef<InstanceAuditLogResponse_AuditLogEntry>[] = [
  {
    accessorKey: 'user',
    header: () => <Trans i18nKey="auditLog.user" />,
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
    sortingFn: 'fuzzySort',
  },
  {
    accessorFn: (row) =>
      `${getEnumKeyByValue(InstanceAuditLogResponse_AuditLogEntryType, row.type)} ${row.data}`,
    accessorKey: 'type',
    header: () => <Trans i18nKey="auditLog.action" />,
    cell: ({ row }) => (
      <p>
        <Trans
          i18nKey={toI18nKey(row.original.type)}
          values={{
            data: row.original.data,
          }}
        />
      </p>
    ),
    sortingFn: 'fuzzySort',
  },
  {
    accessorKey: 'timestamp',
    header: () => <Trans i18nKey="auditLog.timestamp" />,
    cell: ({ row }) => (
      <ReactTimeago date={timestampToDate(row.original.timestamp!)} />
    ),
    sortingFn: 'fuzzySort',
  },
];

function AuditLog() {
  const { t } = useTranslation('common');
  const { auditLogQueryOptions } = Route.useRouteContext();
  const auditLog = useQuery(auditLogQueryOptions);

  if (auditLog.isError) {
    throw auditLog.error;
  }

  if (auditLog.isLoading || !auditLog.data) {
    return <LoadingComponent />;
  }

  return (
    <InstancePageLayout
      extraCrumbs={[t('breadcrumbs.controls')]}
      pageName={t('pageName.audit-log')}
    >
      <div className="grow flex h-full w-full flex-col gap-4 max-w-4xl">
        <DataTable
          filterPlaceholder={t('auditLog.filterPlaceholder')}
          columns={columns}
          data={auditLog.data.auditLog.entry}
        />
      </div>
    </InstancePageLayout>
  );
}
