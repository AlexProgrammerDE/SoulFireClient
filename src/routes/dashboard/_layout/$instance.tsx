import { createFileRoute, deepEqual, Outlet } from '@tanstack/react-router';
import { TerminalComponent } from '@/components/terminal.tsx';
import CommandInput from '@/components/command-input.tsx';
import { createTransport } from '@/lib/web-rpc.ts';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { ProfileContext } from '@/components/providers/profile-context';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { convertFromProto } from '@/lib/types.ts';
import { InstanceConfig } from '@/generated/soulfire/instance.ts';
import { DashboardMenuHeader } from '@/components/dashboard-menu-header.tsx';
import { queryClientInstance } from '@/lib/query.ts';
import { useQuery } from '@tanstack/react-query';
import { LoadingComponent } from '@/components/loading-component.tsx';

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
        structuralSharing: (prev: unknown, next: unknown) =>
          deepEqual(prev, next) ? prev : next,
      },
    };
  },
  loader: async (props) => {
    await queryClientInstance.prefetchQuery(props.context.infoQueryOptions);
  },
  component: InstanceLayout,
});

function TerminalSide() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <TerminalComponent />
      <CommandInput />
    </div>
  );
}

function InstanceLayout() {
  const { instance } = Route.useParams();
  const { infoQueryOptions } = Route.useRouteContext();
  const result = useQuery(infoQueryOptions);

  if (result.isError) {
    throw result.error;
  }

  if (result.isLoading || !result.data) {
    return <LoadingComponent />;
  }

  return (
    <>
      <InstanceInfoContext.Provider
        value={{
          id: instance,
          friendlyName: result.data.instanceInfo.friendlyName,
          state: result.data.instanceInfo.state,
        }}
      >
        <ProfileContext.Provider
          value={convertFromProto(
            result.data.instanceInfo.config as InstanceConfig,
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
