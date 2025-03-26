import { createFileRoute } from '@tanstack/react-router';
import { useContext } from 'react';
import { InstanceSettingsPageComponent } from '@/components/settings-page.tsx';
import InstancePageLayout from '@/components/nav/instance-page-layout.tsx';
import { PluginInfoCard } from '@/components/plugin-info-card.tsx';
import { useTranslation } from 'react-i18next';
import { NotFoundComponent } from '@/components/not-found-component.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';

export const Route = createFileRoute(
  '/_dashboard/instance/$instance/settings/$namespace',
)({
  component: SettingsNamespace,
});

function SettingsNamespace() {
  const { t } = useTranslation('common');
  const { namespace } = Route.useParams();
  const instanceInfo = useContext(InstanceInfoContext);
  const settingsEntry = instanceInfo.instanceSettings.find(
    (s) => s.namespace === namespace,
  );
  if (!settingsEntry) {
    return <NotFoundComponent />;
  }

  return (
    <InstancePageLayout
      extraCrumbs={[
        settingsEntry.owningPlugin
          ? t('breadcrumbs.plugins')
          : t('breadcrumbs.settings'),
      ]}
      pageName={settingsEntry.pageName}
    >
      <div className="flex h-full w-full grow flex-row gap-2">
        <div className="flex h-full grow flex-col gap-4">
          {settingsEntry.owningPlugin && (
            <PluginInfoCard settingsEntry={settingsEntry} />
          )}
          <div className="flex flex-col gap-2">
            <InstanceSettingsPageComponent data={settingsEntry} />
          </div>
        </div>
      </div>
    </InstancePageLayout>
  );
}
