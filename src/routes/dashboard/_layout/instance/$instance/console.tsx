import { createFileRoute } from '@tanstack/react-router';
import { TerminalComponent } from '@/components/terminal.tsx';
import ControlsMenu from '@/components/controls-menu.tsx';
import CommandInput from '@/components/command-input.tsx';
import { useContext, useMemo } from 'react';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { getEnumKeyByValue } from '@/lib/types.ts';
import { InstanceState } from '@/generated/soulfire/instance.ts';
import { Badge } from '@/components/ui/badge';
import InstancePageLayout from '@/components/nav/instance-page-layout.tsx';
import { LogRequest, PreviousLogRequest } from '@/generated/soulfire/logs.ts';
import {
  CommandCompletionRequest,
  CommandRequest,
} from '@/generated/soulfire/command.ts';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute(
  '/dashboard/_layout/instance/$instance/console',
)({
  component: Console,
});

function Console() {
  const { t } = useTranslation('common');
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
      <div className="grow flex h-full w-full flex-col gap-2 pb-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">
            {instanceInfo.friendlyName}
            <Badge className="m-auto ml-2" variant="secondary">
              {getEnumKeyByValue(InstanceState, instanceInfo.state)}
            </Badge>
          </h2>
          <TerminalComponent scope={scope} />
          <CommandInput scope={scope} />
        </div>
        <ControlsMenu />
      </div>
    </InstancePageLayout>
  );
}
