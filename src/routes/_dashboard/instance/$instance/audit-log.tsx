import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { DataTable, DateRange } from '@/components/data-table.tsx';
import { ColumnDef, Table as ReactTable } from '@tanstack/react-table';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import { createTransport } from '@/lib/web-rpc.ts';
import { queryClientInstance } from '@/lib/query.ts';
import { UserAvatar } from '@/components/user-avatar.tsx';
import {
  InstanceAuditLogResponse,
  InstanceAuditLogResponse_AuditLogEntry,
  InstanceAuditLogResponse_AuditLogEntryType,
} from '@/generated/soulfire/instance.ts';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import InstancePageLayout from '@/components/nav/instance-page-layout.tsx';
import { cn, timestampToDate } from '@/lib/utils.tsx';
import i18n from '@/lib/i18n.ts';
import { Button } from '@/components/ui/button.tsx';
import { CalendarIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/use-date-fns-locale.ts';
import { SFTimeAgo } from '@/components/sf-timeago.tsx';

export const Route = createFileRoute(
  '/_dashboard/instance/$instance/audit-log',
)({
  beforeLoad: (props) => {
    const { instance } = props.params;
    const auditLogQueryOptions = queryOptions({
      queryKey: ['instance-audit-log', instance],
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
    props.abortController.signal.addEventListener('abort', () => {
      void queryClientInstance.cancelQueries({
        queryKey: auditLogQueryOptions.queryKey,
      });
    });
    return {
      auditLogQueryOptions,
    };
  },
  loader: (props) => {
    void queryClientInstance.prefetchQuery(props.context.auditLogQueryOptions);
  },
  component: AuditLog,
});

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
    accessorFn: (row) => `${row.user!.username} ${row.user!.email}`,
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
      i18n.t(toI18nKey(row.type), {
        data: row.data,
      }),
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
    accessorFn: (row) => timestampToDate(row.timestamp!),
    accessorKey: 'timestamp',
    header: () => <Trans i18nKey="auditLog.timestamp" />,
    cell: ({ row }) => (
      <SFTimeAgo date={timestampToDate(row.original.timestamp!)} />
    ),
    enableGlobalFilter: false,
    sortingFn: 'datetime',
    filterFn: 'isWithinRange',
  },
];

function getPreviousMonthDate(date: Date | undefined): Date | undefined {
  if (!date) {
    return undefined;
  }

  const prevMonthDate = new Date(date);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  return prevMonthDate;
}

function ExtraHeader(props: {
  table: ReactTable<InstanceAuditLogResponse_AuditLogEntry>;
}) {
  const { t } = useTranslation('common');
  const dateFnsLocale = useDateFnsLocale();
  const timestampColumn = props.table.getColumn('timestamp')!;
  const range = timestampColumn.getFilterValue() as DateRange | undefined;

  return (
    <>
      <div className="grid gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'w-[300px] justify-start text-left font-normal',
                !range && 'text-muted-foreground',
              )}
            >
              <CalendarIcon />
              {range?.from ? (
                range.to ? (
                  <>
                    {format(range.from, 'PP', {
                      locale: dateFnsLocale,
                    })}{' '}
                    -{' '}
                    {format(range.to, 'PP', {
                      locale: dateFnsLocale,
                    })}
                  </>
                ) : (
                  <>
                    {format(range.from, 'PP', {
                      locale: dateFnsLocale,
                    })}
                  </>
                )
              ) : (
                <span>{t('pickADate')}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              locale={dateFnsLocale}
              mode="range"
              defaultMonth={getPreviousMonthDate(new Date())}
              selected={range}
              onSelect={timestampColumn.setFilterValue}
              numberOfMonths={2}
              fromDate={props.table
                .getCoreRowModel()
                .rows.map((row) => timestampToDate(row.original.timestamp!))
                .reduce((a, b) => (a < b ? a : b), new Date())}
              toDate={new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}

function AuditLog() {
  const { t } = useTranslation('common');
  const { auditLogQueryOptions } = Route.useRouteContext();
  const { data: auditLog } = useSuspenseQuery(auditLogQueryOptions);

  return (
    <InstancePageLayout
      extraCrumbs={[t('breadcrumbs.controls')]}
      pageName={t('pageName.audit-log')}
    >
      <div className="flex h-full w-full max-w-4xl grow flex-col gap-4">
        <DataTable
          filterPlaceholder={t('auditLog.filterPlaceholder')}
          columns={columns}
          data={auditLog.entry}
          extraHeader={ExtraHeader}
        />
      </div>
    </InstancePageLayout>
  );
}
