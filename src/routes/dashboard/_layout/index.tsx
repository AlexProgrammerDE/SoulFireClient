import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button.tsx';
import ControlsMenu from '@/components/controls-menu.tsx';

export const Route = createFileRoute('/dashboard/_layout/')({
  component: Dashboard,
});

export default function Dashboard() {
  return (
    <div className="grid h-full w-full auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2">
      <Button asChild variant="secondary" className="h-full w-full">
        <Link to="/dashboard/settings/$namespace" params={{ namespace: 'bot' }}>
          Bot Settings
        </Link>
      </Button>
      <Button asChild variant="secondary" className="h-full w-full">
        <Link to="/dashboard/plugins">Plugin Settings</Link>
      </Button>
      <Button asChild variant="secondary" className="h-full w-full">
        <Link to="/dashboard/accounts">Account Settings</Link>
      </Button>
      <Button asChild variant="secondary" className="h-full w-full">
        <Link to="/dashboard/proxies">Proxy Settings</Link>
      </Button>
      <Button asChild variant="secondary" className="h-full w-full">
        <Link to="/dashboard/settings/$namespace" params={{ namespace: 'dev' }}>
          Dev Settings
        </Link>
      </Button>
      <ControlsMenu />
    </div>
  );
}
