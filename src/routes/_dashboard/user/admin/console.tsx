import { createFileRoute } from '@tanstack/react-router';
import { TerminalComponent } from '@/components/terminal.tsx';
import CommandInput from '@/components/command-input.tsx';
import UserPageLayout from '@/components/nav/user-page-layout';
import { useContext, useMemo } from 'react';
import {
  CommandCompletionRequest,
  CommandRequest,
} from '@/generated/soulfire/command.ts';
import { LogRequest, PreviousLogRequest } from '@/generated/soulfire/logs.ts';
import { useTranslation } from 'react-i18next';
import { hasGlobalPermission } from '@/lib/utils.tsx';
import { GlobalPermission } from '@/generated/soulfire/common.ts';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';

export const Route = createFileRoute('/_dashboard/user/admin/console')({
  component: Console,
});

function Console() {
  const { t } = useTranslation('common');
  const clientData = useContext(ClientInfoContext);
  const scope = useMemo<
    | PreviousLogRequest['scope']
    | LogRequest['scope']
    | CommandRequest['scope']
    | CommandCompletionRequest['scope']
  >(
    () => ({
      oneofKind: 'global',
      global: {},
    }),
    [],
  );

  return (
    <UserPageLayout
      showUserCrumb={false}
      extraCrumbs={[t('breadcrumbs.admin')]}
      pageName={t('pageName.console')}
    >
      <div className="flex flex-col gap-2">
        {hasGlobalPermission(
          clientData,
          GlobalPermission.GLOBAL_SUBSCRIBE_LOGS,
        ) && <TerminalComponent scope={scope} />}
        {hasGlobalPermission(
          clientData,
          GlobalPermission.GLOBAL_COMMAND_EXECUTION,
        ) && <CommandInput scope={scope} />}
      </div>
    </UserPageLayout>
  );
}
