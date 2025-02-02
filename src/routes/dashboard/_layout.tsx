import { TransportContext } from '@/components/providers/transport-context.tsx';
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { ConfigServiceClient } from '@/generated/soulfire/config.client.ts';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { createTransport, isAuthenticated, logOut } from '@/lib/web-rpc.ts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import {
  BugIcon,
  LoaderCircleIcon,
  LogOutIcon,
  RotateCwIcon,
} from 'lucide-react';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { ClientDataResponse } from '@/generated/soulfire/config.ts';
import { Button } from '@/components/ui/button.tsx';
import { getGravatarUrl, isTauri } from '@/lib/utils.tsx';
import { emit } from '@tauri-apps/api/event';
import { demoData } from '@/demo-data.ts';
import {
  InstanceListResponse,
  InstanceState,
} from '@/generated/soulfire/instance.ts';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { queryClientInstance } from '@/lib/query.ts';
import { useQuery } from '@tanstack/react-query';
import { LoadingComponent } from '@/components/loading-component.tsx';
import { InstanceListContext } from '@/components/providers/instance-list-context.tsx';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const listQueryFn = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<{
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
      abort: signal,
    },
  );

  return {
    instanceList: result.response,
  };
};

export const listQueryKey = ['instance-list'];
export const Route = createFileRoute('/dashboard/_layout')({
  beforeLoad: async ({ location, abortController }) => {
    if (isAuthenticated()) {
      return {
        listQueryOptions: {
          queryKey: listQueryKey,
          queryFn: listQueryFn,
          signal: abortController.signal,
          refetchInterval: 3_000,
        },
      };
    } else {
      if (isTauri()) {
        await emit('kill-integrated-server', {});
      }
      logOut();
      throw redirect({
        to: '/',
        search: {
          redirect: location.href,
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
  errorComponent: ErrorComponent,
  pendingComponent: PendingComponent,
  component: DashboardLayout,
});

function ErrorComponent({ error }: { error: Error }) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const router = useRouter();
  const [revalidating, setRevalidating] = useState(false);

  return (
    <>
      <div className="flex flex-grow">
        <div className="m-auto flex flex-col gap-2">
          <h1 className="text-2xl font-bold gap-1 flex fle-row">
            <BugIcon className="h-8" />
            {t('error.page.title')}
          </h1>
          <p className="text-red-500 max-w-2xl">
            {t('error.page.message', {
              message: error.message,
            })}
          </p>
          <div className="flex flex-row gap-2">
            <Button
              className="w-fit"
              onClick={() => {
                (async () => {
                  if (isTauri()) {
                    await emit('kill-integrated-server', {});
                  }
                  logOut();
                  await navigate({
                    to: '/',
                    replace: true,
                  });
                })();
              }}
            >
              <LogOutIcon className="h-4" />
              {t('error.page.logOut')}
            </Button>
            <Button
              onClick={() => {
                setRevalidating(true);
                router
                  .invalidate()
                  .then(() => {
                    setRevalidating(false);
                  })
                  .catch(() => {
                    setRevalidating(false);
                  });
              }}
            >
              {revalidating ? (
                <LoaderCircleIcon className="h-4 animate-spin" />
              ) : (
                <RotateCwIcon className="h-4" />
              )}
              {t('error.page.reloadPage')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function PendingComponent() {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-grow">
      <Card className="m-auto text-center w-full max-w-[450px] border-none">
        <CardHeader className="pb-0">
          <CardTitle>{t('pending.connecting')}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-32 w-full">
          <LoaderCircleIcon className="m-auto h-12 w-12 animate-spin" />
        </CardContent>
      </Card>
    </div>
  );
}

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
