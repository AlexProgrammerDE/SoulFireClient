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

export const Route = createFileRoute('/_dashboard/user/admin')({
  beforeLoad: (props) => {
    const serverInfoQueryOptions = queryOptions({
      queryKey: ['server-info'],
      queryFn: async (
        props,
      ): Promise<{
        serverInfo: ServerInfoResponse;
      }> => {
        const transport = createTransport();
        if (transport === null) {
          return {
            serverInfo: {
              config: {
                settings: [],
              },
              serverSettings: [],
            },
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
          serverInfo: result.response,
        };
      },
      refetchInterval: 3_000,
    });
    props.abortController.signal.addEventListener('abort', () => {
      void queryClientInstance.cancelQueries({
        queryKey: serverInfoQueryOptions.queryKey,
      });
    });
    return {
      serverInfoQueryOptions,
    };
  },
  loader: (props) => {
    void queryClientInstance.prefetchQuery(
      props.context.serverInfoQueryOptions,
    );
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { serverInfoQueryOptions } = Route.useRouteContext();
  const { data: result } = useSuspenseQuery(serverInfoQueryOptions);

  return (
    <ServerInfoContext.Provider value={result.serverInfo}>
      <ServerConfigContext.Provider
        value={convertFromServerProto(result.serverInfo.config as ServerConfig)}
      >
        <Outlet />
      </ServerConfigContext.Provider>
    </ServerInfoContext.Provider>
  );
}
