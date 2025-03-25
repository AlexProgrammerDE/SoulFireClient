import { createFileRoute } from '@tanstack/react-router';
import { useContext } from 'react';
import { AdminSettingsPageComponent } from '@/components/settings-page.tsx';
import UserPageLayout from '@/components/nav/user-page-layout';
import { PluginInfoCard } from '@/components/plugin-info-card.tsx';
import { useTranslation } from 'react-i18next';
import { NotFoundComponent } from '@/components/not-found-component.tsx';
import { ServerInfoContext } from '@/components/providers/server-info-context.tsx';

export const Route = createFileRoute(
  '/dashboard/user/admin/settings/$namespace',
)({
  component: SettingsNamespace,
});

function SettingsNamespace() {
  const { t } = useTranslation('common');
  const { namespace } = Route.useParams();
  const serverInfo = useContext(ServerInfoContext);
  const settingsEntry = serverInfo.serverSettings.find(
    (s) => s.namespace === namespace,
  );
  if (!settingsEntry) {
    return <NotFoundComponent />;
  }

  return (
    <UserPageLayout
      showUserCrumb={false}
      extraCrumbs={[t('breadcrumbs.admin'), t('breadcrumbs.settings')]}
      pageName={settingsEntry.pageName}
    >
      <div className="flex h-full w-full grow flex-row gap-2 pl-2">
        <div className="flex h-full grow flex-col gap-4">
          {settingsEntry.owningPlugin && (
            <PluginInfoCard settingsEntry={settingsEntry} />
          )}
          <div className="flex flex-col gap-2">
            <AdminSettingsPageComponent data={settingsEntry} />
          </div>
        </div>
      </div>
    </UserPageLayout>
  );
}
