import { createFileRoute } from '@tanstack/react-router';
import InstancePageLayout from '@/components/nav/instance-page-layout.tsx';
import { useTranslation } from 'react-i18next';
import { queryOptions, useQuery } from '@tanstack/react-query';
import {
  InstanceAuditLogResponse,
  InstanceAuditLogResponse_AuditLogEntryType,
} from '@/generated/soulfire/instance.ts';
import { createTransport } from '@/lib/web-rpc.ts';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { queryClientInstance } from '@/lib/query.ts';
import { LoadingComponent } from '@/components/loading-component.tsx';
import { Card, CardDescription } from '@/components/ui/card.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getGravatarUrl } from '@/lib/utils.tsx';
import { SFTimeAgo } from '@/components/SFTimeAgo.tsx';

export const Route = createFileRoute(
  '/dashboard/_layout/instance/$instance/audit-log',
)({
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
      auditLogQueryOptions: auditLogQueryOptions,
    };
  },
  loader: async (props) => {
    await queryClientInstance.prefetchQuery(props.context.infoQueryOptions);
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
      <div className="grow flex flex-col h-full w-full gap-4">
        {auditLog.data.auditLog.entry.map((entry) => {
          const i18nKey = toI18nKey(entry.type);
          return (
            <Card
              className="flex flex-row p-4 items-center h-20 gap-4"
              key={entry.id}
            >
              <Avatar className="rounded-lg">
                <AvatarImage
                  src={getGravatarUrl(entry.user!.email)}
                  alt={entry.user!.username}
                />
                <AvatarFallback className="rounded-lg">
                  {entry.user!.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col justify-center">
                <p>
                  {t(i18nKey, {
                    username: entry.user!.username,
                    data: entry.data,
                  })}
                </p>
                <CardDescription>
                  <SFTimeAgo
                    date={new Date(parseInt(entry.timestamp!.seconds) * 1000)}
                  />
                </CardDescription>
              </div>
            </Card>
          );
        })}
      </div>
    </InstancePageLayout>
  );
}
