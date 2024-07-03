import { createFileRoute, Link } from '@tanstack/react-router';
import { useContext } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { Button } from '@/components/ui/button.tsx';

export const Route = createFileRoute('/dashboard/_layout/plugins')({
  component: Plugins,
});

function Plugins() {
  const clientInfo = useContext(ClientInfoContext);

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <Button asChild variant="secondary">
        <Link to="/dashboard">Back</Link>
      </Button>
      <div className="grid h-full w-full auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clientInfo.pluginSettings
          .filter((pluginSetting) => !pluginSetting.hidden)
          .map((pluginSetting) => (
            <Button
              key={pluginSetting.namespace}
              asChild
              variant="secondary"
              className="h-full w-full"
            >
              <Link
                to="/dashboard/settings/$namespace"
                params={{ namespace: pluginSetting.namespace }}
              >
                {pluginSetting.pageName}
              </Link>
            </Button>
          ))}
      </div>
    </div>
  );
}
