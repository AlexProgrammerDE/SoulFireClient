import { createFileRoute } from '@tanstack/react-router';
import { TerminalComponent } from '@/components/terminal.tsx';
import CommandInput from '@/components/command-input.tsx';
import UserPageLayout from '@/components/nav/user-page-layout';
import { useMemo } from 'react';
import {
  CommandCompletionRequest,
  CommandRequest,
} from '@/generated/soulfire/command.ts';
import { LogRequest, PreviousLogRequest } from '@/generated/soulfire/logs.ts';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute(
  '/dashboard/_layout/admin/_layout/console',
)({
  component: Console,
});

function Console() {
  const { t } = useTranslation('common');
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
      pageName="Console"
    >
      <div className="flex flex-col gap-2">
        <TerminalComponent scope={scope} />
        <CommandInput scope={scope} />
      </div>
    </UserPageLayout>
  );
}
