import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { use, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { DataTable } from '@/components/data-table/data-table.tsx';
import { ColumnDef, Table as ReactTable } from '@tanstack/react-table';
import {
  getEnumEntries,
  getEnumKeyByValue,
  mapUnionToValue,
  ProfileAccount,
  ProfileRoot,
} from '@/lib/types.ts';
import {
  AccountTypeCredentials,
  AccountTypeDeviceCode,
  MinecraftAccountProto_AccountTypeProto,
} from '@/generated/soulfire/common.ts';
import {
  KeyRoundIcon,
  MonitorSmartphoneIcon,
  PlusIcon,
  RotateCcwKeyIcon,
  TextIcon,
  TrashIcon,
  WifiOffIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { ExternalToast, toast } from 'sonner';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { MCAuthServiceClient } from '@/generated/soulfire/mc-auth.client.ts';
import ImportDialog from '@/components/dialog/import-dialog.tsx';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { isTauri, runAsync, setInstanceConfig } from '@/lib/utils.tsx';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { InstanceSettingsPageComponent } from '@/components/settings-page.tsx';
import InstancePageLayout from '@/components/nav/instance/instance-page-layout.tsx';
import { useTranslation } from 'react-i18next';
import {
  SelectAllHeader,
  SelectRowHeader,
} from '@/components/data-table/data-table-selects.tsx';
import { useAptabase } from '@aptabase/react';
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

export const Route = createFileRoute('/_dashboard/instance/$instance/accounts')(
  {
    component: AccountSettings,
  },
);

function addAndDeduplicate(
  accounts: ProfileAccount[],
  newAccounts: ProfileAccount[],
) {
  const newAccountsSet = new Set(newAccounts.map((a) => a.profileId));
  return accounts
    .filter((a) => !newAccountsSet.has(a.profileId))
    .concat(newAccounts);
}

const columns: ColumnDef<ProfileAccount>[] = [
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
    accessorFn: (row) =>
      getEnumKeyByValue(MinecraftAccountProto_AccountTypeProto, row.type),
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    meta: {
      label: 'Type',
      variant: 'multiSelect',
      options: getEnumEntries(MinecraftAccountProto_AccountTypeProto).map(
        (type) => {
          return {
            label: type.key,
            value: type.key,
            icon: mapUnionToValue(type.key, (key) => {
              switch (key) {
                case 'OFFLINE':
                  return WifiOffIcon;
                case 'MICROSOFT_JAVA_CREDENTIALS':
                  return KeyRoundIcon;
                case 'MICROSOFT_JAVA_DEVICE_CODE':
                  return MonitorSmartphoneIcon;
                case 'MICROSOFT_JAVA_REFRESH_TOKEN':
                  return RotateCcwKeyIcon;
                case 'MICROSOFT_BEDROCK_CREDENTIALS':
                  return KeyRoundIcon;
                case 'MICROSOFT_BEDROCK_DEVICE_CODE':
                  return MonitorSmartphoneIcon;
              }
            }),
          };
        },
      ),
    },
    enableColumnFilter: true,
  },
  {
    id: 'profileId',
    accessorKey: 'profileId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Profile ID" />
    ),
    meta: {
      label: 'Profile ID',
      placeholder: 'Search profile IDs...',
      variant: 'text',
      icon: TextIcon,
    },
    enableColumnFilter: true,
  },
  {
    id: 'lastKnownName',
    accessorKey: 'lastKnownName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last known name" />
    ),
    meta: {
      label: 'Last known name',
      placeholder: 'Search last known names...',
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
  const [accountTypeCredentialsSelected, setAccountTypeCredentialsSelected] =
    useState<AccountTypeCredentials | null>(null);

  const textSelectedCallback = useCallback(
    (text: string) => {
      if (accountTypeCredentialsSelected === null) return;

      if (text.length === 0) {
        toast.error(t('account.listImportToast.noAccounts'));
        return;
      }

      setAccountTypeCredentialsSelected(null);

      if (transport === null) {
        return;
      }

      const textSplit = text
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const service = new MCAuthServiceClient(transport);

      const abortController = new AbortController();
      const loadingData: ExternalToast = {
        cancel: {
          label: t('common:cancel'),
          onClick: () => {
            abortController.abort();
          },
        },
      };
      const total = textSplit.length;
      let failed = 0;
      let success = 0;
      const loadingReport = () =>
        t('account.listImportToast.loading', {
          checked: success + failed,
          total,
          success,
          failed,
        });
      const toastId = toast.loading(loadingReport(), loadingData);
      const { responses } = service.loginCredentials(
        {
          instanceId: instanceInfo.id,
          service: accountTypeCredentialsSelected,
          payload: textSplit,
        },
        {
          abort: abortController.signal,
        },
      );
      responses.onMessage((r) => {
        runAsync(async () => {
          const data = r.data;
          switch (data.oneofKind) {
            case 'fullList': {
              const accountsToAdd = data.fullList.account;

              await setProfileMutation((prev) => ({
                ...prev,
                accounts: addAndDeduplicate(prev.accounts, accountsToAdd),
              }));

              if (accountsToAdd.length === 0) {
                toast.error(t('account.listImportToast.allFailed'), {
                  id: toastId,
                  cancel: undefined,
                });
              } else if (accountsToAdd.length !== textSplit.length) {
                toast.warning(
                  t('account.listImportToast.someFailed', {
                    count: accountsToAdd.length,
                    failed: textSplit.length - accountsToAdd.length,
                  }),
                  {
                    id: toastId,
                    cancel: undefined,
                  },
                );
              } else {
                toast.success(
                  t('account.listImportToast.noneFailed', {
                    count: accountsToAdd.length,
                  }),
                  {
                    id: toastId,
                    cancel: undefined,
                  },
                );
              }
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
      });
      responses.onError((e) => {
        console.error(e);
        toast.error(t('account.listImportToast.error'), {
          id: toastId,
          cancel: undefined,
        });
      });
    },
    [
      accountTypeCredentialsSelected,
      instanceInfo.id,
      profile,
      setProfileMutation,
      t,
      transport,
    ],
  );

  const deviceCodeSelected = useCallback(
    (type: AccountTypeDeviceCode) => {
      if (transport === null) {
        return;
      }

      const abortController = new AbortController();
      const service = new MCAuthServiceClient(transport);
      toast.promise(
        (async () => {
          const promise = new Promise<ProfileAccount>((resolve, reject) => {
            try {
              const { responses } = service.loginDeviceCode(
                {
                  instanceId: instanceInfo.id,
                  service: type,
                },
                {
                  abort: abortController.signal,
                },
              );
              responses.onMessage((message) => {
                if (message.data.oneofKind === 'account') {
                  resolve(message.data.account);
                } else if (message.data.oneofKind === 'deviceCode') {
                  if (isTauri()) {
                    void shellOpen(
                      message.data.deviceCode.directVerificationUri,
                    );
                  } else {
                    window.open(message.data.deviceCode.directVerificationUri);
                  }
                }
              });
              responses.onError((e) => {
                console.error(e);
                reject(new Error(t('account.unknownError')));
              });
            } catch (e) {
              if (e instanceof Error) {
                reject(e);
              } else {
                reject(new Error(t('account.unknownError')));
              }
            }
          });

          const promiseResult = await promise;
          await setProfileMutation((prev) => ({
            ...prev,
            accounts: addAndDeduplicate(prev.accounts, [promiseResult]),
          }));
        })(),
        {
          loading: t('account.deviceCodeImportToast.loading'),
          success: t('account.deviceCodeImportToast.success'),
          error: (e) => {
            console.error(e);
            return t('account.deviceCodeImportToast.error');
          },
          cancel: {
            label: t('common:cancel'),
            onClick: () => {
              abortController.abort();
            },
          },
        },
      );
    },
    [instanceInfo.id, profile, setProfileMutation, t, transport],
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
          <DropdownMenuLabel>
            {t('account.import.javaEdition')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              void trackEvent('import_account_java_offline');
              setAccountTypeCredentialsSelected(AccountTypeCredentials.OFFLINE);
            }}
          >
            {t('account.import.offline')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void trackEvent('import_account_microsoft_java_credentials');
              setAccountTypeCredentialsSelected(
                AccountTypeCredentials.MICROSOFT_JAVA_CREDENTIALS,
              );
            }}
          >
            {t('account.import.microsoftCredentials')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void trackEvent('import_account_microsoft_java_device_code');
              deviceCodeSelected(
                AccountTypeDeviceCode.MICROSOFT_JAVA_DEVICE_CODE,
              );
            }}
          >
            {t('account.import.microsoftDeviceCode')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void trackEvent('import_account_microsoft_java_refresh_token');
              setAccountTypeCredentialsSelected(
                AccountTypeCredentials.MICROSOFT_JAVA_REFRESH_TOKEN,
              );
            }}
          >
            {t('account.import.microsoftRefreshToken')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>
            {t('account.import.bedrockEdition')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              void trackEvent('import_account_bedrock_offline');
              setAccountTypeCredentialsSelected(AccountTypeCredentials.OFFLINE);
            }}
          >
            {t('account.import.offline')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void trackEvent('import_account_microsoft_bedrock_credentials');
              setAccountTypeCredentialsSelected(
                AccountTypeCredentials.MICROSOFT_BEDROCK_CREDENTIALS,
              );
            }}
          >
            {t('account.import.microsoftCredentials')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void trackEvent('import_account_microsoft_bedrock_device_code');
              deviceCodeSelected(
                AccountTypeDeviceCode.MICROSOFT_BEDROCK_DEVICE_CODE,
              );
            }}
          >
            {t('account.import.microsoftDeviceCode')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {accountTypeCredentialsSelected !== null && (
        <ImportDialog
          title={t('account.import.dialog.title', {
            type: getEnumKeyByValue(
              AccountTypeCredentials,
              accountTypeCredentialsSelected,
            ),
          })}
          description={t('account.import.dialog.description')}
          closer={() => setAccountTypeCredentialsSelected(null)}
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

function ExtraHeader(props: { table: ReactTable<ProfileAccount> }) {
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
        tooltip="Remove selected accounts"
        onClick={() => {
          void trackEvent('remove_accounts', {
            count: props.table.getFilteredSelectedRowModel().rows.length,
          });
          const selectedRows = props.table
            .getFilteredSelectedRowModel()
            .rows.map((r) => r.original);

          toast.promise(
            setProfileMutation((prev) => ({
              ...prev,
              accounts: prev.accounts.filter(
                (a) => !selectedRows.some((r) => r.profileId === a.profileId),
              ),
            })),
            {
              loading: t('account.removeToast.loading'),
              success: t('account.removeToast.success', {
                count: selectedRows.length,
              }),
              error: (e) => {
                console.error(e);
                return t('account.removeToast.error');
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

function AccountSettings() {
  const { t } = useTranslation('common');

  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: 'settings',
          content: t('breadcrumbs.settings'),
        },
      ]}
      pageName={t('pageName.accountSettings')}
      documentationLink="https://soulfiremc.com/docs/usage/accounts"
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
    data: profile.accounts,
    columns,
    getRowId: (row) => row.profileId,
  });

  return (
    <div className="container flex h-full w-full grow flex-col gap-4">
      <div className="flex flex-col gap-2">
        <InstanceSettingsPageComponent
          data={
            instanceInfo.instanceSettings.find(
              (s) => s.namespace === 'account',
            )!
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
