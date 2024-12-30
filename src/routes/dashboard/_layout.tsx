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
import { createTransport, isAuthenticated } from '@/lib/web-rpc.ts';
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
import { DashboardMenuHeader } from '@/components/dashboard-menu-header.tsx';
import { Button } from '@/components/ui/button.tsx';
import { isTauri } from '@/lib/utils.ts';
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
  ): Promise<{
    transport: GrpcWebFetchTransport | null;
    clientData: ClientDataResponse;
  }> => {
    const transport = createTransport();
    if (transport === null) {
      return {
        transport,
        clientData: demoData,
      };
    }

    const configService = new ConfigServiceClient(transport);
    const configResult = await configService.getClientData(
      {},
      {
        abort: props.abortController.signal,
      },
    );

    await queryClientInstance.prefetchQuery(props.context.listQueryOptions);

    return {
      transport,
      clientData: configResult.response,
    };
  },
  errorComponent: ErrorComponent,
  pendingComponent: PendingComponent,
  component: DashboardLayout,
});

function ErrorComponent({ error }: { error: Error }) {
  const navigate = useNavigate();
  const router = useRouter();

  return (
    <>
      <DashboardMenuHeader />
      <div className="flex flex-grow">
        <div className="m-auto flex flex-col gap-2">
          <h1 className="text-2xl font-bold gap-1 flex fle-row">
            <BugIcon className="h-8" />
            Error
          </h1>
          <p className="text-red-500">{error.message} (more info in console)</p>
          <div className="flex flex-row gap-2">
            <Button
              className="w-fit"
              onClick={() => {
                (async () => {
                  if (isTauri()) {
                    await emit('kill-integrated-server', {});
                  }
                  await navigate({
                    to: '/',
                    replace: true,
                  });
                })();
              }}
            >
              <LogOutIcon className="h-4" />
              Log out
            </Button>
            <Button
              onClick={() => {
                void router.invalidate();
              }}
            >
              <RotateCwIcon className="h-4" />
              Reload page
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function PendingComponent() {
  return (
    <>
      <DashboardMenuHeader />
      <div className="flex flex-grow">
        <Card className="m-auto text-center w-full max-w-[450px] border-none">
          <CardHeader className="pb-0">
            <CardTitle>Connecting...</CardTitle>
          </CardHeader>
          <CardContent className="flex h-32 w-full">
            <LoaderCircleIcon className="m-auto h-12 w-12 animate-spin" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function DashboardLayout() {
  const { transport, clientData } = Route.useLoaderData();
  const { listQueryOptions } = Route.useRouteContext();
  const instanceList = useQuery(listQueryOptions);

  if (instanceList.isError) {
    throw instanceList.error;
  }

  if (instanceList.isLoading || !instanceList.data) {
    return <LoadingComponent />;
  }

  return (
    <TransportContext.Provider value={transport}>
      <ClientInfoContext.Provider value={clientData}>
        <InstanceListContext.Provider value={instanceList.data.instanceList}>
          <Outlet />
        </InstanceListContext.Provider>
      </ClientInfoContext.Provider>
    </TransportContext.Provider>
  );
}
