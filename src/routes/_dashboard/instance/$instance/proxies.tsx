import { createFileRoute, deepEqual } from '@tanstack/react-router';
import { use, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { InstanceSettingsPageComponent } from '@/components/settings-page.tsx';
import { DataTable } from '@/components/data-table.tsx';
import { ColumnDef, Table as ReactTable } from '@tanstack/react-table';
import { getEnumKeyByValue, ProfileProxy, ProfileRoot } from '@/lib/types.ts';
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
import { TransportContext } from '@/components/providers/transport-context.tsx';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import InstancePageLayout from '@/components/nav/instance/instance-page-layout.tsx';
import { ProxyCheckServiceClient } from '@/generated/soulfire/proxy-check.client.ts';
import { Trans, useTranslation } from 'react-i18next';
import {
  SelectAllHeader,
  SelectRowHeader,
} from '@/components/data-table-selects.tsx';
import i18n from '@/lib/i18n.ts';
import { runAsync, setInstanceConfig } from '@/lib/utils.tsx';
import { useAptabase } from '@aptabase/react';

export const Route = createFileRoute('/_dashboard/instance/$instance/proxies')({
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
    accessorFn: (row) => getEnumKeyByValue(ProxyProto_Type, row.type),
    accessorKey: 'type',
    header: () => <Trans i18nKey="instance:proxy.table.type" />,
    sortingFn: 'fuzzySort',
  },
  {
    accessorKey: 'address',
    header: () => <Trans i18nKey="instance:proxy.table.address" />,
    sortingFn: 'fuzzySort',
  },
  {
    accessorKey: 'username',
    header: () => <Trans i18nKey="instance:proxy.table.username" />,
    sortingFn: 'fuzzySort',
  },
  {
    accessorKey: 'password',
    header: () => <Trans i18nKey="instance:proxy.table.password" />,
    sortingFn: 'fuzzySort',
  },
];

function ExtraHeader(props: { table: ReactTable<ProfileProxy> }) {
  const { t } = useTranslation('instance');
  const queryClient = useQueryClient();
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const { data: profile } = useSuspenseQuery({
    ...instanceInfoQueryOptions,
    select: (info) => info.profile,
  });
  const transport = use(TransportContext);
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const [proxyTypeSelected, setProxyTypeSelected] =
    useState<UIProxyType | null>(null);
  const { trackEvent } = useAptabase();
  const { mutateAsync: setProfileMutation } = useMutation({
    mutationFn: async (
      profileTransformer: (prev: ProfileRoot) => ProfileRoot,
    ) => {
      await setInstanceConfig(
        profileTransformer(profile),
        instanceInfo,
        transport,
        queryClient,
        instanceInfoQueryOptions.queryKey,
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
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

          await setProfileMutation((prev) => ({
            ...prev,
            proxies: [...prev.proxies, ...proxiesToAdd],
          }));
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
            <PlusIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{t('proxy.import.proxyType')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              void trackEvent('import_proxies_http');
              setProxyTypeSelected(UIProxyType.HTTP);
            }}
          >
            {t('proxy.import.http')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void trackEvent('import_proxies_socks4');
              setProxyTypeSelected(UIProxyType.SOCKS4);
            }}
          >
            {t('proxy.import.socks4')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void trackEvent('import_proxies_socks5');
              setProxyTypeSelected(UIProxyType.SOCKS5);
            }}
          >
            {t('proxy.import.socks5')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void trackEvent('import_proxies_uri');
              setProxyTypeSelected(UIProxyType.URI);
            }}
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

          void trackEvent('check_proxies', {
            count: props.table.getFilteredSelectedRowModel().rows.length,
          });

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
          const { responses } = service.check(
            {
              instanceId: instanceInfo.id,
              proxy: selectedRows,
            },
            {
              abort: abortController.signal,
            },
          );
          responses.onMessage((r) => {
            runAsync(async () => {
              const data = r.data;
              switch (data.oneofKind) {
                case 'end': {
                  toast.success(
                    t('proxy.checkToast.success', {
                      count: failed,
                    }),
                    {
                      id: toastId,
                      cancel: undefined,
                    },
                  );
                  break;
                }
                case 'single': {
                  if (abortController.signal.aborted) {
                    return;
                  }

                  if (data.single.valid) {
                    success++;
                  } else {
                    failed++;
                    await setProfileMutation((prev) => ({
                      ...prev,
                      proxies: prev.proxies.filter(
                        (a) => !deepEqual(data.single.proxy, a),
                      ),
                    }));
                  }

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
                cancel: undefined,
              });
            });
          });
        }}
      >
        <Wand2Icon />
      </Button>
      <Button
        variant="outline"
        disabled={props.table.getFilteredSelectedRowModel().rows.length === 0}
        onClick={() => {
          void trackEvent('remove_proxies', {
            count: props.table.getFilteredSelectedRowModel().rows.length,
          });
          const selectedRows = props.table
            .getFilteredSelectedRowModel()
            .rows.map((r) => r.original);

          toast.promise(
            setProfileMutation((prev) => ({
              ...prev,
              proxies: prev.proxies.filter(
                (a) => !selectedRows.some((r) => r.address === a.address),
              ),
            })),
            {
              loading: t('proxy.removeToast.loading'),
              success: t('proxy.removeToast.success', {
                count: selectedRows.length,
              }),
              error: (e) => {
                console.error(e);
                return t('proxy.removeToast.error');
              },
            },
          );
        }}
      >
        <TrashIcon />
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

  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: 'settings',
          content: t('breadcrumbs.settings'),
        },
      ]}
      pageName={t('pageName.proxySettings')}
      documentationLink="https://soulfiremc.com/docs/usage/proxies"
    >
      <Content />
    </InstancePageLayout>
  );
}

function Content() {
  const { t } = useTranslation('common');
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const { data: profile } = useSuspenseQuery({
    ...instanceInfoQueryOptions,
    select: (info) => info.profile,
  });

  return (
    <div className="container flex h-full w-full grow flex-col gap-4">
      <div className="flex flex-col gap-2">
        <InstanceSettingsPageComponent
          data={
            instanceInfo.instanceSettings.find((s) => s.namespace === 'proxy')!
          }
        />
      </div>
      <DataTable
        filterPlaceholder={t('instance:proxy.filterPlaceholder')}
        columns={columns}
        data={profile.proxies}
        extraHeader={ExtraHeader}
      />
    </div>
  );
}
