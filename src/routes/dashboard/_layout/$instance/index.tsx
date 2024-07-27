import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button.tsx';
import ControlsMenu from '@/components/controls-menu.tsx';
import { useContext } from 'react';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';

export const Route = createFileRoute('/dashboard/_layout/$instance/')({
  component: Dashboard,
});

export default function Dashboard() {
  const instanceInfo = useContext(InstanceInfoContext);

  return (
    <div className="grid h-full w-full auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2">
      <Button asChild variant="secondary" className="h-full w-full">
        <Link
          to="/dashboard/$instance/settings/$namespace"
          params={{ instance: instanceInfo.id, namespace: 'bot' }}
        >
          Bot Settings
        </Link>
      </Button>
      <Button asChild variant="secondary" className="h-full w-full">
        <Link
          to="/dashboard/$instance/plugins"
          params={{ instance: instanceInfo.id }}
        >
          Plugin Settings
        </Link>
      </Button>
      <Button asChild variant="secondary" className="h-full w-full">
        <Link
          to="/dashboard/$instance/accounts"
          params={{ instance: instanceInfo.id }}
        >
          Account Settings
        </Link>
      </Button>
      <Button asChild variant="secondary" className="h-full w-full">
        <Link
          to="/dashboard/$instance/proxies"
          params={{ instance: instanceInfo.id }}
        >
          Proxy Settings
        </Link>
      </Button>
      <Button asChild variant="secondary" className="h-full w-full">
        <Link
          to="/dashboard/$instance/settings/$namespace"
          params={{ instance: instanceInfo.id, namespace: 'dev' }}
        >
          Dev Settings
        </Link>
      </Button>
      <ControlsMenu />
    </div>
  );
}
