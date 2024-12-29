import { createFileRoute } from '@tanstack/react-router';
import { createTransport } from '@/lib/web-rpc.ts';
import { queryClientInstance } from '@/lib/query.ts';
import { UserServiceClient } from '@/generated/soulfire/user.client.ts';
import { UserListResponse } from '@/generated/soulfire/user.ts';

export const Route = createFileRoute(
  '/dashboard/_layout/admin/_layout/overview',
)({
  beforeLoad: (props) => {
    return {
      infoQueryOptions: {
        queryKey: ['overview-user-info'],
        queryFn: async ({
          signal,
        }: {
          signal: AbortSignal;
        }): Promise<{
          userList: UserListResponse;
        }> => {
          const transport = createTransport();
          if (transport === null) {
            return {
              userList: {
                users: [],
              },
            };
          }

          const userService = new UserServiceClient(transport);
          const result = await userService.listUsers(
            {},
            {
              abort: signal,
            },
          );

          return {
            userList: result.response,
          };
        },
        signal: props.abortController.signal,
        refetchInterval: 3_000,
      },
    };
  },
  loader: async (props) => {
    await queryClientInstance.prefetchQuery(props.context.infoQueryOptions);
  },
  component: OverviewPage,
});

function OverviewPage() {
  return (
    <div className="grow flex h-full w-full flex-col gap-2 py-2 pl-2">
      <h2 className="text-xl font-semibold">Welcome to the admin dashboard</h2>
    </div>
  );
}
