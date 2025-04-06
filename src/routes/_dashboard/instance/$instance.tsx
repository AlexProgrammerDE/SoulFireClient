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
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import {
  MinecraftAccountProto_AccountTypeProto,
  ProxyProto_Type,
} from '@/generated/soulfire/common.ts';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar.tsx';
import { InstanceSidebar } from '@/components/nav/instance-sidebar.tsx';
import { TooltipProvider } from '@/components/ui/tooltip.tsx';

export const Route = createFileRoute('/_dashboard/instance/$instance')({
  beforeLoad: (props) => {
    const { instance } = props.params;
    const instanceInfoQueryOptions = queryOptions({
      queryKey: ['instance-info', instance],
      queryFn: async (props): Promise<InstanceInfoResponse> => {
        const transport = createTransport();
        if (transport === null) {
          return {
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
            instanceSettings: [],
            state: InstanceState.RUNNING,
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

        return result.response;
      },
      refetchInterval: 3_000,
    });
    props.abortController.signal.addEventListener('abort', () => {
      void queryClientInstance.cancelQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
      });
    });
    return {
      instanceInfoQueryOptions,
    };
  },
  loader: (props) => {
    void queryClientInstance.prefetchQuery(
      props.context.instanceInfoQueryOptions,
    );
  },
  component: InstanceLayout,
});

function InstanceLayout() {
  const { instance } = Route.useParams();
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const defaultOpen = localStorage.getItem('sidebar:state') === 'true';

  return (
    <>
      <InstanceInfoContext.Provider
        value={{
          id: instance,
          ...instanceInfo,
        }}
      >
        <ProfileContext.Provider
          value={convertFromInstanceProto(instanceInfo.config)}
        >
          <SidebarProvider defaultOpen={defaultOpen}>
            <InstanceSidebar />
            <TooltipProvider delayDuration={500}>
              <SidebarInset>
                <Outlet />
              </SidebarInset>
            </TooltipProvider>
          </SidebarProvider>
        </ProfileContext.Provider>
      </InstanceInfoContext.Provider>
    </>
  );
}
