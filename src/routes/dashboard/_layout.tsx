import { TransportContext } from '@/components/providers/transport-context.tsx';
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { ConfigServiceClient } from '@/generated/soulfire/config.client.ts';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { Button } from '@/components/ui/button.tsx';
import { createTransport, isAuthenticated } from '@/lib/web-rpc.ts';
import { getTerminalTheme, isTauri } from '@/lib/utils.ts';
import { appConfigDir, resolve } from '@tauri-apps/api/path';
import { createDir, readDir } from '@tauri-apps/api/fs';
import {
  SystemInfo,
  SystemInfoContext,
} from '@/components/providers/system-info-context.tsx';
import { arch, locale, platform, type, version } from '@tauri-apps/api/os';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { LoaderCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { TerminalThemeContext } from '@/components/providers/terminal-theme-context';

export const Route = createFileRoute('/dashboard/_layout')({
  beforeLoad: ({ location }) => {
    if (!isAuthenticated()) {
      throw redirect({
        to: '/',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  loader: async (props) => {
    let systemInfo: SystemInfo | null;
    if (isTauri()) {
      const profileDir = await resolve(
        await resolve(await appConfigDir(), 'profile'),
      );
      await createDir(profileDir, { recursive: true });

      const availableProfiles = (await readDir(profileDir))
        .filter((file) => !file.children)
        .filter((file) => file.name)
        .map((file) => file.name!)
        .filter((file) => file.endsWith('.json'));

      systemInfo = {
        availableProfiles,
        osType: await type(),
        osVersion: await version(),
        platformName: await platform(),
        osLocale: await locale(),
        archName: await arch(),
      };
    } else {
      systemInfo = null;
    }

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
      systemInfo,
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

function ErrorComponent({ error }: { error: Error }) {
  const navigate = useNavigate();

  return (
    <div className="m-auto flex flex-col gap-2">
      <h1 className="text-2xl font-bold">Error</h1>
      <p className="text-red-500">{error.message}</p>
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
    </div>
  );
}

function DashboardLayout() {
  const { transport, clientData, systemInfo } = Route.useLoaderData();
  const [terminalTheme, setTerminalTheme] = useState(getTerminalTheme());

  return (
    <div className="flex h-screen w-screen flex-col">
      <TransportContext.Provider value={transport}>
        <ClientInfoContext.Provider value={clientData}>
          <SystemInfoContext.Provider value={systemInfo}>
            <TerminalThemeContext.Provider
              value={{
                value: terminalTheme,
                setter: setTerminalTheme,
              }}
            >
              <Outlet />
            </TerminalThemeContext.Provider>
          </SystemInfoContext.Provider>
        </ClientInfoContext.Provider>
      </TransportContext.Provider>
    </div>
  );
}
