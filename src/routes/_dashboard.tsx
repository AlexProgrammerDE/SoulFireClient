import { TransportContext } from '@/components/providers/transport-context.tsx';
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { ClientServiceClient } from '@/generated/soulfire/client.client.ts';
import {
  createTransport,
  isAuthenticated,
  isImpersonating,
  logOut,
} from '@/lib/web-rpc.ts';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { ClientDataResponse } from '@/generated/soulfire/client.ts';
import { isTauri } from '@/lib/utils.tsx';
import { emit } from '@tauri-apps/api/event';
import { demoData } from '@/demo-data.ts';
import {
  InstanceListResponse,
  InstanceState,
} from '@/generated/soulfire/instance.ts';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { queryClientInstance } from '@/lib/query.ts';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorComponent } from '@/components/error-component.tsx';
import { CreateInstanceProvider } from '@/components/dialog/create-instance-dialog.tsx';

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: async (props) => {
    if (isAuthenticated()) {
      const instanceListQueryOptions = queryOptions({
        queryKey: ['instance-list'],
        queryFn: async (props): Promise<InstanceListResponse> => {
          const transport = createTransport();
          if (transport === null) {
            return {
              instances: [
                {
                  id: 'demo',
                  friendlyName: 'Demo',
                  icon: 'pickaxe',
                  state: InstanceState.RUNNING,
                  instancePermissions: [],
                },
              ],
            };
          }

          const instanceService = new InstanceServiceClient(transport);
          const result = await instanceService.listInstances(
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
          queryKey: instanceListQueryOptions.queryKey,
        });
      });
      const clientDataQueryOptions = queryOptions({
        queryKey: ['client-data'],
        queryFn: async (props): Promise<ClientDataResponse> => {
          const transport = createTransport();
          if (transport === null) {
            return demoData;
          }

          const clientService = new ClientServiceClient(transport);
          const result = await clientService.getClientData(
            {},
            {
              abort: props.signal,
            },
          );

          return result.response;
        },
      });
      props.abortController.signal.addEventListener('abort', () => {
        void queryClientInstance.cancelQueries({
          queryKey: clientDataQueryOptions.queryKey,
        });
      });
      return {
        instanceListQueryOptions,
        clientDataQueryOptions,
      };
    } else {
      if (isTauri()) {
        await emit('kill-integrated-server', {});
      }
      logOut();
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        to: '/',
        search: {
          redirect: props.location.href,
        },
      });
    }
  },
  loader: (
    props,
  ):
    | {
        success: true;
        transport: GrpcWebFetchTransport | null;
      }
    | {
        success: false;
        connectionError: object;
      } => {
    const transport = createTransport();
    if (transport === null) {
      return {
        success: true,
        transport,
      };
    }

    try {
      void queryClientInstance.prefetchQuery(
        props.context.instanceListQueryOptions,
      );
      void queryClientInstance.prefetchQuery(
        props.context.clientDataQueryOptions,
      );

      // We need this as demo data
      // if (APP_ENVIRONMENT === 'development') {
      //   console.debug(JSON.stringify(configResult.response));
      // }

      return {
        success: true,
        transport,
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
});

function InstanceSwitchKeybinds() {
  const navigate = useNavigate();
  const { instanceListQueryOptions } = Route.useRouteContext();
  const { data: instanceList } = useSuspenseQuery(instanceListQueryOptions);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const numberKey = parseInt(e.key);
        if (numberKey > 0 && numberKey <= instanceList.instances.length) {
          e.preventDefault();
          void navigate({
            to: '/instance/$instance',
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
  if (!loaderData.success) {
    return <ErrorComponent error={new Error(t('error.connectionFailed'))} />;
  }

  return (
    <TransportContext.Provider value={loaderData.transport}>
      <Suspense>
        <InstanceSwitchKeybinds />
      </Suspense>
      {isImpersonating() && (
        <div className="border-sidebar-primary pointer-events-none absolute top-0 right-0 bottom-0 left-0 z-30 overflow-hidden border-4" />
      )}
      <CreateInstanceProvider>
        <Outlet />
      </CreateInstanceProvider>
    </TransportContext.Provider>
  );
}
