import {createFileRoute, Link} from '@tanstack/react-router'
import {useContext} from "react";
import {ClientInfoContext} from "@/components/providers/client-info-context.tsx";
import {Button} from "@/components/ui/button.tsx";
import ClientSettingsPageComponent from "@/components/client-settings-page.tsx";
import {DataTable} from "@/components/data-table.tsx";
import {ColumnDef} from "@tanstack/react-table";
import {ProfileAccount} from "@/lib/types.ts";
import {ProfileContext} from "@/components/providers/profile-context.tsx";

export const Route = createFileRoute('/dashboard/_layout/accounts')({
  component: AccountSettings,
})

const columns: ColumnDef<ProfileAccount>[] = [
  {
    accessorKey: "enabled",
    header: "Enabled",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "profileId",
    header: "Profile ID",
  },
  {
    accessorKey: "lastKnownName",
    header: "Last Known Name",
  },
]

function AccountSettings() {
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
          <ClientSettingsPageComponent data={clientInfo.pluginSettings.find(s => s.namespace === "account")!}/>
        </div>
        <DataTable
            filterDisplayName="accounts"
            filterKey="lastKnownName"
            columns={columns}
            data={profile.profile.accounts}/>
      </div>
  )
}
