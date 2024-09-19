import { createFileRoute, Link } from '@tanstack/react-router';
import { useCallback, useContext, useState } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { Button } from '@/components/ui/button.tsx';
import ClientSettingsPageComponent from '@/components/client-settings-page.tsx';
import { DataTable } from '@/components/data-table.tsx';
import { ColumnDef, Table as ReactTable } from '@tanstack/react-table';
import {
  convertToProto,
  getEnumKeyByValue,
  ProfileAccount,
  ProfileRoot,
} from '@/lib/types.ts';
import { ProfileContext } from '@/components/providers/profile-context.tsx';
import {
  AccountTypeCredentials,
  AccountTypeDeviceCode,
  MinecraftAccountProto,
  MinecraftAccountProto_AccountTypeProto,
} from '@/generated/soulfire/common.ts';
import { PlusIcon, TrashIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { toast } from 'sonner';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { MCAuthServiceClient } from '@/generated/soulfire/mc-auth.client.ts';
import ImportDialog from '@/components/import-dialog.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isTauri } from '@/lib/utils.ts';
import { open as shellOpen } from '@tauri-apps/api/shell';

export const Route = createFileRoute('/dashboard/_layout/$instance/accounts')({
  component: AccountSettings,
});

const columns: ColumnDef<ProfileAccount>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className="flex">
        <Checkbox
          className="my-auto"
          defaultChecked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
    cell: ({ row }) =>
      getEnumKeyByValue(
        MinecraftAccountProto_AccountTypeProto,
        row.original.type,
      ),
  },
  {
    accessorKey: 'profileId',
    header: 'Profile ID',
  },

  {
    accessorKey: 'lastKnownName',
    header: 'Last Known Name',
  },
];

function ExtraHeader(props: { table: ReactTable<ProfileAccount> }) {
  const queryClient = useQueryClient();
  const profile = useContext(ProfileContext);
  const transport = useContext(TransportContext);
  const instanceInfo = useContext(InstanceInfoContext);
  const [accountTypeCredentialsSelected, setAccountTypeCredentialsSelected] =
    useState<AccountTypeCredentials | null>(null);
  const { mutateAsync: setProfileMutation } = useMutation({
    mutationFn: async (profile: ProfileRoot) => {
      const instanceService = new InstanceServiceClient(transport);
      await instanceService.updateInstanceConfig({
        id: instanceInfo.id,
        config: convertToProto(profile),
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
      if (accountTypeCredentialsSelected === null) return;

      if (text.length === 0) {
        toast.error('No accounts to import');
        return;
      }

      setAccountTypeCredentialsSelected(null);
      const textSplit = text
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const service = new MCAuthServiceClient(transport);
      toast.promise(
        (async () => {
          const accountsToAdd: ProfileAccount[] = [];
          const {
            response: { account },
          } = await service.loginCredentials({
            service: accountTypeCredentialsSelected,
            payload: textSplit,
            maxConcurrency: 1,
          });

          if (account) {
            accountsToAdd.push(...account);
          }

          await setProfileMutation({
            ...profile,
            accounts: [...profile.accounts, ...accountsToAdd],
          });
          return accountsToAdd.length;
        })(),
        {
          loading: 'Importing accounts...',
          success: (r) => `${r} accounts imported!`,
          error: (e) => {
            console.error(e);
            return 'Failed to import accounts';
          },
        },
      );
    },
    [accountTypeCredentialsSelected, profile, setProfileMutation, transport],
  );

  const deviceCodeSelected = useCallback(
    (type: AccountTypeDeviceCode) => {
      const service = new MCAuthServiceClient(transport);
      toast.promise(
        (async () => {
          const promise = new Promise<ProfileAccount>((resolve, reject) => {
            try {
              service
                .loginDeviceCode({
                  service: type,
                })
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
                reject(new Error('Unknown error'));
              }
            }
          });

          await setProfileMutation({
            ...profile,
            accounts: [...profile.accounts, await promise],
          });
        })(),
        {
          loading: 'Importing account...',
          success: 'Account imported!',
          error: (e) => {
            console.error(e);
            return 'Failed to import accounts';
          },
        },
      );
    },
    [profile, setProfileMutation, transport],
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
          <DropdownMenuLabel>Java Edition</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              setAccountTypeCredentialsSelected(AccountTypeCredentials.OFFLINE)
            }
          >
            Offline
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              setAccountTypeCredentialsSelected(
                AccountTypeCredentials.MICROSOFT_JAVA_CREDENTIALS,
              )
            }
          >
            Microsoft Credentials
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              deviceCodeSelected(
                AccountTypeDeviceCode.MICROSOFT_JAVA_DEVICE_CODE,
              )
            }
          >
            Microsoft Device Code
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              setAccountTypeCredentialsSelected(
                AccountTypeCredentials.THE_ALTENING,
              )
            }
          >
            The Altening
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Bedrock Edition</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              setAccountTypeCredentialsSelected(AccountTypeCredentials.OFFLINE)
            }
          >
            Offline
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              setAccountTypeCredentialsSelected(
                AccountTypeCredentials.MICROSOFT_BEDROCK_CREDENTIALS,
              )
            }
          >
            Microsoft Credentials
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              deviceCodeSelected(
                AccountTypeDeviceCode.MICROSOFT_BEDROCK_DEVICE_CODE,
              )
            }
          >
            Microsoft Device Code
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
            loading: 'Removing accounts...',
            success: () =>
              `Removed ${beforeSize - newProfile.accounts.length} accounts`,
            error: (e) => {
              console.error(e);
              return 'Failed to remove accounts';
            },
          });
        }}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
      {accountTypeCredentialsSelected !== null && (
        <ImportDialog
          title={`Import ${getEnumKeyByValue(MinecraftAccountProto_AccountTypeProto, accountTypeCredentialsSelected)} accounts`}
          description="Paste your accounts here, one per line"
          closer={() => setAccountTypeCredentialsSelected(null)}
          listener={textSelectedCallback}
        />
      )}
    </>
  );
}

function AccountSettings() {
  const clientInfo = useContext(ClientInfoContext);
  const profile = useContext(ProfileContext);
  const instanceInfo = useContext(InstanceInfoContext);

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <Button asChild variant="secondary">
        <Link
          to="/dashboard/$instance"
          params={{ instance: instanceInfo.id }}
          search={{}}
        >
          Back
        </Link>
      </Button>
      <div className="flex flex-col gap-2">
        <ClientSettingsPageComponent
          data={clientInfo.settings.find((s) => s.namespace === 'account')!}
        />
      </div>
      <DataTable
        filterDisplayName="accounts"
        filterKey="lastKnownName"
        columns={columns}
        data={profile.accounts}
        extraHeader={ExtraHeader}
      />
    </div>
  );
}
