import { createFileRoute } from '@tanstack/react-router';
import InstancePageLayout from '@/components/nav/instance-page-layout.tsx';
import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { PluginInfoCard } from '@/components/plugin-info-card.tsx';

export const Route = createFileRoute('/dashboard/instance/$instance/discover')({
  component: Discover,
});

function Discover() {
  const { t } = useTranslation('common');
  const clientInfo = useContext(ClientInfoContext);

  return (
    <InstancePageLayout
      extraCrumbs={[t('breadcrumbs.plugins')]}
      pageName={t('pageName.discoverPlugins')}
    >
      <div className="grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 h-full w-full gap-4">
        {clientInfo.instanceSettings
          .filter(
            (settings) =>
              settings.owningPlugin !== undefined &&
              settings.enabledKey !== null,
          )
          .map((settings) => (
            <PluginInfoCard
              key={settings.namespace}
              pluginInfo={
                clientInfo.plugins.find(
                  (plugin) => plugin.id === settings.owningPlugin,
                )!
              }
              settingsEntry={settings}
            />
          ))}
      </div>
    </InstancePageLayout>
  );
}
