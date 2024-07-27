import { ServerConnectionContext } from '@/components/providers/server-context.tsx';
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { ConfigServiceClient } from '@/generated/com/soulfiremc/grpc/generated/config.client.ts';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { DashboardMenuHeader } from '@/components/dashboard-menu-header.tsx';
import { Button } from '@/components/ui/button.tsx';
import { isTauri } from '@/lib/utils.ts';
import { createDir, readDir } from '@tauri-apps/api/fs';
import { appConfigDir, resolve } from '@tauri-apps/api/path';
import { createTransport, isAuthenticated } from '@/lib/web-rpc.ts';

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
    const transport = createTransport();

    const configService = new ConfigServiceClient(transport);
    const result = await configService.getClientData(
      {},
      {
        abort: props.abortController.signal,
      },
    );

    let availableProfiles: string[] = [];
    if (isTauri()) {
      const profileDir = await resolve(
        await resolve(await appConfigDir(), 'profile'),
      );
      await createDir(profileDir, { recursive: true });

      availableProfiles = (await readDir(profileDir))
        .filter((file) => !file.children)
        .filter((file) => file.name)
        .map((file) => file.name!)
        .filter((file) => file.endsWith('.json'));
    }

    return {
      transport,
      clientData: result.response,
      availableProfiles,
    };
  },
  errorComponent: ErrorComponent,
  pendingComponent: () => (
    <div className="flex h-full w-full">Connecting...</div>
  ),
  component: ClientLayout,
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

function ClientLayout() {
  const { transport, clientData, availableProfiles } = Route.useLoaderData();

  return (
    <div className="flex h-screen w-screen flex-col">
      <ServerConnectionContext.Provider value={transport}>
        <ClientInfoContext.Provider value={clientData}>
          <DashboardMenuHeader availableProfiles={availableProfiles} />
          <Outlet />
        </ClientInfoContext.Provider>
      </ServerConnectionContext.Provider>
    </div>
  );
}
