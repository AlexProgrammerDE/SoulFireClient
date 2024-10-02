import { TransportContext } from '@/components/providers/transport-context.tsx';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
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
import { ErrorComponent } from '@/components/error-component.tsx';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { ClientDataResponse } from '@/generated/soulfire/config.ts';
import demoData from '@/demo-data.json';

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
  pendingComponent: () => (
    <Card className="m-auto text-center w-full max-w-[450px] border-none">
      <CardHeader className="pb-0">
        <CardTitle>Connecting...</CardTitle>
      </CardHeader>
      <CardContent className="flex h-32 w-full">
        <LoaderCircleIcon className="m-auto h-12 w-12 animate-spin" />
      </CardContent>
    </Card>
  ),
  component: DashboardLayout,
});

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
