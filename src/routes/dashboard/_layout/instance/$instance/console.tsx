import { createFileRoute } from '@tanstack/react-router';
import { TerminalComponent } from '@/components/terminal.tsx';
import ControlsMenu from '@/components/controls-menu.tsx';
import CommandInput from '@/components/command-input.tsx';
import { useContext } from 'react';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { getEnumKeyByValue } from '@/lib/types.ts';
import { InstanceState } from '@/generated/soulfire/instance.ts';
import { Badge } from '@/components/ui/badge';
import InstancePageLayout from '@/components/nav/instance-page-layout.tsx';

export const Route = createFileRoute(
  '/dashboard/_layout/instance/$instance/console',
)({
  component: Console,
});

function Console() {
  const instanceInfo = useContext(InstanceInfoContext);

  return (
    <InstancePageLayout extraCrumbs={['Controls']} pageName="Console">
      <div className="grow flex h-full w-full flex-col gap-2 pb-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">
            {instanceInfo.friendlyName}
            <Badge className="m-auto ml-2" variant="secondary">
              {getEnumKeyByValue(InstanceState, instanceInfo.state)}
            </Badge>
          </h2>
          <TerminalComponent />
          <CommandInput />
        </div>
        <ControlsMenu />
      </div>
    </InstancePageLayout>
  );
}
