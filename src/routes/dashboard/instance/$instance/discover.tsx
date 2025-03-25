import { createFileRoute } from '@tanstack/react-router';
import InstancePageLayout from '@/components/nav/instance-page-layout.tsx';
import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { PluginInfoCard } from '@/components/plugin-info-card.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';

export const Route = createFileRoute('/dashboard/instance/$instance/discover')({
  component: Discover,
});

function Discover() {
  const { t } = useTranslation('common');
  const instanceInfo = useContext(InstanceInfoContext);

  return (
    <InstancePageLayout
      extraCrumbs={[t('breadcrumbs.plugins')]}
      pageName={t('pageName.discoverPlugins')}
    >
      <div className="grid h-full w-full grow grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {instanceInfo.instanceSettings
          .filter(
            (settings) =>
              settings.owningPlugin !== undefined &&
              settings.enabledKey !== null,
          )
          .map((settings) => (
            <PluginInfoCard key={settings.namespace} settingsEntry={settings} />
          ))}
      </div>
    </InstancePageLayout>
  );
}
