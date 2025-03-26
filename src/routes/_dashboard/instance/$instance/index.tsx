import { createFileRoute } from '@tanstack/react-router';
import { TerminalComponent } from '@/components/terminal.tsx';
import ControlsMenu from '@/components/controls-menu.tsx';
import CommandInput from '@/components/command-input.tsx';
import { useContext, useMemo } from 'react';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { translateInstanceState } from '@/lib/types.ts';
import { Badge } from '@/components/ui/badge';
import InstancePageLayout from '@/components/nav/instance-page-layout.tsx';
import { LogRequest, PreviousLogRequest } from '@/generated/soulfire/logs.ts';
import {
  CommandCompletionRequest,
  CommandRequest,
} from '@/generated/soulfire/command.ts';
import { useTranslation } from 'react-i18next';
import { hasInstancePermission } from '@/lib/utils.tsx';
import { InstancePermission } from '@/generated/soulfire/common.ts';

export const Route = createFileRoute('/_dashboard/instance/$instance/')({
  component: Console,
});

function Console() {
  const { t, i18n } = useTranslation('common');
  const instanceInfo = useContext(InstanceInfoContext);
  const scope = useMemo<
    | PreviousLogRequest['scope']
    | LogRequest['scope']
    | CommandRequest['scope']
    | CommandCompletionRequest['scope']
  >(
    () => ({
      oneofKind: 'instance',
      instance: {
        instanceId: instanceInfo.id,
      },
    }),
    [instanceInfo.id],
  );

  return (
    <InstancePageLayout
      extraCrumbs={[t('breadcrumbs.controls')]}
      pageName={t('pageName.console')}
    >
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
          ) && <TerminalComponent scope={scope} />}
          {hasInstancePermission(
            instanceInfo,
            InstancePermission.INSTANCE_COMMAND_EXECUTION,
          ) && <CommandInput scope={scope} />}
        </div>
        <ControlsMenu />
      </div>
    </InstancePageLayout>
  );
}
