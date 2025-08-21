import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { use, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { ColumnDef, Row, Table as ReactTable } from '@tanstack/react-table';
import {
  getEnumEntries,
  getEnumKeyByValue,
  mapUnionToValue,
} from '@/lib/types.ts';
import { UserRole } from '@/generated/soulfire/common.ts';
import { toast } from 'sonner';
import {
  LogOutIcon,
  PencilIcon,
  PlusIcon,
  ShieldUserIcon,
  TextIcon,
  TrashIcon,
  UserIcon,
  VenetianMaskIcon,
} from 'lucide-react';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import { startImpersonation } from '@/lib/web-rpc.ts';
import { UserListResponse_User } from '@/generated/soulfire/user.ts';
import { UserServiceClient } from '@/generated/soulfire/user.client.ts';
import UserPageLayout from '@/components/nav/user/user-page-layout.tsx';
import { UserAvatar } from '@/components/user-avatar.tsx';
import { ManageUserDialog } from '@/components/dialog/manage-user-dialog.tsx';
import { ROOT_USER_ID, runAsync, timestampToDate } from '@/lib/utils.tsx';
import { SFTimeAgo } from '@/components/sf-timeago.tsx';
import { CopyInfoButton } from '@/components/info-buttons.tsx';
import {
  SelectAllHeader,
  SelectRowHeader,
} from '@/components/data-table/data-table-selects.tsx';
import { DataTable } from '@/components/data-table/data-table.tsx';
import { useDataTable } from '@/hooks/use-data-table.ts';
import { DataTableActionBar } from '@/components/data-table/data-table-action-bar.tsx';
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar.tsx';
import { DataTableFilterMenu } from '@/components/data-table/data-table-filter-menu.tsx';
import { DataTableSortList } from '@/components/data-table/data-table-sort-list.tsx';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header.tsx';

export const Route = createFileRoute('/_dashboard/user/admin/users')({
  component: Users,
});

const columns: ColumnDef<UserListResponse_User>[] = [
  {
    id: 'select',
    header: SelectAllHeader,
    cell: SelectRowHeader,
    size: 32,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'username',
    accessorKey: 'username',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Username" />
    ),
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
    meta: {
      label: 'Username',
      placeholder: 'Search usernames...',
      variant: 'text',
      icon: TextIcon,
    },
    enableColumnFilter: true,
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    meta: {
      label: 'Email',
      placeholder: 'Search emails...',
      variant: 'text',
      icon: TextIcon,
    },
    enableColumnFilter: true,
  },
  {
    id: 'role',
    accessorFn: (row) => getEnumKeyByValue(UserRole, row.role),
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    meta: {
      label: 'Role',
      variant: 'multiSelect',
      options: getEnumEntries(UserRole).map((type) => {
        return {
          label: type.key,
          value: type.key,
          icon: mapUnionToValue(type.key, (key) => {
            switch (key) {
              case 'USER':
                return UserIcon;
              case 'ADMIN':
                return ShieldUserIcon;
            }
          }),
        };
      }),
    },
  },
  {
    id: 'createdAt',
    accessorFn: (row) => timestampToDate(row.createdAt!),
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created at" />
    ),
    cell: ({ row }) => (
      <SFTimeAgo date={timestampToDate(row.original.createdAt!)} />
    ),
    enableGlobalFilter: false,
    sortingFn: 'datetime',
    meta: {
      label: 'Created at',
      placeholder: 'Search created ats...',
      variant: 'dateRange',
    },
  },
  {
    id: 'minIssuedAt',
    accessorFn: (row) => timestampToDate(row.minIssuedAt!),
    accessorKey: 'minIssuedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Min issued at" />
    ),
    cell: ({ row }) => (
      <SFTimeAgo date={timestampToDate(row.original.minIssuedAt!)} />
    ),
    enableGlobalFilter: false,
    sortingFn: 'datetime',
    meta: {
      label: 'Min issued at',
      placeholder: 'Search min issued ats...',
      variant: 'dateRange',
    },
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
    size: 64,
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
      <ManageUserDialog
        mode="edit"
        user={props.row.original}
        open={open}
        setOpen={setOpen}
      />
    </>
  );
}

function ImpersonateUserButton(props: { row: Row<UserListResponse_User> }) {
  const transport = use(TransportContext);
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
  const transport = use(TransportContext);
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
        <PlusIcon />
      </Button>
      <ManageUserDialog mode="add" open={createOpen} setOpen={setCreateOpen} />
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
        <TrashIcon />
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
        <LogOutIcon />
      </Button>
    </>
  );
}

function Users() {
  const { t } = useTranslation('common');

  return (
    <UserPageLayout
      showUserCrumb={false}
      extraCrumbs={[
        {
          id: 'settings',
          content: t('breadcrumbs.settings'),
        },
      ]}
      pageName={t('pageName.users')}
    >
      <Content />
    </UserPageLayout>
  );
}

function Content() {
  const { usersQueryOptions, clientDataQueryOptions } = Route.useRouteContext();
  const { data: clientInfo } = useSuspenseQuery(clientDataQueryOptions);
  const { data: userList } = useSuspenseQuery(usersQueryOptions);
  const { table } = useDataTable({
    data: userList.users,
    columns,
    pageCount: -1,
    enableRowSelection: (row) =>
      row.original.id !== ROOT_USER_ID && row.original.id !== clientInfo.id,
    getRowId: (row) => row.id,
  });

  return (
    <div className="container flex h-full w-full grow flex-col gap-4">
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
        </DataTableAdvancedToolbar>
      </DataTable>
    </div>
  );
}
