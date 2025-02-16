import { createFileRoute, Outlet } from '@tanstack/react-router';
import { createTransport } from '@/lib/web-rpc.ts';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { ProfileContext } from '@/components/providers/profile-context.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { convertFromInstanceProto } from '@/lib/types.ts';
import {
  InstanceInfoResponse,
  InstanceState,
} from '@/generated/soulfire/instance.ts';
import { queryClientInstance } from '@/lib/query.ts';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { LoadingComponent } from '@/components/loading-component.tsx';
import {
  MinecraftAccountProto_AccountTypeProto,
  ProxyProto_Type,
} from '@/generated/soulfire/common.ts';

export const Route = createFileRoute('/dashboard/_layout/instance/$instance')({
  beforeLoad: (props) => {
    const { instance } = props.params;
    const infoQueryOptions = queryOptions({
      queryKey: ['instance-info', instance],
      queryFn: async (
        props,
      ): Promise<{
        instanceInfo: InstanceInfoResponse;
      }> => {
        const transport = createTransport();
        if (transport === null) {
          return {
            instanceInfo: {
              friendlyName: 'Demo',
              icon: 'pickaxe',
              instancePermissions: [],
              config: {
                settings: [],
                accounts: [
                  {
                    type: MinecraftAccountProto_AccountTypeProto.OFFLINE,
                    profileId: '607d30e7-115b-3838-914a-e4229c2b985d',
                    lastKnownName: 'Pistonmaster',
                    accountData: {
                      oneofKind: 'offlineJavaData',
                      offlineJavaData: {},
                    },
                  },
                ],
                proxies: [
                  {
                    type: ProxyProto_Type.HTTP,
                    address: '127.0.0.1:8080',
                    username: 'admin',
                    password: 'admin',
                  },
                  {
                    type: ProxyProto_Type.SOCKS4,
                    address: '127.0.0.1:8081',
                    username: 'admin',
                  },
                  {
                    type: ProxyProto_Type.SOCKS5,
                    address: '127.0.0.1:8082',
                    username: 'admin',
                    password: 'admin',
                  },
                ],
              },
              state: InstanceState.RUNNING,
            },
          };
        }

        const instanceService = new InstanceServiceClient(transport);
        const result = await instanceService.getInstanceInfo(
          {
            id: instance,
          },
          {
            abort: props.signal,
          },
        );

        return {
          instanceInfo: result.response,
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
  component: InstanceLayout,
});

function InstanceLayout() {
  const { instance } = Route.useParams();
  const { infoQueryOptions } = Route.useRouteContext();
  const result = useQuery(infoQueryOptions);

  if (result.isError) {
    throw result.error;
  }

  if (result.isLoading || !result.data) {
    return <LoadingComponent />;
  }

  return (
    <>
      <InstanceInfoContext.Provider
        value={{
          id: instance,
          ...result.data.instanceInfo,
        }}
      >
        <ProfileContext.Provider
          value={convertFromInstanceProto(result.data.instanceInfo.config)}
        >
          <Outlet />
        </ProfileContext.Provider>
      </InstanceInfoContext.Provider>
    </>
  );
}
