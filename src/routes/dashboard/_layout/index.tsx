import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createTransport } from '@/lib/web-rpc.ts';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import {
  CreateInstancePopup,
  CreateInstanceType,
} from '@/components/create-instance-popup.tsx';
import { useContext, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { DashboardMenuHeader } from '@/components/dashboard-menu-header.tsx';
import { TrashIcon } from 'lucide-react';
import { toast } from 'sonner';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { queryClientInstance } from '@/lib/query.ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  InstanceListResponse,
  InstanceState,
} from '@/generated/soulfire/instance.ts';
import { LoadingComponent } from '@/components/loading-component.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { getEnumKeyByValue } from '@/lib/types.ts';

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

export const Route = createFileRoute('/dashboard/_layout/')({
  beforeLoad: (props) => {
    return {
      listQueryOptions: {
        queryKey: ['instance-list'],
        queryFn: listQueryFn,
        signal: props.abortController.signal,
        refetchInterval: 3_000,
      },
    };
  },
  loader: async (props) => {
    await queryClientInstance.prefetchQuery(props.context.listQueryOptions);
  },
  component: InstanceSelectPage,
});

function InstanceSelectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { listQueryOptions } = Route.useRouteContext();
  const instanceList = useQuery(listQueryOptions);
  const transport = useContext(TransportContext);
  const [createOpen, setCreateOpen] = useState(false);
  const addMutation = useMutation({
    mutationFn: async (values: CreateInstanceType) => {
      if (transport === null) {
        return;
      }

      const instanceService = new InstanceServiceClient(transport);
      const promise = instanceService
        .createInstance({
          friendlyName: values.friendlyName,
        })
        .then((r) => r.response);
      toast.promise(promise, {
        loading: 'Creating instance...',
        success: (r) => {
          void navigate({
            to: '/dashboard/$instance/controls',
            params: { instance: r.id },
          });
          return 'Instance created successfully';
        },
        error: (e) => {
          console.error(e);
          return 'Failed to create instance';
        },
      });

      return promise;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: listQueryOptions.queryKey,
      });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      if (transport === null) {
        return;
      }

      const instanceService = new InstanceServiceClient(transport);
      const promise = instanceService
        .deleteInstance({
          id: instanceId,
        })
        .then((r) => r.response);
      toast.promise(promise, {
        loading: 'Deleting instance...',
        success: 'Instance deleted',
        error: (e) => {
          console.error(e);
          return 'Failed to delete instance';
        },
      });

      return promise;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: listQueryOptions.queryKey,
      });
    },
  });

  if (instanceList.isError) {
    throw instanceList.error;
  }

  if (instanceList.isLoading || !instanceList.data) {
    return <LoadingComponent />;
  }

  return (
    <>
      <DashboardMenuHeader />
      <ScrollArea className="h-[calc(100vh-2.5rem)] w-full pr-4">
        <div className="flex flex-col min-h-[calc(100vh-2.5rem)] w-full">
          <div className="flex flex-col p-4 m-auto gap-4">
            {instanceList.data.instanceList.instances.length == 0 && (
              <div className="flex flex-col gap-4 p-4">
                <h1>No instances found</h1>
              </div>
            )}
            {instanceList.data.instanceList.instances.map((instance) => (
              <div key={instance.id} className="flex flex-row gap-2">
                <Button asChild variant="secondary">
                  <Link
                    to="/dashboard/$instance/controls"
                    params={{ instance: instance.id }}
                    search={{}}
                  >
                    Instance: {instance.friendlyName} (
                    {getEnumKeyByValue(InstanceState, instance.state)})
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteMutation.mutate(instance.id);
                  }}
                >
                  <TrashIcon className="w-fit h-4" />
                </Button>
              </div>
            ))}
            <Button onClick={() => setCreateOpen(true)}>Create instance</Button>
            <CreateInstancePopup
              open={createOpen}
              setOpen={setCreateOpen}
              onSubmit={(values) => addMutation.mutate(values)}
            />
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
