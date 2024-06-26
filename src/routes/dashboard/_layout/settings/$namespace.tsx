import {createFileRoute, Link} from '@tanstack/react-router'
import {Button} from "@/components/ui/button.tsx";
import {useContext} from "react";
import {ClientInfoContext} from "@/components/providers/client-info-context.tsx";
import ClientSettingsPageComponent from "@/components/client-settings-page.tsx";

export const Route = createFileRoute('/dashboard/_layout/settings/$namespace')({
  component: SettingsNamespace,
})

function SettingsNamespace() {
  const {namespace} = Route.useParams()
  const clientInfo = useContext(ClientInfoContext)
  const settingsEntry = clientInfo.pluginSettings.find(s => s.namespace === namespace)
  if (!settingsEntry) {
    return <div className="w-full h-full flex">
      <div className="m-auto flex flex-col gap-2">
        <p>
          No settings found for {namespace}
        </p>
        <Button asChild variant="secondary">
          <Link to="/dashboard/plugins">
            Back
          </Link>
        </Button>
      </div>
    </div>
  }

  return (
      <div className="w-full h-full flex flex-col gap-4">
        <Button asChild variant="secondary">
          <Link to={settingsEntry.hidden ? "/dashboard" : "/dashboard/plugins"}>
            Back
          </Link>
        </Button>
        <div className="flex flex-col gap-2">
          <ClientSettingsPageComponent data={settingsEntry}/>
        </div>
      </div>
  )
}
