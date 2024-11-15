import {
  createFileRoute,
  Link,
  LinkProps,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';
import { createTransport } from '@/lib/web-rpc.ts';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { ProfileContext } from '@/components/providers/profile-context';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { convertFromProto } from '@/lib/types.ts';
import {
  InstanceConfig,
  InstanceInfoResponse,
  InstanceState,
} from '@/generated/soulfire/instance.ts';
import { DashboardMenuHeader } from '@/components/dashboard-menu-header.tsx';
import { queryClientInstance } from '@/lib/query.ts';
import { useQuery } from '@tanstack/react-query';
import { LoadingComponent } from '@/components/loading-component.tsx';
import { ReactNode, useContext, useState } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { buttonVariants } from '@/components/ui/button.tsx';
import { BlocksIcon, TerminalIcon } from 'lucide-react';
import DynamicIcon from '@/components/dynamic-icon.tsx';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable.tsx';
import { cn } from '@/lib/utils.ts';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import {
  MinecraftAccountProto_AccountTypeProto,
  ProxyProto_Type,
} from '@/generated/soulfire/common.ts';

export const Route = createFileRoute('/dashboard/_layout/$instance')({
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

const collapsedActiveClassName = cn(
  buttonVariants({
    variant: 'default',
    size: 'icon',
  }),
  'h-9 w-9',
  'dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white',
);
const expandedActiveClassName = cn(
  buttonVariants({
    variant: 'default',
    size: 'sm',
  }),
  'dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white',
  'justify-start',
);

function Nav({ links, isCollapsed }: NavProps) {
  const router = useRouterState();

  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2 grow"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((link) =>
          isCollapsed ? (
            <Tooltip key={JSON.stringify(link.linkProps)} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  {...link.linkProps}
                  activeProps={{
                    className: collapsedActiveClassName,
                  }}
                  inactiveProps={{
                    className: (link.extraActiveUrls ?? []).includes(
                      router.location.pathname,
                    )
                      ? collapsedActiveClassName
                      : cn(
                          buttonVariants({
                            variant: 'ghost',
                            size: 'icon',
                          }),
                          'h-9 w-9',
                        ),
                  }}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="sr-only">{link.title}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {link.title}
                {link.label && (
                  <span className="ml-auto text-muted-foreground">
                    {link.label}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              key={JSON.stringify(link.linkProps)}
              {...link.linkProps}
              activeProps={{
                className: expandedActiveClassName,
              }}
              inactiveProps={{
                className: (link.extraActiveUrls ?? []).includes(
                  router.location.pathname,
                )
                  ? expandedActiveClassName
                  : cn(
                      buttonVariants({
                        variant: 'ghost',
                        size: 'sm',
                      }),
                      'justify-start',
                    ),
              }}
            >
              {({ isActive }) => {
                return (
                  <>
                    <link.icon className="mr-2 h-4 w-4" />
                    {link.title}
                    {link.label && (
                      <span
                        className={cn(
                          'ml-auto',
                          isActive && 'text-background dark:text-white',
                        )}
                      >
                        {link.label}
                      </span>
                    )}
                  </>
                );
              }}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}

function MobileNav({ links }: Omit<NavProps, 'isCollapsed'>) {
  const router = useRouterState();

  return (
    <div className="flex flex-row h-12 items-center justify-center border-t gap-1">
      {links.map((link) => (
        <Tooltip key={JSON.stringify(link.linkProps)} delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              {...link.linkProps}
              activeProps={{
                className: collapsedActiveClassName,
              }}
              inactiveProps={{
                className: (link.extraActiveUrls ?? []).includes(
                  router.location.pathname,
                )
                  ? collapsedActiveClassName
                  : cn(
                      buttonVariants({
                        variant: 'ghost',
                        size: 'icon',
                      }),
                      'h-9 w-9',
                    ),
              }}
            >
              <link.icon className="h-4 w-4" />
              <span className="sr-only">{link.title}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top" className="flex items-center gap-4">
            {link.title}
            {link.label && (
              <span className="ml-auto text-muted-foreground">
                {link.label}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

const defaultLayout = [10, 32];
const defaultCollapsed = false;
const navCollapsedSize = 1;

function InstanceLayout() {
  const { instance } = Route.useParams();
  const { infoQueryOptions } = Route.useRouteContext();
  const result = useQuery(infoQueryOptions);
  const clientInfo = useContext(ClientInfoContext);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

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
  const devSettings = clientInfo.settings.find(
    (settings) => settings.namespace === 'dev',
  );
  const firstPluginSettings = clientInfo.settings.find(
    (settings) => settings.owningPlugin !== undefined,
  );
  if (
    !botSettings ||
    !accountSettings ||
    !proxySettings ||
    !aiSettings ||
    !devSettings ||
    !firstPluginSettings
  ) {
    throw new Error('Namespaces missing');
  }

  const navLinks: NavProps['links'] = [
    {
      title: 'Console',
      icon: TerminalIcon,
      linkProps: {
        to: '/dashboard/$instance/controls',
        params: { instance: instance },
      },
    },
    {
      title: 'Bot Settings',
      icon: (props) => (
        <DynamicIcon {...props} name={botSettings.iconId as never} />
      ),
      linkProps: {
        to: '/dashboard/$instance/settings/$namespace',
        params: { instance: instance, namespace: 'bot' },
      },
    },
    {
      title: 'Plugin Settings',
      icon: BlocksIcon,
      linkProps: {
        to: '/dashboard/$instance/settings/$namespace',
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
        to: '/dashboard/$instance/accounts',
        params: { instance: instance },
      },
    },
    {
      title: 'Proxy Settings',
      icon: (props) => (
        <DynamicIcon {...props} name={proxySettings.iconId as never} />
      ),
      linkProps: {
        to: '/dashboard/$instance/proxies',
        params: { instance: instance },
      },
    },
    {
      title: 'AI Settings',
      icon: (props) => (
        <DynamicIcon {...props} name={aiSettings.iconId as never} />
      ),
      linkProps: {
        to: '/dashboard/$instance/settings/$namespace',
        params: { instance: instance, namespace: 'ai' },
      },
    },
    {
      title: 'Dev Settings',
      icon: (props) => (
        <DynamicIcon {...props} name={devSettings.iconId as never} />
      ),
      linkProps: {
        to: '/dashboard/$instance/settings/$namespace',
        params: { instance: instance, namespace: 'dev' },
      },
    },
  ];

  return (
    <>
      <InstanceInfoContext.Provider
        value={{
          id: instance,
          friendlyName: result.data.instanceInfo.friendlyName,
          state: result.data.instanceInfo.state,
        }}
      >
        <ProfileContext.Provider
          value={convertFromProto(
            result.data.instanceInfo.config as InstanceConfig,
          )}
        >
          <DashboardMenuHeader />
          <div className="flex flex-grow">
            <ResizablePanelGroup
              autoSaveId="main-layout"
              direction="horizontal"
              className="h-full items-stretch"
            >
              <ResizablePanel
                defaultSize={defaultLayout[0]}
                collapsedSize={navCollapsedSize}
                collapsible={true}
                minSize={10}
                maxSize={20}
                onCollapse={() => {
                  setIsCollapsed(true);
                }}
                onResize={() => {
                  setIsCollapsed(false);
                }}
                className={cn(
                  'hidden md:flex',
                  isCollapsed &&
                    'min-w-[50px] transition-all duration-300 ease-in-out',
                )}
              >
                <Nav isCollapsed={isCollapsed} links={navLinks} />
              </ResizablePanel>
              <ResizableHandle className="hidden md:flex" withHandle />
              <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
                <ScrollArea className="h-[calc(100vh-5.5rem)] md:h-[calc(100vh-2.5rem)] w-full pr-4">
                  <div className="flex flex-col min-h-[calc(100vh-5.5rem)] md:min-h-[calc(100vh-2.5rem)] w-full">
                    <Outlet />
                  </div>
                </ScrollArea>
                <MobileNav links={navLinks} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ProfileContext.Provider>
      </InstanceInfoContext.Provider>
    </>
  );
}
