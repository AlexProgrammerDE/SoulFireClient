import { createFileRoute, Outlet } from '@tanstack/react-router';
import { TerminalComponent } from '@/components/terminal.tsx';
import CommandInput from '@/components/command-input.tsx';
import { createTransport } from '@/lib/web-rpc.ts';
import { InstanceServiceClient } from '@/generated/com/soulfiremc/grpc/generated/instance.client.ts';
import { ProfileContext } from '@/components/providers/profile-context';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { convertFromProto } from '@/lib/types.ts';
import { InstanceConfig } from '@/generated/com/soulfiremc/grpc/generated/instance.ts';
import { DashboardMenuHeader } from '@/components/dashboard-menu-header.tsx';
import { queryClient } from '@/lib/query.ts';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/dashboard/_layout/$instance')({
  beforeLoad: (props) => {
    const { instance } = props.params;
    return {
      infoQueryOptions: {
        queryKey: ['instance-info', instance],
        queryFn: async ({ signal }: { signal: AbortSignal }) => {
          const transport = createTransport();

          const instanceService = new InstanceServiceClient(transport);
          const result = await instanceService.getInstanceInfo(
            {
              id: instance,
            },
            {
              abort: signal,
            },
          );

          return {
            instanceInfo: result.response,
          };
        },
        signal: props.abortController.signal,
        refetchInterval: 3_000,
      },
    };
  },
  loader: async (props) => {
    await queryClient.prefetchQuery(props.context.infoQueryOptions);
  },
  component: ClientLayout,
});

function TerminalSide() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="terminal-container flex-grow md:h-[calc(100vh-9rem)]">
        <TerminalComponent />
      </div>
      <CommandInput />
    </div>
  );
}

function ClientLayout() {
  const { instance } = Route.useParams();
  const { infoQueryOptions } = Route.useRouteContext();
  const instanceInfoResult = useQuery(infoQueryOptions);

  return (
    <>
      <InstanceInfoContext.Provider
        value={{
          id: instance,
          friendlyName: instanceInfoResult.data!.instanceInfo.friendlyName,
          state: instanceInfoResult.data!.instanceInfo.state,
        }}
      >
        <ProfileContext.Provider
          value={convertFromProto(
            instanceInfoResult.data!.instanceInfo.config as InstanceConfig,
          )}
        >
          <DashboardMenuHeader />
          <div className="grid flex-grow grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex overflow-auto p-4 md:h-[calc(100vh-2.5rem)]">
              <Outlet />
            </div>
            <TerminalSide />
          </div>
        </ProfileContext.Provider>
      </InstanceInfoContext.Provider>
    </>
  );
}
