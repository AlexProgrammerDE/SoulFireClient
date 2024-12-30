import {
  createFileRoute,
  Link,
  LinkProps,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';
import { createTransport } from '@/lib/web-rpc.ts';
import { convertFromServerProto } from '@/lib/types.ts';
import { queryClientInstance } from '@/lib/query.ts';
import { useQuery } from '@tanstack/react-query';
import { LoadingComponent } from '@/components/loading-component.tsx';
import { ReactNode, useContext, useState } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { buttonVariants } from '@/components/ui/button.tsx';
import { LayoutDashboardIcon } from 'lucide-react';
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
} from '@/components/ui/tooltip.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import {
  ServerConfig,
  ServerInfoResponse,
} from '@/generated/soulfire/server.ts';
import { ServerServiceClient } from '@/generated/soulfire/server.client.ts';
import { ServerInfoContext } from '@/components/providers/server-info-context.tsx';
import { ServerConfigContext } from '@/components/providers/server-config-context.tsx';

export const Route = createFileRoute('/dashboard/_layout/admin/_layout')({
  beforeLoad: (props) => {
    return {
      infoQueryOptions: {
        queryKey: ['server-info'],
        queryFn: async ({
          signal,
        }: {
          signal: AbortSignal;
        }): Promise<{
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
              abort: signal,
            },
          );

          return {
            serverInfo: result.response,
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
  component: AdminLayout,
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

function AdminLayout() {
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

  const devSettings = clientInfo.settings.find(
    (settings) => settings.namespace === 'dev',
  );
  if (!devSettings) {
    throw new Error('Namespaces missing');
  }

  const navLinks: NavProps['links'] = [
    {
      title: 'Overview',
      icon: LayoutDashboardIcon,
      linkProps: {
        to: '/dashboard/admin/overview',
        params: {},
      },
    },
    {
      title: 'Dev Settings',
      icon: (props) => (
        <DynamicIcon {...props} name={devSettings.iconId as never} />
      ),
      linkProps: {
        to: '/dashboard/admin/settings/$namespace',
        params: { namespace: 'dev' },
      },
    },
  ];

  return (
    <>
      <ServerInfoContext.Provider value={result.data.serverInfo}>
        <ServerConfigContext.Provider
          value={convertFromServerProto(
            result.data.serverInfo.config as ServerConfig,
          )}
        >
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
                <ScrollArea className="h-dvh w-full pr-4">
                  <div className="flex flex-col min-h-dvh w-full">
                    <Outlet />
                  </div>
                </ScrollArea>
                <MobileNav links={navLinks} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ServerConfigContext.Provider>
      </ServerInfoContext.Provider>
    </>
  );
}
