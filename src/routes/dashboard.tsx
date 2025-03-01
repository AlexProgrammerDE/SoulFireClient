import { TransportContext } from '@/components/providers/transport-context.tsx';
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { ConfigServiceClient } from '@/generated/soulfire/config.client.ts';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { createTransport, isAuthenticated, logOut } from '@/lib/web-rpc.ts';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { ClientDataResponse } from '@/generated/soulfire/config.ts';
import { getGravatarUrl, isTauri } from '@/lib/utils.tsx';
import { emit } from '@tauri-apps/api/event';
import { demoData } from '@/demo-data.ts';
import {
  InstanceListResponse,
  InstanceState,
} from '@/generated/soulfire/instance.ts';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { queryClientInstance } from '@/lib/query.ts';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { LoadingComponent } from '@/components/loading-component.tsx';
import { InstanceListContext } from '@/components/providers/instance-list-context.tsx';
import { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ConnectingComponent } from '@/components/connecting-component.tsx';
import { ErrorComponent } from '@/components/error-component.tsx';

export const listQueryKey = ['instance-list'];
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async (props) => {
    if (isAuthenticated()) {
      const listQueryOptions = queryOptions({
        queryKey: listQueryKey,
        queryFn: async (
          props,
        ): Promise<{
          instanceList: InstanceListResponse;
        }> => {
          const transport = createTransport();
          if (transport === null) {
            return {
              instanceList: {
                instances: [
                  {
                    id: 'demo',
                    friendlyName: 'Demo',
                    icon: 'pickaxe',
                    state: InstanceState.RUNNING,
                    instancePermissions: [],
                  },
                ],
              },
            };
          }

          const instanceService = new InstanceServiceClient(transport);
          const result = await instanceService.listInstances(
            {},
            {
              abort: props.signal,
            },
          );

          return {
            instanceList: result.response,
          };
        },
        refetchInterval: 3_000,
      });
      props.abortController.signal.addEventListener('abort', () => {
        void queryClientInstance.cancelQueries(listQueryOptions);
      });
      return {
        listQueryOptions,
      };
    } else {
      if (isTauri()) {
        await emit('kill-integrated-server', {});
      }
      logOut();
      throw redirect({
        to: '/',
        search: {
          redirect: props.location.href,
        },
      });
    }
  },
  loader: async (
    props,
  ): Promise<
    | {
        success: true;
        transport: GrpcWebFetchTransport | null;
        clientData: ClientDataResponse;
        gravatarUrl: string;
      }
    | {
        success: false;
        connectionError: object;
      }
  > => {
    const transport = createTransport();
    if (transport === null) {
      return {
        success: true,
        transport,
        clientData: demoData,
        gravatarUrl: getGravatarUrl(demoData.email),
      };
    }

    try {
      const configService = new ConfigServiceClient(transport);
      const configResult = await configService.getClientData(
        {},
        {
          abort: props.abortController.signal,
        },
      );

      await queryClientInstance.prefetchQuery(props.context.listQueryOptions);

      // We need this as demo data
      // if (APP_ENVIRONMENT === 'development') {
      //   console.debug(JSON.stringify(configResult.response));
      // }

      return {
        success: true,
        transport,
        clientData: configResult.response,
        gravatarUrl: getGravatarUrl(configResult.response.email),
      };
    } catch (e) {
      return {
        success: false,
        connectionError: e as object,
      };
    }
  },
  component: DashboardLayout,
  // Ensure we show the pending component when needed
  wrapInSuspense: true,
  pendingComponent: ConnectingComponent,
});

function InstanceSwitchKeybinds() {
  const navigate = useNavigate();
  const instanceList = useContext(InstanceListContext);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const numberKey = parseInt(e.key);
        if (numberKey > 0 && numberKey <= instanceList.instances.length) {
          e.preventDefault();
          void navigate({
            to: '/dashboard/instance/$instance/console',
            params: { instance: instanceList.instances[numberKey - 1].id },
          });
        }
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [instanceList.instances, navigate]);

  return null;
}

function DashboardLayout() {
  const { t } = useTranslation('common');
  const loaderData = Route.useLoaderData();
  const { listQueryOptions } = Route.useRouteContext();
  const instanceList = useQuery(listQueryOptions);
  if (!loaderData.success) {
    return <ErrorComponent error={new Error(t('error.connectionFailed'))} />;
  }

  const { transport, clientData, gravatarUrl } = loaderData;

  if (instanceList.isError) {
    throw instanceList.error;
  }

  if (instanceList.isLoading || !instanceList.data) {
    return <LoadingComponent />;
  }

  return (
    <TransportContext.Provider value={transport}>
      <ClientInfoContext.Provider
        value={{
          ...clientData,
          gravatarUrl,
        }}
      >
        <InstanceListContext.Provider value={instanceList.data.instanceList}>
          <InstanceSwitchKeybinds />
          <Outlet />
        </InstanceListContext.Provider>
      </ClientInfoContext.Provider>
    </TransportContext.Provider>
  );
}
