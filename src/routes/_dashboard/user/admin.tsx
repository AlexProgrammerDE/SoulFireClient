import { createFileRoute } from '@tanstack/react-router';
import { createTransport } from '@/lib/web-rpc.ts';
import { queryOptions } from '@tanstack/react-query';
import { ServerServiceClient } from '@/generated/soulfire/server.client.ts';
import { UserListResponse } from '@/generated/soulfire/user.ts';
import { UserRole } from '@/generated/soulfire/common.ts';
import { UserServiceClient } from '@/generated/soulfire/user.client.ts';
import { convertFromServerProto, ServerInfoQueryData } from '@/lib/types.ts';
import { ServerConfig } from '@/generated/soulfire/server.ts';
import { demoServerSettings } from '@/demo-data.ts';

export const Route = createFileRoute('/_dashboard/user/admin')({
  beforeLoad: (props) => {
    const serverInfoQueryOptions = queryOptions({
      queryKey: ['server-info'],
      queryFn: async (props): Promise<ServerInfoQueryData> => {
        const transport = createTransport();
        if (transport === null) {
          const serverConfig: ServerConfig = {
            settings: [],
          };
          return {
            config: serverConfig,
            profile: convertFromServerProto(serverConfig),
            serverSettings: demoServerSettings,
          };
        }

        const serverService = new ServerServiceClient(transport);
        const result = await serverService.getServerInfo(
          {},
          {
            abort: props.signal,
          },
        );

        // console.log(JSON.stringify(result.response.serverSettings))
        return {
          ...result.response,
          profile: convertFromServerProto(result.response.config!),
        };
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
      void props.context.queryClient.cancelQueries({
        queryKey: serverInfoQueryOptions.queryKey,
      });
    });
    props.abortController.signal.addEventListener('abort', () => {
      void props.context.queryClient.cancelQueries({
        queryKey: usersQueryOptions.queryKey,
      });
    });
    return {
      serverInfoQueryOptions,
      usersQueryOptions,
    };
  },
  loader: (props) => {
    void props.context.queryClient.prefetchQuery(
      props.context.serverInfoQueryOptions,
    );
    void props.context.queryClient.prefetchQuery(
      props.context.usersQueryOptions,
    );
  },
});
