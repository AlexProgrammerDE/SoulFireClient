import { createFileRoute, deepEqual } from '@tanstack/react-router';
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
import { ProxyProto_Type } from '@/generated/soulfire/common.ts';
import { ExternalToast, toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { PlusIcon, TrashIcon, Wand2Icon } from 'lucide-react';
import ImportDialog from '@/components/dialog/import-dialog.tsx';
import URI from 'urijs';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import InstancePageLayout from '@/components/nav/instance-page-layout.tsx';
import { ProxyCheckServiceClient } from '@/generated/soulfire/proxy-check.client.ts';
import { Trans, useTranslation } from 'react-i18next';
import {
  SelectAllHeader,
  SelectRowHeader,
} from '@/components/data-table-selects.tsx';
import i18n from '@/lib/i18n.ts';

export const Route = createFileRoute('/dashboard/instance/$instance/proxies')({
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
    throw new Error(i18n.t('instance:proxy.invalidFormat'));
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

function parseRawTypeToProto(rawType: string): ProxyProto_Type | null {
  switch (rawType) {
    case 'http':
      return ProxyProto_Type.HTTP;
    case 'socks4':
      return ProxyProto_Type.SOCKS4;
    case 'socks5':
      return ProxyProto_Type.SOCKS5;
    default:
      return null;
  }
}

function parseURIProxy(line: string): ProfileProxy | null {
  const uri = new URI(line);
  const host = uri.host();
  const type = parseRawTypeToProto(uri.protocol());
  if (type === null) {
    return null;
  }

  return {
    type,
    address: host.startsWith('/') ? `unix://${host}` : `inet://${host}`,
    username: uri.username() === '' ? undefined : uri.username(),
    password: uri.password() === '' ? undefined : uri.password(),
  };
}

const columns: ColumnDef<ProfileProxy>[] = [
  {
    id: 'select',
    header: SelectAllHeader,
    cell: SelectRowHeader,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'type',
    header: () => <Trans i18nKey="instance:proxy.table.type" />,
    cell: ({ row }) => getEnumKeyByValue(ProxyProto_Type, row.original.type),
  },
  {
    accessorKey: 'address',
    header: () => <Trans i18nKey="instance:proxy.table.address" />,
  },
  {
    accessorKey: 'username',
    header: () => <Trans i18nKey="instance:proxy.table.username" />,
  },
  {
    accessorKey: 'password',
    header: () => <Trans i18nKey="instance:proxy.table.password" />,
  },
];

function ExtraHeader(props: { table: ReactTable<ProfileProxy> }) {
  const { t } = useTranslation('instance');
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
        toast.error(t('proxy.listImportToast.noProxies'));
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
            let proxy: ProfileProxy | null;
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

            if (proxy === null) {
              continue;
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
          loading: t('proxy.listImportToast.loading'),
          success: (r) => t('proxy.listImportToast.success', { count: r }),
          error: (e) => {
            console.error(e);
            return t('proxy.listImportToast.error');
          },
        },
      );
    },
    [profile, proxyTypeSelected, setProfileMutation, t],
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
          <DropdownMenuLabel>{t('proxy.import.proxyType')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setProxyTypeSelected(UIProxyType.HTTP)}
          >
            {t('proxy.import.http')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setProxyTypeSelected(UIProxyType.SOCKS4)}
          >
            {t('proxy.import.socks4')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setProxyTypeSelected(UIProxyType.SOCKS5)}
          >
            {t('proxy.import.socks5')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setProxyTypeSelected(UIProxyType.URI)}
          >
            {t('proxy.import.uri')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="outline"
        disabled={props.table.getFilteredSelectedRowModel().rows.length === 0}
        onClick={() => {
          if (transport === null) {
            return;
          }

          const beforeSize = profile.proxies.length;
          const selectedRows = props.table
            .getFilteredSelectedRowModel()
            .rows.map((r) => r.original);

          const abortController = new AbortController();
          const loadingData: ExternalToast = {
            cancel: {
              label: t('common:cancel'),
              onClick: () => {
                abortController.abort();
              },
            },
          };
          const total = selectedRows.length;
          let failed = 0;
          let success = 0;
          const loadingReport = () =>
            t('proxy.checkToast.loading', {
              checked: success + failed,
              total,
              success,
              failed,
            });
          const toastId = toast.loading(loadingReport(), loadingData);
          const service = new ProxyCheckServiceClient(transport);
          const responses = service.check(
            {
              instanceId: instanceInfo.id,
              proxy: selectedRows,
            },
            {
              abort: abortController.signal,
            },
          ).responses;
          responses.onMessage(async (r) => {
            const data = r.data;
            switch (data.oneofKind) {
              case 'fullList': {
                const newProfile = {
                  ...profile,
                  proxies: profile.proxies.filter((a) => {
                    const valid = data.fullList.response.find((r) =>
                      deepEqual(r.proxy, a),
                    );

                    // This one was not supposed to be checked
                    if (valid === undefined) {
                      return true;
                    }

                    return valid.valid;
                  }),
                };

                await setProfileMutation(newProfile);

                toast.success(
                  t('proxy.checkToast.success', {
                    count: beforeSize - newProfile.proxies.length,
                  }),
                  {
                    id: toastId,
                  },
                );
                break;
              }
              case 'oneSuccess': {
                if (abortController.signal.aborted) {
                  return;
                }

                success++;
                toast.loading(loadingReport(), {
                  id: toastId,
                  ...loadingData,
                });
                break;
              }
              case 'oneFailure': {
                if (abortController.signal.aborted) {
                  return;
                }

                failed++;
                toast.loading(loadingReport(), {
                  id: toastId,
                  ...loadingData,
                });
                break;
              }
            }
          });
          responses.onError((e) => {
            console.error(e);
            toast.error(t('proxy.checkToast.error'), {
              id: toastId,
            });
          });
        }}
      >
        <Wand2Icon className="h-4 w-4" />
      </Button>
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
            loading: t('proxy.removeToast.loading'),
            success: t('proxy.removeToast.success', {
              count: beforeSize - newProfile.proxies.length,
            }),
            error: (e) => {
              console.error(e);
              return t('proxy.removeToast.error');
            },
          });
        }}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
      {proxyTypeSelected !== null && (
        <ImportDialog
          title={t('proxy.import.dialog.title', {
            type: getEnumKeyByValue(UIProxyType, proxyTypeSelected),
          })}
          description={t('proxy.import.dialog.description')}
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
  const { t } = useTranslation('common');
  const clientInfo = useContext(ClientInfoContext);
  const profile = useContext(ProfileContext);

  return (
    <InstancePageLayout
      extraCrumbs={[t('breadcrumbs.settings')]}
      pageName={t('pageName.proxySettings')}
      documentationLink="https://soulfiremc.com/docs/usage/proxies"
    >
      <div className="grow flex h-full w-full flex-col gap-4 max-w-4xl">
        <div className="flex flex-col gap-2">
          <InstanceSettingsPageComponent
            data={
              clientInfo.instanceSettings.find((s) => s.namespace === 'proxy')!
            }
          />
        </div>
        <DataTable
          filterPlaceholder={t('instance:proxy.filterPlaceholder')}
          filterKey="address"
          columns={columns}
          data={profile.proxies}
          extraHeader={ExtraHeader}
        />
      </div>
    </InstancePageLayout>
  );
}
