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
import { Button } from '@/components/ui/button.tsx';
import { createTransport, isAuthenticated } from '@/lib/web-rpc.ts';
import { getTerminalTheme } from '@/lib/utils.ts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { LoaderCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { TerminalThemeContext } from '@/components/providers/terminal-theme-context';
import { ErrorComponent } from '@/components/error-component.tsx';

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
  loader: async (props) => {
    const transport = createTransport();

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
  const [terminalTheme, setTerminalTheme] = useState(getTerminalTheme());

  return (
    <div className="flex h-screen w-screen flex-col">
      <TransportContext.Provider value={transport}>
        <ClientInfoContext.Provider value={clientData}>
          <TerminalThemeContext.Provider
            value={{
              value: terminalTheme,
              setter: setTerminalTheme,
            }}
          >
            <Outlet />
          </TerminalThemeContext.Provider>
        </ClientInfoContext.Provider>
      </TransportContext.Provider>
    </div>
  );
}
