import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createTransport } from '@/lib/web-rpc.ts';
import { InstanceServiceClient } from '@/generated/com/soulfiremc/grpc/generated/instance.client.ts';
import {
  CreateInstancePopup,
  CreateInstanceType,
} from '@/components/create-instance-popup.tsx';
import { useContext, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { DashboardMenuHeader } from '@/components/dashboard-menu-header.tsx';
import { TrashIcon } from 'lucide-react';
import { toast } from 'sonner';
import { TransportContext } from '@/components/providers/server-context.tsx';
import { queryClient } from '@/lib/query.ts';
import { useMutation, useQuery } from '@tanstack/react-query';

const listQueryFn = async ({ signal }: { signal: AbortSignal }) => {
  const transport = createTransport();

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
    await queryClient.prefetchQuery(props.context.listQueryOptions);
  },
  component: ClientLayout,
});

function ClientLayout() {
  const navigate = useNavigate();
  const { listQueryOptions } = Route.useRouteContext();
  const instanceList = useQuery(listQueryOptions);
  const transport = useContext(TransportContext);
  const [createOpen, setCreateOpen] = useState(false);
  const addMutation = useMutation({
    mutationFn: async (values: CreateInstanceType) => {
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
            to: '/dashboard/$instance',
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
      const instanceService = new InstanceServiceClient(transport);
      const promise = instanceService
        .deleteInstance({
          id: instanceId,
        })
        .then((r) => r.response);
      toast.promise(promise, {
        loading: 'Deleting instance...',
        success: 'Instance deleted',
        error: 'Failed to delete instance',
      });

      return promise;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: listQueryOptions.queryKey,
      });
    },
  });

  if (!instanceList.data) {
    throw instanceList.error;
  }

  return (
    <>
      <DashboardMenuHeader />
      <div className="flex justify-center flex-grow">
        <div className="flex flex-col justify-center gap-4">
          {instanceList.data.instanceList.instances.length == 0 && (
            <div className="flex flex-col gap-4 p-4">
              <h1>No instances found</h1>
            </div>
          )}
          {instanceList.data.instanceList.instances.map((instance) => (
            <div key={instance.id} className="flex flex-row gap-2">
              <Button asChild variant="secondary">
                <Link
                  to="/dashboard/$instance"
                  params={{ instance: instance.id }}
                >
                  Instance: {instance.friendlyName}
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
    </>
  );
}
