import { createFileRoute } from '@tanstack/react-router';
import { useContext } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { AdminSettingsPageComponent } from '@/components/settings-page.tsx';
import UserPageLayout from '@/components/nav/user-page-layout';
import { PluginInfoCard } from '@/components/plugin-info-card.tsx';

export const Route = createFileRoute(
  '/dashboard/_layout/admin/_layout/settings/$namespace',
)({
  component: SettingsNamespace,
});

function SettingsNamespace() {
  const { namespace } = Route.useParams();
  const clientInfo = useContext(ClientInfoContext);
  const settingsEntry = clientInfo.serverSettings.find(
    (s) => s.namespace === namespace,
  );
  if (!settingsEntry) {
    throw new Error('Settings entry not found');
  }

  const pluginInfo = clientInfo.plugins.find(
    (plugin) => plugin.id === settingsEntry.owningPlugin,
  );
  return (
    <UserPageLayout
      showUserCrumb={false}
      extraCrumbs={['Admin', 'Settings']}
      pageName={settingsEntry.pageName}
    >
      <div className="grow flex h-full w-full flex-row pl-2 gap-2">
        <div className="grow flex h-full flex-col gap-4 py-2">
          {pluginInfo && (
            <PluginInfoCard
              pluginInfo={pluginInfo}
              settingsEntry={settingsEntry}
            />
          )}
          <div className="flex flex-col gap-2">
            <AdminSettingsPageComponent data={settingsEntry} />
          </div>
        </div>
      </div>
    </UserPageLayout>
  );
}
