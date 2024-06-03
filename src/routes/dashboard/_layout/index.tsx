import {createFileRoute, Link} from "@tanstack/react-router";
import {Button} from "@/components/ui/button.tsx";

export const Route = createFileRoute('/dashboard/_layout/')({
  component: Dashboard,
})

export default function Dashboard() {
  return (
      <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button asChild variant="secondary" className="w-full h-full">
          <Link to="/dashboard/settings/$namespace"
                params={{namespace: 'bot'}}>
            Bot Settings
          </Link>
        </Button>
        <Button asChild variant="secondary" className="w-full h-full">
          <Link to="/dashboard/plugins">
            Plugin Settings
          </Link>
        </Button>
        <Button asChild variant="secondary" className="w-full h-full">
          <Link to="/dashboard/accounts">
            Account Settings
          </Link>
        </Button>
        <Button asChild variant="secondary" className="w-full h-full">
          <Link to="/dashboard/proxies">
            Proxy Settings
          </Link>
        </Button>
        <Button asChild variant="secondary" className="w-full h-full">
          <Link to="/dashboard/settings/$namespace"
                params={{namespace: 'dev'}}>
            Dev Settings
          </Link>
        </Button>
      </div>
  );
}
