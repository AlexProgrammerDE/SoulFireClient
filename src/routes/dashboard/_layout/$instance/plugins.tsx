import { createFileRoute, Link } from '@tanstack/react-router';
import { useContext } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { Button } from '@/components/ui/button.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { SettingsPage_Type } from '@/generated/soulfire/config.ts';
import SettingsPageButton from '@/components/settings-page-button.tsx';
import { Undo2Icon } from 'lucide-react';

export const Route = createFileRoute('/dashboard/_layout/$instance/plugins')({
  component: Plugins,
});

function Plugins() {
  const clientInfo = useContext(ClientInfoContext);
  const instanceInfo = useContext(InstanceInfoContext);

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <Button asChild variant="secondary" className="flex flex-row gap-1">
        <Link
          to="/dashboard/$instance"
          params={{ instance: instanceInfo.id }}
          search={{}}
        >
          <div>
            <Undo2Icon className="h-4" />
          </div>
          <span>Back</span>
        </Link>
      </Button>
      <div className="grid h-full w-full auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clientInfo.settings
          .filter(
            (pluginSetting) =>
              pluginSetting.type === SettingsPage_Type.INSTANCE &&
              pluginSetting.owningPlugin !== undefined,
          )
          .map((pluginSetting) => (
            <SettingsPageButton
              key={pluginSetting.namespace}
              page={pluginSetting}
            />
          ))}
      </div>
    </div>
  );
}
