import { createFileRoute, deepEqual } from '@tanstack/react-router';
import * as React from 'react';
import { use, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { InstanceSettingsPageComponent } from '@/components/settings-page.tsx';
import { ColumnDef, Table as ReactTable } from '@tanstack/react-table';
import {
  getEnumEntries,
  getEnumKeyByValue,
  mapUnionToValue,
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
import {
  Dice4Icon,
  Dice5Icon,
  GlobeIcon,
  PlusIcon,
  TextIcon,
  TrashIcon,
  Wand2Icon,
} from 'lucide-react';
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
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n.ts';
import { runAsync, setInstanceConfig } from '@/lib/utils.tsx';
import { useAptabase } from '@aptabase/react';
import {
  SelectAllHeader,
  SelectRowHeader,
} from '@/components/data-table/data-table-selects.tsx';
import { DataTable } from '@/components/data-table/data-table.tsx';
import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from '@/components/data-table/data-table-action-bar.tsx';
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar.tsx';
import { DataTableFilterMenu } from '@/components/data-table/data-table-filter-menu.tsx';
import { DataTableSortList } from '@/components/data-table/data-table-sort-list.tsx';
import { useDataTable } from '@/hooks/use-data-table.ts';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header.tsx';

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

function getProxyKey(proxy: ProfileProxy): string {
  return `${proxy.type}-${proxy.address}-${proxy.username ?? ''}-${
    proxy.password ?? ''
  }`;
}

const columns: ColumnDef<ProfileProxy>[] = [
  {
    id: 'select',
    header: SelectAllHeader,
    cell: SelectRowHeader,
    size: 32,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'type',
    accessorFn: (row) => getEnumKeyByValue(ProxyProto_Type, row.type),
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    meta: {
      label: 'Type',
      variant: 'multiSelect',
      options: getEnumEntries(ProxyProto_Type).map((type) => {
        return {
          label: type.key,
          value: type.key,
          icon: mapUnionToValue(type.key, (key) => {
            switch (key) {
              case 'HTTP':
                return GlobeIcon;
              case 'SOCKS4':
                return Dice4Icon;
              case 'SOCKS5':
                return Dice5Icon;
            }
          }),
        };
      }),
    },
    enableColumnFilter: true,
  },
  {
    id: 'address',
    accessorKey: 'address',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Address" />
    ),
    meta: {
      label: 'Address',
      placeholder: 'Search addresses...',
      variant: 'text',
      icon: TextIcon,
    },
    enableColumnFilter: true,
  },
  {
    id: 'username',
    accessorKey: 'username',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Username" />
    ),
    meta: {
      label: 'Username',
      placeholder: 'Search usernames...',
      variant: 'text',
      icon: TextIcon,
    },
    enableColumnFilter: true,
  },
  {
    id: 'password',
    accessorKey: 'password',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Password" />
    ),
    meta: {
      label: 'Password',
      placeholder: 'Search passwords...',
      variant: 'text',
      icon: TextIcon,
    },
    enableColumnFilter: true,
  },
];

function AddButton() {
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
          <Button variant="outline" size="sm">
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

  return (
    <>
      <DataTableActionBarAction
        tooltip="Check selected proxies"
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
      </DataTableActionBarAction>
      <DataTableActionBarAction
        tooltip="Remove selected proxies"
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
      </DataTableActionBarAction>
      <DataTableActionBarSelection table={props.table} />
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
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const { data: profile } = useSuspenseQuery({
    ...instanceInfoQueryOptions,
    select: (info) => info.profile,
  });
  const { table } = useDataTable({
    data: profile.proxies,
    columns,
    getRowId: (row) => getProxyKey(row),
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
        table={table}
        actionBar={
          <DataTableActionBar table={table}>
            <ExtraHeader table={table} />
          </DataTableActionBar>
        }
      >
        <DataTableAdvancedToolbar table={table}>
          <DataTableFilterMenu table={table} />
          <DataTableSortList table={table} />
          <AddButton />
        </DataTableAdvancedToolbar>
      </DataTable>
    </div>
  );
}
