import { createFileRoute, Outlet } from '@tanstack/react-router';
import { createTransport } from '@/lib/web-rpc.ts';
import { convertFromServerProto } from '@/lib/types.ts';
import { queryClientInstance } from '@/lib/query.ts';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import {
  ServerConfig,
  ServerInfoResponse,
} from '@/generated/soulfire/server.ts';
import { ServerServiceClient } from '@/generated/soulfire/server.client.ts';
import { ServerInfoContext } from '@/components/providers/server-info-context.tsx';
import { ServerConfigContext } from '@/components/providers/server-config-context.tsx';
import { UserListResponse } from '@/generated/soulfire/user.ts';
import { UserRole } from '@/generated/soulfire/common.ts';
import { UserServiceClient } from '@/generated/soulfire/user.client.ts';

export const Route = createFileRoute('/_dashboard/user/admin')({
  beforeLoad: (props) => {
    const serverInfoQueryOptions = queryOptions({
      queryKey: ['server-info'],
      queryFn: async (props): Promise<ServerInfoResponse> => {
        const transport = createTransport();
        if (transport === null) {
          return {
            config: {
              settings: [],
            },
            serverSettings: [],
          };
        }

        const serverService = new ServerServiceClient(transport);
        const result = await serverService.getServerInfo(
          {},
          {
            abort: props.signal,
          },
        );

        return result.response;
      },
      refetchInterval: 3_000,
    });
    const usersQueryOptions = queryOptions({
      queryKey: ['users'],
      queryFn: async (props): Promise<UserListResponse> => {
        const transport = createTransport();
        if (transport === null) {
          return {
            users: [
              {
                id: 'root',
                username: 'root',
                email: 'root@soulfiremc.com',
                role: UserRole.ADMIN,
              },
            ],
          };
        }

        const userService = new UserServiceClient(transport);
        const result = await userService.listUsers(
          {},
          {
            abort: props.signal,
          },
        );

        return result.response;
      },
      refetchInterval: 3_000,
    });
    props.abortController.signal.addEventListener('abort', () => {
      void queryClientInstance.cancelQueries({
        queryKey: serverInfoQueryOptions.queryKey,
      });
    });
    props.abortController.signal.addEventListener('abort', () => {
      void queryClientInstance.cancelQueries({
        queryKey: usersQueryOptions.queryKey,
      });
    });
    return {
      serverInfoQueryOptions,
      usersQueryOptions,
    };
  },
  loader: (props) => {
    void queryClientInstance.prefetchQuery(
      props.context.serverInfoQueryOptions,
    );
    void queryClientInstance.prefetchQuery(props.context.usersQueryOptions);
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { serverInfoQueryOptions } = Route.useRouteContext();
  const { data: serverInfo } = useSuspenseQuery(serverInfoQueryOptions);

  return (
    <ServerInfoContext.Provider value={serverInfo}>
      <ServerConfigContext.Provider
        value={convertFromServerProto(serverInfo.config as ServerConfig)}
      >
        <Outlet />
      </ServerConfigContext.Provider>
    </ServerInfoContext.Provider>
  );
}
