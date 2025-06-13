import { createFileRoute } from '@tanstack/react-router';
import { TerminalComponent } from '@/components/terminal.tsx';
import ControlsMenu from '@/components/controls-menu.tsx';
import CommandInput from '@/components/command-input.tsx';
import { useMemo } from 'react';
import { translateInstanceState } from '@/lib/types.ts';
import { Badge } from '@/components/ui/badge';
import InstancePageLayout from '@/components/nav/instance/instance-page-layout.tsx';
import { LogScope } from '@/generated/soulfire/logs.ts';
import { CommandScope } from '@/generated/soulfire/command.ts';
import { useTranslation } from 'react-i18next';
import { hasInstancePermission } from '@/lib/utils.tsx';
import { InstancePermission } from '@/generated/soulfire/common.ts';
import { useSuspenseQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/_dashboard/instance/$instance/')({
  component: Console,
});

function Console() {
  const { t } = useTranslation('common');

  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: 'controls',
          content: t('breadcrumbs.controls'),
        },
      ]}
      pageName={t('pageName.console')}
    >
      <Content />
    </InstancePageLayout>
  );
}

function Content() {
  const { i18n } = useTranslation('common');
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const logScope = useMemo<LogScope>(
    () => ({
      scope: {
        oneofKind: 'instance',
        instance: {
          instanceId: instanceInfo.id,
        },
      },
    }),
    [instanceInfo.id],
  );
  const commandScope = useMemo<CommandScope>(
    () => ({
      scope: {
        oneofKind: 'instance',
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
        {hasInstancePermission(
          instanceInfo,
          InstancePermission.INSTANCE_COMMAND_EXECUTION,
        ) && <CommandInput scope={commandScope} />}
      </div>
      <ControlsMenu />
    </div>
  );
}
