import { createFileRoute } from '@tanstack/react-router';
import { use, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { DataTable } from '@/components/data-table.tsx';
import { ColumnDef, Table as ReactTable } from '@tanstack/react-table';
import {
  convertToInstanceProto,
  getEnumKeyByValue,
  ProfileAccount,
  ProfileRoot,
} from '@/lib/types.ts';
import {
  AccountTypeCredentials,
  AccountTypeDeviceCode,
  MinecraftAccountProto_AccountTypeProto,
} from '@/generated/soulfire/common.ts';
import { PlusIcon, TrashIcon } from 'lucide-react';
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
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { isTauri, runAsync } from '@/lib/utils.tsx';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { InstanceSettingsPageComponent } from '@/components/settings-page.tsx';
import InstancePageLayout from '@/components/nav/instance-page-layout.tsx';
import { Trans, useTranslation } from 'react-i18next';
import {
  SelectAllHeader,
  SelectRowHeader,
} from '@/components/data-table-selects.tsx';

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
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorFn: (row) =>
      getEnumKeyByValue(MinecraftAccountProto_AccountTypeProto, row.type),
    accessorKey: 'type',
    header: () => <Trans i18nKey={'instance:account.table.type'} />,
    sortingFn: 'fuzzySort',
  },
  {
    accessorKey: 'profileId',
    header: () => <Trans i18nKey={'instance:account.table.profileId'} />,
    sortingFn: 'fuzzySort',
  },
  {
    accessorKey: 'lastKnownName',
    header: () => <Trans i18nKey={'instance:account.table.lastKnownName'} />,
    sortingFn: 'fuzzySort',
  },
];

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
  const [accountTypeCredentialsSelected, setAccountTypeCredentialsSelected] =
    useState<AccountTypeCredentials | null>(null);
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
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
      });
    },
  });

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
      const responses = service.loginCredentials(
        {
          instanceId: instanceInfo.id,
          service: accountTypeCredentialsSelected,
          payload: textSplit,
        },
        {
          abort: abortController.signal,
        },
      ).responses;
      responses.onMessage((r) => {
        runAsync(async () => {
          const data = r.data;
          switch (data.oneofKind) {
            case 'fullList': {
              const accountsToAdd = data.fullList.account;
              const newProfile = {
                ...profile,
                accounts: addAndDeduplicate(profile.accounts, accountsToAdd),
              };

              await setProfileMutation(newProfile);

              if (accountsToAdd.length === 0) {
                toast.success(t('account.listImportToast.allFailed'), {
                  id: toastId,
                  cancel: undefined,
                });
              } else if (accountsToAdd.length !== textSplit.length) {
                toast.success(
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
              service
                .loginDeviceCode(
                  {
                    instanceId: instanceInfo.id,
                    service: type,
                  },
                  {
                    abort: abortController.signal,
                  },
                )
                .responses.onMessage((message) => {
                  if (message.data.oneofKind === 'account') {
                    resolve(message.data.account);
                  } else if (message.data.oneofKind === 'deviceCode') {
                    if (isTauri()) {
                      void shellOpen(
                        message.data.deviceCode.directVerificationUri,
                      );
                    } else {
                      window.open(
                        message.data.deviceCode.directVerificationUri,
                      );
                    }
                  }
                });
            } catch (e) {
              if (e instanceof Error) {
                reject(e);
              } else {
                reject(new Error(t('account.unknownError')));
              }
            }
          });

          await setProfileMutation({
            ...profile,
            accounts: addAndDeduplicate(profile.accounts, [await promise]),
          });
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
          <Button variant="outline">
            <PlusIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>
            {t('account.import.javaEdition')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              setAccountTypeCredentialsSelected(AccountTypeCredentials.OFFLINE)
            }
          >
            {t('account.import.offline')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              setAccountTypeCredentialsSelected(
                AccountTypeCredentials.MICROSOFT_JAVA_CREDENTIALS,
              )
            }
          >
            {t('account.import.microsoftCredentials')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              deviceCodeSelected(
                AccountTypeDeviceCode.MICROSOFT_JAVA_DEVICE_CODE,
              )
            }
          >
            {t('account.import.microsoftDeviceCode')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              setAccountTypeCredentialsSelected(
                AccountTypeCredentials.MICROSOFT_JAVA_REFRESH_TOKEN,
              )
            }
          >
            {t('account.import.microsoftRefreshToken')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              setAccountTypeCredentialsSelected(
                AccountTypeCredentials.THE_ALTENING,
              )
            }
          >
            {t('account.import.theAltening')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>
            {t('account.import.bedrockEdition')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              setAccountTypeCredentialsSelected(AccountTypeCredentials.OFFLINE)
            }
          >
            {t('account.import.offline')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              setAccountTypeCredentialsSelected(
                AccountTypeCredentials.MICROSOFT_BEDROCK_CREDENTIALS,
              )
            }
          >
            {t('account.import.microsoftCredentials')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              deviceCodeSelected(
                AccountTypeDeviceCode.MICROSOFT_BEDROCK_DEVICE_CODE,
              )
            }
          >
            {t('account.import.microsoftDeviceCode')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="outline"
        disabled={props.table.getFilteredSelectedRowModel().rows.length === 0}
        onClick={() => {
          const beforeSize = profile.accounts.length;
          const selectedRows = props.table
            .getFilteredSelectedRowModel()
            .rows.map((r) => r.original);
          const newProfile = {
            ...profile,
            accounts: profile.accounts.filter(
              (a) => !selectedRows.some((r) => r.profileId === a.profileId),
            ),
          };

          toast.promise(setProfileMutation(newProfile), {
            loading: t('account.removeToast.loading'),
            success: t('account.removeToast.success', {
              count: beforeSize - newProfile.accounts.length,
            }),
            error: (e) => {
              console.error(e);
              return t('account.removeToast.error');
            },
          });
        }}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
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

function AccountSettings() {
  const { t } = useTranslation('common');

  return (
    <InstancePageLayout
      extraCrumbs={[t('breadcrumbs.settings')]}
      pageName={t('pageName.accountSettings')}
      documentationLink="https://soulfiremc.com/docs/usage/accounts"
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
    <div className="flex h-full w-full max-w-4xl grow flex-col gap-4">
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
        filterPlaceholder={t('instance:account.filterPlaceholder')}
        columns={columns}
        data={profile.accounts}
        extraHeader={ExtraHeader}
      />
    </div>
  );
}
