import { createFileRoute } from '@tanstack/react-router';
import { useContext } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { InstanceSettingsPageComponent } from '@/components/settings-page.tsx';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import InstancePageLayout from '@/components/nav/instance-page-layout.tsx';

export const Route = createFileRoute(
  '/dashboard/_layout/instance/$instance/settings/$namespace',
)({
  component: SettingsNamespace,
});

function SettingsNamespace() {
  const { namespace } = Route.useParams();
  const clientInfo = useContext(ClientInfoContext);
  const settingsEntry = clientInfo.instanceSettings.find(
    (s) => s.namespace === namespace,
  );
  if (!settingsEntry) {
    throw new Error('Settings entry not found');
  }

  const pluginInfo = clientInfo.plugins.find(
    (plugin) => plugin.id === settingsEntry.owningPlugin,
  );
  return (
    <InstancePageLayout
      extraCrumbs={['Settings']}
      pageName={settingsEntry.pageName}
      expandPluginSettings={pluginInfo !== undefined}
    >
      <div className="grow flex h-full w-full flex-row gap-2">
        <div className="grow flex h-full flex-col gap-4 pb-4">
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
            <InstanceSettingsPageComponent data={settingsEntry} />
          </div>
        </div>
      </div>
    </InstancePageLayout>
  );
}
