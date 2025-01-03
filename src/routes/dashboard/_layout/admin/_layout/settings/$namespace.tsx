import { createFileRoute } from '@tanstack/react-router';
import { useContext } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { AdminSettingsPageComponent } from '@/components/settings-page.tsx';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import UserPageLayout from '@/components/nav/user-page-layout';

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
            <div className="flex flex-col gap-2">
              <Card className="max-w-4xl">
                <CardHeader className="p-4">
                  <CardTitle className="text-xl">
                    {settingsEntry.pageName}
                  </CardTitle>
                  <CardDescription>{pluginInfo.description}</CardDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">
                      Version: {pluginInfo.version}
                    </Badge>
                    <Badge variant="secondary">
                      Author: {pluginInfo.author}
                    </Badge>
                    <Badge variant="secondary">
                      License: {pluginInfo.license}
                    </Badge>
                    <a
                      href={pluginInfo.website}
                      className="inline-flex items-center"
                      target="_blank"
                    >
                      <Badge variant="secondary">Website</Badge>
                    </a>
                  </div>
                </CardHeader>
              </Card>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <AdminSettingsPageComponent data={settingsEntry} />
          </div>
        </div>
      </div>
    </UserPageLayout>
  );
}
