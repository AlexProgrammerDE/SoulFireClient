import {createFileRoute, Link} from '@tanstack/react-router'
import {useContext} from "react";
import {ClientInfoContext} from "@/components/providers/client-info-context.tsx";
import {Button} from "@/components/ui/button.tsx";

export const Route = createFileRoute('/dashboard/_layout/proxies')({
  component: ProxySettings,
})

function ProxySettings() {
  const clientInfo = useContext(ClientInfoContext)

  return (
      <div className="w-full h-full flex flex-col gap-4">
        <Button asChild variant="secondary">
          <Link to="/dashboard">
            Back
          </Link>
        </Button>
        <div className="w-full h-full flex flex-col gap-4">
          Proxy Settings
        </div>
      </div>
  )
}
