import { createFileRoute, Link } from '@tanstack/react-router';
import ControlsMenu from '@/components/controls-menu.tsx';
import { useContext } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import SettingsPageButton from '@/components/settings-page-button.tsx';
import { Button } from '@/components/ui/button.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { BlocksIcon } from 'lucide-react';
import DynamicIcon from '@/components/dynamic-icon.tsx';

export const Route = createFileRoute('/dashboard/_layout/$instance/')({
  component: Dashboard,
});

export default function Dashboard() {
  const clientInfo = useContext(ClientInfoContext);
  const instanceInfo = useContext(InstanceInfoContext);

  const botSettings = clientInfo.settings.find(
    (settings) => settings.namespace === 'bot',
  );
  const accountSettings = clientInfo.settings.find(
    (settings) => settings.namespace === 'account',
  );
  const proxySettings = clientInfo.settings.find(
    (settings) => settings.namespace === 'proxy',
  );
  const devSettings = clientInfo.settings.find(
    (settings) => settings.namespace === 'dev',
  );
  if (!botSettings || !accountSettings || !proxySettings || !devSettings) {
    throw new Error('Namespaces missing');
  }

  return (
    <div className="grid h-full w-full auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2">
      <SettingsPageButton page={botSettings} />
      <Button
        asChild
        variant="secondary"
        className="h-full w-full flex flex-row gap-1"
      >
        <Link
          to="/dashboard/$instance/plugins"
          params={{ instance: instanceInfo.id }}
          search={{}}
        >
          <div>
            <BlocksIcon className="h-4" />
          </div>
          <span>Plugin Settings</span>
        </Link>
      </Button>
      <Button
        asChild
        variant="secondary"
        className="h-full w-full flex flex-row gap-1"
      >
        <Link
          to="/dashboard/$instance/accounts"
          params={{ instance: instanceInfo.id }}
          search={{}}
        >
          <div>
            <DynamicIcon
              name={accountSettings.iconId as never}
              className="h-4"
            />
          </div>
          <span>Account Settings</span>
        </Link>
      </Button>
      <Button
        asChild
        variant="secondary"
        className="h-full w-full flex flex-row gap-1"
      >
        <Link
          to="/dashboard/$instance/proxies"
          params={{ instance: instanceInfo.id }}
          search={{}}
        >
          <div>
            <DynamicIcon name={proxySettings.iconId as never} className="h-4" />
          </div>
          <span>Proxy Settings</span>
        </Link>
      </Button>
      <SettingsPageButton page={devSettings} />
      <ControlsMenu />
    </div>
  );
}
