import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button.tsx';
import { useContext } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import ClientSettingsPageComponent from '@/components/client-settings-page.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';

export const Route = createFileRoute(
  '/dashboard/_layout/$instance/settings/$namespace',
)({
  component: SettingsNamespace,
});

function SettingsNamespace() {
  const { namespace } = Route.useParams();
  const clientInfo = useContext(ClientInfoContext);
  const instanceInfo = useContext(InstanceInfoContext);
  const settingsEntry = clientInfo.settings.find(
    (s) => s.namespace === namespace,
  );
  if (!settingsEntry) {
    return (
      <div className="flex h-full w-full">
        <div className="m-auto flex flex-col gap-2">
          <p>No settings found for {namespace}</p>
          <Button asChild variant="secondary">
            <Link
              to="/dashboard/$instance/plugins"
              params={{ instance: instanceInfo.id }}
              search={{}}
            >
              Back
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const pluginInfo = clientInfo.plugins.find(
    (plugin) => plugin.id === settingsEntry.owningPlugin,
  );
  return (
    <div className="flex h-full w-full flex-col gap-4">
      <Button asChild variant="secondary">
        {settingsEntry.owningPlugin ? (
          <Link
            to="/dashboard/$instance/plugins"
            params={{ instance: instanceInfo.id }}
            search={{}}
          >
            Back
          </Link>
        ) : (
          <Link
            to="/dashboard/$instance"
            params={{ instance: instanceInfo.id }}
            search={{}}
          >
            Back
          </Link>
        )}
      </Button>
      {pluginInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{settingsEntry.pageName}</CardTitle>
            <CardDescription>{pluginInfo.description}</CardDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary">Version: {pluginInfo.version}</Badge>
              <Badge variant="secondary">Author: {pluginInfo.author}</Badge>
              <Badge variant="secondary">License: {pluginInfo.license}</Badge>
            </div>
          </CardHeader>
        </Card>
      )}
      <ScrollArea className="h-full w-full pr-4">
        <div className="flex flex-col gap-2">
          <ClientSettingsPageComponent data={settingsEntry} />
        </div>
      </ScrollArea>
    </div>
  );
}
