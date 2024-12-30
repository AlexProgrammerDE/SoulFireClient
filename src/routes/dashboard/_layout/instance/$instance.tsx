import { createFileRoute, LinkProps, Outlet } from '@tanstack/react-router';
import { createTransport } from '@/lib/web-rpc.ts';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { ProfileContext } from '@/components/providers/profile-context.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { convertFromInstanceProto } from '@/lib/types.ts';
import {
  InstanceConfig,
  InstanceInfoResponse,
  InstanceState,
} from '@/generated/soulfire/instance.ts';
import { queryClientInstance } from '@/lib/query.ts';
import { useQuery } from '@tanstack/react-query';
import { LoadingComponent } from '@/components/loading-component.tsx';
import { ReactNode, useContext } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { BlocksIcon, TerminalIcon } from 'lucide-react';
import DynamicIcon from '@/components/dynamic-icon.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import {
  MinecraftAccountProto_AccountTypeProto,
  ProxyProto_Type,
} from '@/generated/soulfire/common.ts';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar.tsx';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/dashboard/_layout/instance/$instance')({
  beforeLoad: (props) => {
    const { instance } = props.params;
    return {
      infoQueryOptions: {
        queryKey: ['instance-info', instance],
        queryFn: async ({
          signal,
        }: {
          signal: AbortSignal;
        }): Promise<{
          instanceInfo: InstanceInfoResponse;
        }> => {
          const transport = createTransport();
          if (transport === null) {
            return {
              instanceInfo: {
                friendlyName: 'Demo',
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
              abort: signal,
            },
          );

          return {
            instanceInfo: result.response,
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
  component: InstanceLayout,
});

interface NavProps {
  isCollapsed: boolean;
  links: {
    title: string;
    label?: string;
    icon: (props: { className: string }) => ReactNode;
    linkProps: LinkProps;
    extraActiveUrls?: string[];
  }[];
}

function InstanceLayout() {
  const { instance } = Route.useParams();
  const { infoQueryOptions } = Route.useRouteContext();
  const result = useQuery(infoQueryOptions);
  const clientInfo = useContext(ClientInfoContext);

  if (result.isError) {
    throw result.error;
  }

  if (result.isLoading || !result.data) {
    return <LoadingComponent />;
  }

  const botSettings = clientInfo.settings.find(
    (settings) => settings.namespace === 'bot',
  );
  const accountSettings = clientInfo.settings.find(
    (settings) => settings.namespace === 'account',
  );
  const proxySettings = clientInfo.settings.find(
    (settings) => settings.namespace === 'proxy',
  );
  const aiSettings = clientInfo.settings.find(
    (settings) => settings.namespace === 'ai',
  );
  const firstPluginSettings = clientInfo.settings.find(
    (settings) => settings.owningPlugin !== undefined,
  );
  if (
    !botSettings ||
    !accountSettings ||
    !proxySettings ||
    !aiSettings ||
    !firstPluginSettings
  ) {
    throw new Error('Namespaces missing');
  }

  const navLinks: NavProps['links'] = [
    {
      title: 'Console',
      icon: TerminalIcon,
      linkProps: {
        to: '/dashboard/instance/$instance/controls',
        params: { instance: instance },
      },
    },
    {
      title: 'Bot Settings',
      icon: (props) => (
        <DynamicIcon {...props} name={botSettings.iconId as never} />
      ),
      linkProps: {
        to: '/dashboard/instance/$instance/settings/$namespace',
        params: { instance: instance, namespace: 'bot' },
      },
    },
    {
      title: 'Plugin Settings',
      icon: BlocksIcon,
      linkProps: {
        to: '/dashboard/instance/$instance/settings/$namespace',
        params: {
          instance: instance,
          namespace: firstPluginSettings.namespace,
        },
      },
      extraActiveUrls: clientInfo.settings
        .filter(
          (settings) =>
            settings.owningPlugin !== undefined &&
            settings.namespace !== firstPluginSettings.namespace,
        )
        .map(
          (settings) => `/dashboard/${instance}/settings/${settings.namespace}`,
        ),
    },
    {
      title: 'Account Settings',
      icon: (props) => (
        <DynamicIcon {...props} name={accountSettings.iconId as never} />
      ),
      linkProps: {
        to: '/dashboard/instance/$instance/accounts',
        params: { instance: instance },
      },
    },
    {
      title: 'Proxy Settings',
      icon: (props) => (
        <DynamicIcon {...props} name={proxySettings.iconId as never} />
      ),
      linkProps: {
        to: '/dashboard/instance/$instance/proxies',
        params: { instance: instance },
      },
    },
    {
      title: 'AI Settings',
      icon: (props) => (
        <DynamicIcon {...props} name={aiSettings.iconId as never} />
      ),
      linkProps: {
        to: '/dashboard/instance/$instance/settings/$namespace',
        params: { instance: instance, namespace: 'ai' },
      },
    },
  ];

  return (
    <>
      <InstanceInfoContext.Provider
        value={{
          id: instance,
          ...result.data.instanceInfo,
        }}
      >
        <ProfileContext.Provider
          value={convertFromInstanceProto(
            result.data.instanceInfo.config as InstanceConfig,
          )}
        >
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2">
                <div className="flex items-center gap-2 px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href="#">
                          Building Your Application
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              </header>
              <ScrollArea className="h-dvh w-full pr-4">
                <div className="flex flex-col min-h-dvh w-full">
                  <Outlet />
                </div>
              </ScrollArea>
            </SidebarInset>
          </SidebarProvider>
        </ProfileContext.Provider>
      </InstanceInfoContext.Provider>
    </>
  );
}
