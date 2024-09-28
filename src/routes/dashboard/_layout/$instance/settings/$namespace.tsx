import { createFileRoute } from '@tanstack/react-router';
import { useContext } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import ClientSettingsPageComponent from '@/components/settings-page.tsx';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { SettingsPage_Type } from '@/generated/soulfire/config.ts';
import SettingsPageButton from '@/components/settings-page-button.tsx';
import { Separator } from '@/components/ui/separator.tsx';

export const Route = createFileRoute(
  '/dashboard/_layout/$instance/settings/$namespace',
)({
  component: SettingsNamespace,
});

function SettingsNamespace() {
  const { namespace } = Route.useParams();
  const clientInfo = useContext(ClientInfoContext);
  const settingsEntry = clientInfo.settings.find(
    (s) => s.namespace === namespace,
  );
  if (!settingsEntry) {
    return (
      <div className="flex h-full w-full p-2">
        <div className="m-auto flex flex-col">
          <p>No settings found for {namespace}</p>
        </div>
      </div>
    );
  }

  const pluginInfo = clientInfo.plugins.find(
    (plugin) => plugin.id === settingsEntry.owningPlugin,
  );
  return (
    <div className="flex h-full w-full flex-row pl-2 gap-2">
      {pluginInfo && (
        <>
          <div className="shrink flex h-full flex-col gap-1 py-2">
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
          <div>
            <Separator orientation="vertical" />
          </div>
        </>
      )}
      <div className="grow flex h-full flex-col gap-4 py-2">
        {pluginInfo && (
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-xl">
                {settingsEntry.pageName}
              </CardTitle>
              <CardDescription>{pluginInfo.description}</CardDescription>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">Version: {pluginInfo.version}</Badge>
                <Badge variant="secondary">Author: {pluginInfo.author}</Badge>
                <Badge variant="secondary">License: {pluginInfo.license}</Badge>
              </div>
            </CardHeader>
          </Card>
        )}
        <div className="flex flex-col gap-2">
          <ClientSettingsPageComponent data={settingsEntry} />
        </div>
      </div>
    </div>
  );
}
