import { createFileRoute } from '@tanstack/react-router';
import { useContext } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { InstanceSettingsPageComponent } from '@/components/settings-page.tsx';
import InstancePageLayout from '@/components/nav/instance-page-layout.tsx';
import { PluginInfoCard } from '@/components/plugin-info-card.tsx';
import { useTranslation } from 'react-i18next';
import { NotFoundComponent } from '@/components/not-found-component.tsx';

export const Route = createFileRoute(
  '/dashboard/instance/$instance/settings/$namespace',
)({
  component: SettingsNamespace,
});

function SettingsNamespace() {
  const { t } = useTranslation('common');
  const { namespace } = Route.useParams();
  const clientInfo = useContext(ClientInfoContext);
  const settingsEntry = clientInfo.instanceSettings.find(
    (s) => s.namespace === namespace,
  );
  if (!settingsEntry) {
    return <NotFoundComponent />;
  }

  const pluginInfo = clientInfo.plugins.find(
    (plugin) => plugin.id === settingsEntry.owningPlugin,
  );
  return (
    <InstancePageLayout
      extraCrumbs={[
        pluginInfo ? t('breadcrumbs.plugins') : t('breadcrumbs.settings'),
      ]}
      pageName={settingsEntry.pageName}
    >
      <div className="grow flex h-full w-full flex-row gap-2">
        <div className="grow flex h-full flex-col gap-4">
          {pluginInfo && (
            <PluginInfoCard
              pluginInfo={pluginInfo}
              settingsEntry={settingsEntry}
            />
          )}
          <div className="flex flex-col gap-2">
            <InstanceSettingsPageComponent data={settingsEntry} />
          </div>
        </div>
      </div>
    </InstancePageLayout>
  );
}
