import { createFileRoute } from '@tanstack/react-router';
import { createTransport } from '@/lib/web-rpc.ts';
import { queryClientInstance } from '@/lib/query.ts';
import { queryOptions } from '@tanstack/react-query';
import { ServerInfoResponse } from '@/generated/soulfire/server.ts';
import { ServerServiceClient } from '@/generated/soulfire/server.client.ts';
import { UserListResponse } from '@/generated/soulfire/user.ts';
import { UserRole } from '@/generated/soulfire/common.ts';
import { UserServiceClient } from '@/generated/soulfire/user.client.ts';
import { BaseSettings } from '@/lib/types';
import { convertFromServerProto } from '@/lib/types.ts';

export const Route = createFileRoute('/_dashboard/user/admin')({
  beforeLoad: (props) => {
    const serverInfoQueryOptions = queryOptions({
      queryKey: ['server-info'],
      queryFn: async (
        props,
      ): Promise<
        ServerInfoResponse & {
          parsedConfig: BaseSettings;
        }
      > => {
        const transport = createTransport();
        if (transport === null) {
          return {
            config: {
              settings: [],
            },
            parsedConfig: {
              settings: {},
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

        return {
          ...result.response,
          parsedConfig: convertFromServerProto(result.response.config!),
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
});
