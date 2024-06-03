import {createFileRoute, Link, notFound} from '@tanstack/react-router'
import {Button} from "@/components/ui/button.tsx";
import {useContext} from "react";
import {ClientInfoContext} from "@/components/providers/client-info-context.tsx";
import ClientSettingsPageComponent from "@/components/client-settings-page.tsx";

export const Route = createFileRoute('/dashboard/_layout/settings/$namespace')({
  component: SettingsNamespace
})

function SettingsNamespace() {
  const clientInfo = useContext(ClientInfoContext)
  const {namespace} = Route.useParams()
  const settingsEntry = clientInfo.pluginSettings.find(s => s.namespace === namespace)
  if (!settingsEntry) {
    throw notFound()
  }

  return (
      <div className="w-full h-full flex flex-col gap-4">
        <Button asChild variant="secondary">
          <Link to={settingsEntry.hidden ? "/dashboard" : "/dashboard/plugins"}>
            Back
          </Link>
        </Button>
        <ClientSettingsPageComponent data={settingsEntry}/>
      </div>
  )
}
