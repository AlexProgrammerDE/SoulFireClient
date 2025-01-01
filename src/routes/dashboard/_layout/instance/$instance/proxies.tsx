import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useContext, useState } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { Button } from '@/components/ui/button.tsx';
import { InstanceSettingsPageComponent } from '@/components/settings-page.tsx';
import { DataTable } from '@/components/data-table.tsx';
import { ProfileContext } from '@/components/providers/profile-context.tsx';
import { ColumnDef, Table as ReactTable } from '@tanstack/react-table';
import {
  convertToInstanceProto,
  getEnumKeyByValue,
  ProfileProxy,
  ProfileRoot,
} from '@/lib/types.ts';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { ProxyProto_Type } from '@/generated/soulfire/common.ts';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { PlusIcon, TrashIcon } from 'lucide-react';
import ImportDialog from '@/components/dialog/import-dialog.tsx';
import URI from 'urijs';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import InstancePageLayout from '@/components/nav/instance-page-layout.tsx';

export const Route = createFileRoute(
  '/dashboard/_layout/instance/$instance/proxies',
)({
  component: ProxySettings,
});

enum UIProxyType {
  HTTP,
  SOCKS4,
  SOCKS5,
  URI,
}

type SimpleProxyType =
  | UIProxyType.HTTP
  | UIProxyType.SOCKS4
  | UIProxyType.SOCKS5;

function uiProxyTypeToProto(type: SimpleProxyType): ProxyProto_Type {
  switch (type) {
    case UIProxyType.HTTP:
      return ProxyProto_Type.HTTP;
    case UIProxyType.SOCKS4:
      return ProxyProto_Type.SOCKS4;
    case UIProxyType.SOCKS5:
      return ProxyProto_Type.SOCKS5;
  }
}

function parseNormalProxy(line: string, type: SimpleProxyType): ProfileProxy {
  const parts = line.split(':');
  if (parts.length < 2) {
    throw new Error('Invalid proxy format');
  }

  // Fill username and password with undefined if not present
  parts.length = 4;

  const host = parts[0] + ':' + parts[1];
  return {
    type: uiProxyTypeToProto(type),
    address: host.startsWith('/') ? `unix://${host}` : `inet://${host}`,
    username: parts[2],
    password: parts[3],
  };
}

function parseRawTypeToProto(rawType: string): ProxyProto_Type {
  switch (rawType) {
    case 'http':
      return ProxyProto_Type.HTTP;
    case 'socks4':
      return ProxyProto_Type.SOCKS4;
    case 'socks5':
      return ProxyProto_Type.SOCKS5;
    default:
      throw new Error('Invalid proxy type');
  }
}

function parseURIProxy(line: string): ProfileProxy {
  const uri = new URI(line);
  const host = uri.host();
  return {
    type: parseRawTypeToProto(uri.protocol()),
    address: host.startsWith('/') ? `unix://${host}` : `inet://${host}`,
    username: uri.username() === '' ? undefined : uri.username(),
    password: uri.password() === '' ? undefined : uri.password(),
  };
}

const columns: ColumnDef<ProfileProxy>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className="flex">
        <Checkbox
          className="my-auto"
          defaultChecked={
            table.getIsAllRowsSelected() ||
            (table.getIsSomeRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
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
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => getEnumKeyByValue(ProxyProto_Type, row.original.type),
  },
  {
    accessorKey: 'address',
    header: 'Address',
  },
  {
    accessorKey: 'username',
    header: 'Username',
  },
  {
    accessorKey: 'password',
    header: 'Password',
  },
];

