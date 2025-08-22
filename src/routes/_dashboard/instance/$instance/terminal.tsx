import { createFileRoute } from '@tanstack/react-router';
import { TerminalComponent } from '@/components/terminal.tsx';
import CommandInput from '@/components/command-input.tsx';
import { useMemo } from 'react';
import InstancePageLayout from '@/components/nav/instance/instance-page-layout.tsx';
import { LogScope } from '@/generated/soulfire/logs.ts';
import { CommandScope } from '@/generated/soulfire/command.ts';
import { useTranslation } from 'react-i18next';
import { hasInstancePermission } from '@/lib/utils.tsx';
import { InstancePermission } from '@/generated/soulfire/common.ts';
import { useSuspenseQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/_dashboard/instance/$instance/terminal')(
  {
    component: Terminal,
  },
);

function Terminal() {
  const { t } = useTranslation('common');

  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: 'controls',
          content: t('breadcrumbs.controls'),
        },
      ]}
      pageName={t('pageName.terminal')}
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
        oneofKind: 'personal',
        personal: {},
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
    <div className="flex flex-col gap-2">
      <TerminalComponent scope={logScope} />
      {hasInstancePermission(
        instanceInfo,
        InstancePermission.INSTANCE_COMMAND_EXECUTION,
      ) && <CommandInput scope={commandScope} />}
    </div>
  );
}
