import {createFileRoute, Link} from '@tanstack/react-router'
import {useContext} from "react";
import {ClientInfoContext} from "@/components/providers/client-info-context.tsx";
import {Button} from "@/components/ui/button.tsx";
import ClientSettingsPageComponent from "@/components/client-settings-page.tsx";
import {DataTable} from "@/components/data-table.tsx";
import {ProfileContext} from "@/components/providers/profile-context.tsx";
import {ColumnDef} from "@tanstack/react-table";
import {ProfileProxy} from "@/lib/types.ts";

export const Route = createFileRoute('/dashboard/_layout/proxies')({
  component: ProxySettings,
})

const columns: ColumnDef<ProfileProxy>[] = [
  {
    accessorKey: "enabled",
    header: "Enabled",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "password",
    header: "Password",
  },
]

function ProxySettings() {
  const clientInfo = useContext(ClientInfoContext)
  const profile = useContext(ProfileContext)

  return (
      <div className="w-full h-full flex flex-col gap-4">
        <Button asChild variant="secondary">
          <Link to="/dashboard">
            Back
          </Link>
        </Button>
        <div className="flex flex-col gap-2">
          <ClientSettingsPageComponent data={clientInfo.pluginSettings.find(s => s.namespace === "proxy")!}/>
        </div>
        <DataTable
            filterDisplayName="proxies"
            filterKey="address"
            columns={columns}
            data={profile.profile.proxies}/>
      </div>
  )
}
