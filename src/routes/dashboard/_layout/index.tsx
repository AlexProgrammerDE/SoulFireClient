import { createFileRoute, Link } from '@tanstack/react-router';
import { createTransport } from '@/lib/web-rpc.ts';
import { InstanceServiceClient } from '@/generated/com/soulfiremc/grpc/generated/instance.client.ts';
import { CreateInstancePopup } from '@/components/create-instance-popup.tsx';
import { useContext, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { DashboardMenuHeader } from '@/components/dashboard-menu-header.tsx';
import { TrashIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ServerConnectionContext } from '@/components/providers/server-context.tsx';

export const Route = createFileRoute('/dashboard/_layout/')({
  loader: async (props) => {
    const transport = createTransport();

    const instanceService = new InstanceServiceClient(transport);
    const result = await instanceService.listInstances(
      {},
      {
        abort: props.abortController.signal,
      },
    );

    return {
      instanceList: result.response,
    };
  },
  component: ClientLayout,
});

function ClientLayout() {
  const { instanceList } = Route.useLoaderData();
  const transport = useContext(ServerConnectionContext);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <DashboardMenuHeader />
      <div className="flex justify-center flex-grow">
        <div className="flex flex-col justify-center gap-4">
          {instanceList.instances.length == 0 && (
            <div className="flex flex-col gap-4 p-4">
              <h1>No instances found</h1>
            </div>
          )}
          {instanceList.instances.map((instance) => (
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
                  const instanceService = new InstanceServiceClient(transport);
                  toast.promise(
                    instanceService
                      .deleteInstance({
                        id: instance.id,
                      })
                      .then((r) => r.response),
                    {
                      loading: 'Deleting instance...',
                      success: 'Instance deleted',
                      error: 'Failed to delete instance',
                    },
                  );
                }}
              >
                <TrashIcon className="w-fit h-4" />
              </Button>
            </div>
          ))}
          <Button onClick={() => setCreateOpen(true)}>Create instance</Button>
          <CreateInstancePopup open={createOpen} setOpen={setCreateOpen} />
        </div>
      </div>
    </>
  );
}
