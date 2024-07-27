import { createFileRoute } from '@tanstack/react-router';
import { createTransport } from '@/lib/web-rpc.ts';
import { InstanceServiceClient } from '@/generated/com/soulfiremc/grpc/generated/instance.client.ts';
import { CreateInstancePopup } from '@/components/create-instance-popup.tsx';
import { useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { DashboardMenuHeader } from '@/components/dashboard-menu-header.tsx';

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
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <DashboardMenuHeader />
      <div className="flex justify-center flex-grow">
        <div className="flex flex-col justify-center">
          {instanceList.instances.length == 0 && (
            <div className="flex flex-col gap-4 p-4">
              <h1>No instances found</h1>
            </div>
          )}
          {instanceList.instances.map((instance) => (
            <div key={instance.id} className="flex flex-col gap-4 p-4">
              <h1>{instance.id}</h1>
              <h2>{instance.friendlyName}</h2>
            </div>
          ))}
          <Button onClick={() => setCreateOpen(true)}>Create instance</Button>
          <CreateInstancePopup open={createOpen} setOpen={setCreateOpen} />
        </div>
      </div>
    </>
  );
}
