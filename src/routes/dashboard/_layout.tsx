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
import { LoaderCircleIcon } from 'lucide-react';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { ClientDataResponse } from '@/generated/soulfire/config.ts';
import demoData from '@/demo-data.json';
import { DashboardMenuHeader } from '@/components/dashboard-menu-header.tsx';
import { Button } from '@/components/ui/button.tsx';

export const Route = createFileRoute('/dashboard/_layout')({
  beforeLoad: ({ location }) => {
    if (!isAuthenticated()) {
      return redirect({
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
        clientData: demoData as never,
      };
    }

    const configService = new ConfigServiceClient(transport);
    const result = await configService.getClientData(
      {},
      {
        abort: props.abortController.signal,
      },
    );

    return {
      transport,
      clientData: result.response,
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
          <h1 className="text-2xl font-bold">Error</h1>
          <p className="text-red-500">{error.message}</p>
          <div className="flex flex-row gap-2">
            <Button
              className="w-fit"
              onClick={() => {
                void navigate({
                  to: '/',
                  replace: true,
                });
              }}
            >
              Back to login
            </Button>
            <Button
              onClick={() => {
                void router.invalidate();
              }}
            >
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

  return (
    <TransportContext.Provider value={transport}>
      <ClientInfoContext.Provider value={clientData}>
        <Outlet />
      </ClientInfoContext.Provider>
    </TransportContext.Provider>
  );
}
