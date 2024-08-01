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
import { MinecraftAccountProto_AccountTypeProto } from '@/generated/soulfire/common.ts';
import { PlusIcon, TrashIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { toast } from 'sonner';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { MCAuthServiceClient } from '@/generated/soulfire/mc-auth.client.ts';
import ImportDialog from '@/components/import-dialog.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
  const [accountTypeSelected, setAccountTypeSelected] =
    useState<MinecraftAccountProto_AccountTypeProto | null>(null);
  const setProfileMutation = useMutation({
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
      if (accountTypeSelected === null) return;

      if (text.length === 0) {
        toast.error('No accounts to import');
        return;
      }

      setAccountTypeSelected(null);
      const textSplit = text
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const service = new MCAuthServiceClient(transport);
      toast.promise(
        (async () => {
          const accountsToAdd: ProfileAccount[] = [];
          for (const line of textSplit) {
            const {
              response: { account },
            } = await service.login({
              service: accountTypeSelected,
              payload: line,
            });

            if (account) {
              accountsToAdd.push({
                type: account.type,
                profileId: account.profileId,
                lastKnownName: account.lastKnownName,
                accountData: account.accountData,
              });
            }
          }

          await setProfileMutation.mutateAsync({
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
    [accountTypeSelected, profile, setProfileMutation, transport],
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
            onClick={() =>
              setAccountTypeSelected(
                MinecraftAccountProto_AccountTypeProto.OFFLINE,
              )
            }
          >
            Offline
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              setAccountTypeSelected(
                MinecraftAccountProto_AccountTypeProto.MICROSOFT_JAVA,
              )
            }
          >
            Microsoft Java
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              setAccountTypeSelected(
                MinecraftAccountProto_AccountTypeProto.MICROSOFT_BEDROCK,
              )
            }
          >
            Microsoft Bedrock
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              setAccountTypeSelected(
                MinecraftAccountProto_AccountTypeProto.EASY_MC,
              )
            }
          >
            EasyMC
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              setAccountTypeSelected(
                MinecraftAccountProto_AccountTypeProto.THE_ALTENING,
              )
            }
          >
            The Altening
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

          toast.promise(setProfileMutation.mutateAsync(newProfile), {
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
      {accountTypeSelected !== null && (
        <ImportDialog
          title={`Import ${getEnumKeyByValue(MinecraftAccountProto_AccountTypeProto, accountTypeSelected)} accounts`}
          description="Paste your accounts here, one per line"
          closer={() => setAccountTypeSelected(null)}
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
        <Link to="/dashboard/$instance" params={{ instance: instanceInfo.id }}>
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
