import { createFileRoute } from '@tanstack/react-router';
import { useContext } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { SettingsPage_Type } from '@/generated/soulfire/config.ts';
import SettingsPageButton from '@/components/settings-page-button.tsx';

export const Route = createFileRoute('/dashboard/_layout/$instance/plugins')({
  component: Plugins,
});

function Plugins() {
  const clientInfo = useContext(ClientInfoContext);

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
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