function ExtraHeader(props: { table: ReactTable<ProfileProxy> }) {
  const queryClient = useQueryClient();
  const profile = useContext(ProfileContext);
  const transport = useContext(TransportContext);
  const instanceInfo = useContext(InstanceInfoContext);
  const [proxyTypeSelected, setProxyTypeSelected] =
    useState<UIProxyType | null>(null);
  const { mutateAsync: setProfileMutation } = useMutation({
    mutationFn: async (profile: ProfileRoot) => {
      if (transport === null) {
        return;
      }

      const instanceService = new InstanceServiceClient(transport);
      await instanceService.updateInstanceConfig({
        id: instanceInfo.id,
        config: convertToInstanceProto(profile),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['instance-info', instanceInfo.id],
      });
    },
  });

  const textSelectedCallback = useCallback(
    (text: string) => {
      if (proxyTypeSelected === null) return;

      if (text.length === 0) {
        toast.error('No proxies to import');
        return;
      }

      setProxyTypeSelected(null);
      const textSplit = text
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      toast.promise(
        (async () => {
          const proxiesToAdd: ProfileProxy[] = [];
          for (const line of textSplit) {
            let proxy: ProfileProxy;
            switch (proxyTypeSelected) {
              case UIProxyType.HTTP:
              case UIProxyType.SOCKS4:
              case UIProxyType.SOCKS5:
                proxy = parseNormalProxy(line, proxyTypeSelected);
                break;
              case UIProxyType.URI:
                proxy = parseURIProxy(line);
                break;
            }

            proxiesToAdd.push(proxy);
          }

          await setProfileMutation({
            ...profile,
            proxies: [...profile.proxies, ...proxiesToAdd],
          });
          return proxiesToAdd.length;
        })(),
        {
          loading: 'Importing proxies...',
          success: (r) => `${r} proxies imported!`,
          error: (e) => {
            console.error(e);
            return 'Failed to import proxies';
          },
        },
      );
    },
    [profile, proxyTypeSelected, setProfileMutation],
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <PlusIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => setProxyTypeSelected(UIProxyType.HTTP)}
          >
            HTTP
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setProxyTypeSelected(UIProxyType.SOCKS4)}
          >
            SOCKS4
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setProxyTypeSelected(UIProxyType.SOCKS5)}
          >
            SOCKS5
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setProxyTypeSelected(UIProxyType.URI)}
          >
            URI
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="outline"
        disabled={props.table.getFilteredSelectedRowModel().rows.length === 0}
        onClick={() => {
          const beforeSize = profile.proxies.length;
          const selectedRows = props.table
            .getFilteredSelectedRowModel()
            .rows.map((r) => r.original);
          const newProfile = {
            ...profile,
            proxies: profile.proxies.filter(
              (a) => !selectedRows.some((r) => r.address === a.address),
            ),
          };

          toast.promise(setProfileMutation(newProfile), {
            loading: 'Removing proxies...',
            success: `Removed ${beforeSize - newProfile.proxies.length} proxies`,
            error: (e) => {
              console.error(e);
              return 'Failed to remove proxies';
            },
          });
        }}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
      {proxyTypeSelected !== null && (
        <ImportDialog
          title={`Import ${getEnumKeyByValue(UIProxyType, proxyTypeSelected)} proxies`}
          description="Paste your proxies here, one per line"
          closer={() => setProxyTypeSelected(null)}
          listener={textSelectedCallback}
          filters={[
            {
              name: 'Text File',
              mimeType: 'text/plain',
              extensions: ['txt'],
            },
          ]}
          allowMultiple={true}
          textInput={{
            defaultValue: '',
          }}
        />
      )}
    </>
  );
}

function ProxySettings() {
  const clientInfo = useContext(ClientInfoContext);
  const profile = useContext(ProfileContext);

  return (
    <InstancePageLayout extraCrumbs={['Settings']} pageName="Proxy Settings">
      <div className="grow flex h-full w-full flex-col gap-4 pb-4 max-w-4xl">
        <div className="flex flex-col gap-2">
          <InstanceSettingsPageComponent
            data={
              clientInfo.instanceSettings.find((s) => s.namespace === 'proxy')!
            }
          />
        </div>
        <DataTable
          filterDisplayName="proxies"
          filterKey="address"
          columns={columns}
          data={profile.proxies}
          extraHeader={ExtraHeader}
        />
      </div>
    </InstancePageLayout>
  );
}
