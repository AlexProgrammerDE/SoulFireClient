import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { useContext, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { DataTable } from '@/components/data-table.tsx';
import { ColumnDef, Row, Table as ReactTable } from '@tanstack/react-table';
import { getEnumKeyByValue } from '@/lib/types.ts';
import { UserRole } from '@/generated/soulfire/common.ts';
import { toast } from 'sonner';
import {
  LogOutIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  VenetianMaskIcon,
} from 'lucide-react';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import {
  SelectAllHeader,
  SelectRowHeader,
} from '@/components/data-table-selects.tsx';
import { createTransport, startImpersonation } from '@/lib/web-rpc.ts';
import { queryClientInstance } from '@/lib/query.ts';
import {
  UserListResponse,
  UserListResponse_User,
} from '@/generated/soulfire/user.ts';
import { UserServiceClient } from '@/generated/soulfire/user.client.ts';
import { LoadingComponent } from '@/components/loading-component.tsx';
import UserPageLayout from '@/components/nav/user-page-layout.tsx';
import { UserAvatar } from '@/components/user-avatar.tsx';
import { ManageUserPopup } from '@/components/dialog/manage-user-popup.tsx';
import { ROOT_USER_ID, runAsync, timestampToDate } from '@/lib/utils.tsx';
import { SFTimeAgo } from '@/components/sf-timeago.tsx';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { CopyInfoButton } from '@/components/info-buttons.tsx';

export const Route = createFileRoute('/_dashboard/user/admin/users')({
  beforeLoad: (props) => {
    const usersQueryOptions = queryOptions({
      queryKey: ['users'],
      queryFn: async (
        props,
      ): Promise<{
        userList: UserListResponse;
      }> => {
        const transport = createTransport();
        if (transport === null) {
          return {
            userList: {
              users: [
                {
                  id: 'root',
                  username: 'root',
                  email: 'root@soulfiremc.com',
                  role: UserRole.ADMIN,
                },
              ],
            },
          };
        }

        const userService = new UserServiceClient(transport);
        const result = await userService.listUsers(
          {},
          {
            abort: props.signal,
          },
        );

        return {
          userList: result.response,
        };
      },
      refetchInterval: 3_000,
    });
    props.abortController.signal.addEventListener('abort', () => {
      void queryClientInstance.cancelQueries({
        queryKey: usersQueryOptions.queryKey,
      });
    });
    return {
      usersQueryOptions,
    };
  },
  loader: async (props) => {
    await queryClientInstance.prefetchQuery(props.context.usersQueryOptions);
  },
  component: Users,
});

const columns: ColumnDef<UserListResponse_User>[] = [
  {
    id: 'select',
    header: SelectAllHeader,
    cell: SelectRowHeader,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'username',
    header: () => <Trans i18nKey="admin:users.table.username" />,
    cell: ({ row }) => (
      <div className="flex flex-row items-center justify-start gap-2">
        <UserAvatar
          username={row.original.username}
          email={row.original.email}
          className="size-8"
        />
        <span className="max-w-64 truncate">{row.original.username}</span>
        <CopyInfoButton value={row.original.id} />
      </div>
    ),
    sortingFn: 'fuzzySort',
  },
  {
    accessorKey: 'email',
    header: () => <Trans i18nKey="admin:users.table.email" />,
    sortingFn: 'fuzzySort',
  },
  {
    accessorFn: (row) => getEnumKeyByValue(UserRole, row.role),
    accessorKey: 'role',
    header: () => <Trans i18nKey="admin:users.table.role" />,
    sortingFn: 'fuzzySort',
  },
  {
    accessorFn: (row) => timestampToDate(row.createdAt!),
    accessorKey: 'createdAt',
    header: () => <Trans i18nKey="admin:users.table.createdAt" />,
    cell: ({ row }) => (
      <SFTimeAgo date={timestampToDate(row.original.createdAt!)} />
    ),
    enableGlobalFilter: false,
    sortingFn: 'datetime',
    filterFn: 'isWithinRange',
  },
  {
    accessorFn: (row) => timestampToDate(row.minIssuedAt!),
    accessorKey: 'minIssuedAt',
    header: () => <Trans i18nKey="admin:users.table.minIssuedAt" />,
    cell: ({ row }) => (
      <SFTimeAgo date={timestampToDate(row.original.minIssuedAt!)} />
    ),
    enableGlobalFilter: false,
    sortingFn: 'datetime',
    filterFn: 'isWithinRange',
  },
  {
    id: 'actions',
    header: () => <Trans i18nKey="admin:users.table.actions" />,
    cell: ({ row }) => (
      <div className="flex flex-row gap-2">
        <UpdateUserButton row={row} />
        <ImpersonateUserButton row={row} />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];

function UpdateUserButton(props: { row: Row<UserListResponse_User> }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        disabled={!props.row.getCanSelect()}
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <PencilIcon />
      </Button>
      <ManageUserPopup
        mode="edit"
        user={props.row.original}
        open={open}
        setOpen={setOpen}
      />
    </>
  );
}

function ImpersonateUserButton(props: { row: Row<UserListResponse_User> }) {
  const transport = useContext(TransportContext);
  const navigate = useNavigate();
  return (
    <>
      <Button
        disabled={!props.row.getCanSelect()}
        variant="secondary"
        size="sm"
        onClick={() => {
          runAsync(async () => {
            if (transport === null) {
              return;
            }

            const userService = new UserServiceClient(transport);
            const token = await userService.generateUserAPIToken({
              id: props.row.original.id,
            });
            startImpersonation(token.response.token);
            await navigate({
              to: '/user',
              replace: true,
              reloadDocument: true,
            });
          });
        }}
      >
        <VenetianMaskIcon />
      </Button>
    </>
  );
}

function ExtraHeader(props: { table: ReactTable<UserListResponse_User> }) {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const transport = useContext(TransportContext);
  const [createOpen, setCreateOpen] = useState(false);
  const { usersQueryOptions } = Route.useRouteContext();
  const { mutateAsync: deleteUsersMutation } = useMutation({
    mutationFn: async (user: UserListResponse_User[]) => {
      if (transport === null) {
        return;
      }

      const userService = new UserServiceClient(transport);
      for (const u of user) {
        await userService.deleteUser({
          id: u.id,
        });
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: usersQueryOptions.queryKey,
      });
    },
  });
  const { mutateAsync: invalidateUsersMutation } = useMutation({
    mutationFn: async (user: UserListResponse_User[]) => {
      if (transport === null) {
        return;
      }

      const userService = new UserServiceClient(transport);
      for (const u of user) {
        await userService.invalidateSessions({
          id: u.id,
        });
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: usersQueryOptions.queryKey,
      });
    },
  });

  return (
    <>
      <Button variant="outline" onClick={() => setCreateOpen(true)}>
        <PlusIcon className="h-4 w-4" />
      </Button>
      <ManageUserPopup mode="add" open={createOpen} setOpen={setCreateOpen} />
      <Button
        variant="outline"
        disabled={props.table.getFilteredSelectedRowModel().rows.length === 0}
        onClick={() => {
          const selectedRows = props.table
            .getFilteredSelectedRowModel()
            .rows.map((r) => r.original);

          toast.promise(deleteUsersMutation(selectedRows), {
            loading: t('users.removeToast.loading'),
            success: t('users.removeToast.success'),
            error: (e) => {
              console.error(e);
              return t('users.removeToast.error');
            },
          });
        }}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        disabled={props.table.getFilteredSelectedRowModel().rows.length === 0}
        onClick={() => {
          const selectedRows = props.table
            .getFilteredSelectedRowModel()
            .rows.map((r) => r.original);

          toast.promise(invalidateUsersMutation(selectedRows), {
            loading: t('users.invalidateToast.loading'),
            success: t('users.invalidateToast.success'),
            error: (e) => {
              console.error(e);
              return t('users.invalidateToast.error');
            },
          });
        }}
      >
        <LogOutIcon className="h-4 w-4" />
      </Button>
    </>
  );
}

function Users() {
  const { t } = useTranslation('common');
  const { usersQueryOptions } = Route.useRouteContext();
  const clientInfo = useContext(ClientInfoContext);
  const userList = useQuery(usersQueryOptions);

  if (userList.isError) {
    throw userList.error;
  }

  if (userList.isLoading || !userList.data) {
    return <LoadingComponent />;
  }

  return (
    <UserPageLayout
      showUserCrumb={false}
      extraCrumbs={[t('breadcrumbs.settings')]}
      pageName={t('pageName.users')}
    >
      <div className="flex h-full w-full max-w-4xl grow flex-col gap-4">
        <DataTable
          filterPlaceholder={t('admin:users.filterPlaceholder')}
          columns={columns}
          data={userList.data.userList.users}
          extraHeader={ExtraHeader}
          enableRowSelection={(row) =>
            row.original.id !== ROOT_USER_ID &&
            row.original.id !== clientInfo.id
          }
        />
      </div>
    </UserPageLayout>
  );
}
