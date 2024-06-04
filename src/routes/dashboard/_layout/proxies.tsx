import {createFileRoute, Link} from '@tanstack/react-router'
import {useCallback, useContext, useState} from "react";
import {ClientInfoContext} from "@/components/providers/client-info-context.tsx";
import {Button} from "@/components/ui/button.tsx";
import ClientSettingsPageComponent from "@/components/client-settings-page.tsx";
import {DataTable} from "@/components/data-table.tsx";
import {ProfileContext} from "@/components/providers/profile-context.tsx";
import {ColumnDef, Table as ReactTable} from "@tanstack/react-table";
import {getEnumKeyByValue, ProfileProxy} from "@/lib/types.ts";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {ProxyProto_Type} from "@/generated/com/soulfiremc/grpc/generated/common.ts";
import {toast} from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";
import {PlusIcon, TrashIcon} from "lucide-react";
import ImportDialog from "@/components/import-dialog.tsx";
import URI from "urijs";

export const Route = createFileRoute('/dashboard/_layout/proxies')({
  component: ProxySettings,
})

enum UIProxyType {
  HTTP,
  SOCKS4,
  SOCKS5,
  URI
}

function uiProxyTypeToProto(type: UIProxyType.HTTP | UIProxyType.SOCKS4 | UIProxyType.SOCKS5): ProxyProto_Type {
  switch (type) {
    case UIProxyType.HTTP:
      return ProxyProto_Type.HTTP
    case UIProxyType.SOCKS4:
      return ProxyProto_Type.SOCKS4
    case UIProxyType.SOCKS5:
      return ProxyProto_Type.SOCKS5
  }
}

function parseNormalProxy(line: string): ProfileProxy {
  const parts = line.split(":")
  if (parts.length < 2) {
    throw new Error("Invalid proxy format")
  }

  // Fill username and password with undefined if not present
  parts.length = 4

  const host = parts[0] + ":" + parts[1]
  return {
    type: uiProxyTypeToProto(UIProxyType.HTTP),
    address: host.startsWith("/") ? `unix://${host}` : `inet://${host}`,
    username: parts[2],
    password: parts[3]
  }
}

function parseRawTypeToProto(rawType: string): ProxyProto_Type {
  switch (rawType) {
    case "http":
      return ProxyProto_Type.HTTP
    case "socks4":
      return ProxyProto_Type.SOCKS4
    case "socks5":
      return ProxyProto_Type.SOCKS5
    default:
      throw new Error("Invalid proxy type")
  }
}

function parseURIProxy(line: string): ProfileProxy {
  const uri = new URI(line)
  const host = uri.host()
  return {
    type: parseRawTypeToProto(uri.protocol()),
    address: host.startsWith("/") ? `unix://${host}` : `inet://${host}`,
    username: uri.username() === "" ? undefined : uri.username(),
    password: uri.password() === "" ? undefined : uri.password()
  }
}

const columns: ColumnDef<ProfileProxy>[] = [
  {
    id: "select",
    header: ({table}) => (
        <div className="flex">
          <Checkbox
              className="my-auto"
              defaultChecked={
                  table.getIsAllPageRowsSelected() ||
                  (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
          />
        </div>
    ),
    cell: ({row}) => (
        <div className="flex">
          <Checkbox
              className="my-auto"
              defaultChecked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
          />
        </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({row}) => getEnumKeyByValue(ProxyProto_Type, row.original.type),
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

function ExtraHeader(props: { table: ReactTable<ProfileProxy> }) {
  const profile = useContext(ProfileContext)
  const [proxyTypeSelected, setProxyTypeSelected] = useState<UIProxyType | null>(null)

  const textSelectedCallback = useCallback((text: string) => {
    if (proxyTypeSelected === null) return

    if (text.length === 0) {
      toast.error('No proxies to import')
      return
    }

    setProxyTypeSelected(null)
    const textSplit = text.split("\n").map(t => t.trim()).filter(t => t.length > 0)
    toast.promise(new Promise<number>((resolve, reject) => {
      (async () => {
        try {
          const proxiesToAdd: ProfileProxy[] = []
          for (const line of textSplit) {
            let proxy: ProfileProxy;
            switch (proxyTypeSelected) {
              case UIProxyType.HTTP:
              case UIProxyType.SOCKS4:
              case UIProxyType.SOCKS5:
                proxy = parseNormalProxy(line)
                break
              case UIProxyType.URI:
                proxy = parseURIProxy(line)
                break
            }

            proxiesToAdd.push(proxy)
          }

          profile.setProfile({
            ...profile.profile,
            proxies: [...profile.profile.proxies, ...proxiesToAdd]
          })
          resolve(proxiesToAdd.length)
        } catch (e) {
          reject(e)
        }
      })()
    }), {
      loading: 'Importing proxies...',
      success: r => `${r} proxies imported!`,
      error: (e) => {
        console.error(e)
        return 'Failed to import proxies'
      }
    })
  }, [profile, proxyTypeSelected])

  return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <PlusIcon className="w-4 h-4"/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setProxyTypeSelected(UIProxyType.HTTP)}>HTTP</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setProxyTypeSelected(UIProxyType.SOCKS4)}>SOCKS4</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setProxyTypeSelected(UIProxyType.SOCKS5)}>SOCKS5</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setProxyTypeSelected(UIProxyType.URI)}>URI</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" disabled={props.table.getFilteredSelectedRowModel().rows.length === 0}
                onClick={() => {
                  const beforeSize = profile.profile.proxies.length
                  const selectedRows = props.table.getFilteredSelectedRowModel().rows.map(r => r.original)
                  const newProfile = {
                    ...profile.profile,
                    proxies: profile.profile.proxies.filter(a => !selectedRows.some(r => r.address === a.address))
                  }

                  profile.setProfile(newProfile)
                  toast.info(`Removed ${beforeSize - newProfile.proxies.length} proxies`)
                }}>
          <TrashIcon className="w-4 h-4"/>
        </Button>
        {
            proxyTypeSelected !== null && (
                <ImportDialog
                    title={`Import ${getEnumKeyByValue(ProxyProto_Type, proxyTypeSelected)} proxies`}
                    description="Paste your proxies here, one per line"
                    closer={() => setProxyTypeSelected(null)} listener={textSelectedCallback}/>
            )
        }
      </>
  )
}

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
            data={profile.profile.proxies}
            extraHeader={ExtraHeader}
        />
      </div>
  )
}
