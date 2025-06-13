import { createFileRoute } from '@tanstack/react-router';
import { TerminalComponent } from '@/components/terminal.tsx';
import CommandInput from '@/components/command-input.tsx';
import UserPageLayout from '@/components/nav/user/user-page-layout';
import { useMemo } from 'react';
import { CommandScope } from '@/generated/soulfire/command.ts';
import { LogScope } from '@/generated/soulfire/logs.ts';
import { useTranslation } from 'react-i18next';
import { hasGlobalPermission } from '@/lib/utils.tsx';
import { GlobalPermission } from '@/generated/soulfire/common.ts';
import { useSuspenseQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/_dashboard/user/admin/console')({
  component: Console,
});

function Console() {
  const { t } = useTranslation('common');

  return (
    <UserPageLayout
      showUserCrumb={false}
      extraCrumbs={[
        {
          id: 'admin',
          content: t('breadcrumbs.admin'),
        },
      ]}
      pageName={t('pageName.console')}
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
        oneofKind: 'global',
        global: {},
      },
    }),
    [],
  );
  const commandScope = useMemo<CommandScope>(
    () => ({
      scope: {
        oneofKind: 'global',
        global: {},
      },
    }),
    [],
  );

  return (
    <div className="flex flex-col gap-2">
      {hasGlobalPermission(
        clientData,
        GlobalPermission.GLOBAL_SUBSCRIBE_LOGS,
      ) && <TerminalComponent scope={logScope} />}
      {hasGlobalPermission(
        clientData,
        GlobalPermission.GLOBAL_COMMAND_EXECUTION,
      ) && <CommandInput scope={commandScope} />}
    </div>
  );
}
