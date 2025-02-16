import { createFileRoute, Outlet } from '@tanstack/react-router';
import { createTransport } from '@/lib/web-rpc.ts';
import { convertFromServerProto } from '@/lib/types.ts';
import { queryClientInstance } from '@/lib/query.ts';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { LoadingComponent } from '@/components/loading-component.tsx';
import {
  ServerConfig,
  ServerInfoResponse,
} from '@/generated/soulfire/server.ts';
import { ServerServiceClient } from '@/generated/soulfire/server.client.ts';
import { ServerInfoContext } from '@/components/providers/server-info-context.tsx';
import { ServerConfigContext } from '@/components/providers/server-config-context.tsx';

export const Route = createFileRoute('/dashboard/_layout/admin/_layout')({
  beforeLoad: (props) => {
    const infoQueryOptions = queryOptions({
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
      void queryClientInstance.cancelQueries(infoQueryOptions);
    });
    return {
      infoQueryOptions,
    };
  },
  loader: async (props) => {
    await queryClientInstance.prefetchQuery(props.context.infoQueryOptions);
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { infoQueryOptions } = Route.useRouteContext();
  const result = useQuery(infoQueryOptions);

  if (result.isError) {
    throw result.error;
  }

  if (result.isLoading || !result.data) {
    return <LoadingComponent />;
  }

  return (
    <ServerInfoContext.Provider value={result.data.serverInfo}>
      <ServerConfigContext.Provider
        value={convertFromServerProto(
          result.data.serverInfo.config as ServerConfig,
        )}
      >
        <Outlet />
      </ServerConfigContext.Provider>
    </ServerInfoContext.Provider>
  );
}
