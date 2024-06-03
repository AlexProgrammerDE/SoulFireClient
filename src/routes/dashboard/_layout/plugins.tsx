import {createFileRoute, Link} from '@tanstack/react-router'
import {useContext} from "react";
import {ClientInfoContext} from "@/components/providers/client-info-context.tsx";
import {Button} from "@/components/ui/button.tsx";

export const Route = createFileRoute('/dashboard/_layout/plugins')({
  component: Plugins,
})

function Plugins() {
  const clientInfo = useContext(ClientInfoContext)

  return (
      <div className="w-full h-full flex flex-col gap-4">
        <Button asChild variant="secondary">
          <Link to="/dashboard">
            Back
          </Link>
        </Button>
        <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {
            clientInfo.pluginSettings.filter(pluginSetting => !pluginSetting.hidden).map((pluginSetting) => (
                <Button key={pluginSetting.namespace} asChild variant="secondary" className="w-full h-full">
                  <Link to="/dashboard/settings/$namespace"
                        params={{namespace: pluginSetting.namespace}}>
                    {pluginSetting.pageName}
                  </Link>
                </Button>
            ))
          }
        </div>
      </div>
  )
}
