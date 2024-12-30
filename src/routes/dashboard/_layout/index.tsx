import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useContext } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { DashboardMenuHeader } from '@/components/dashboard-menu-header.tsx';
import { LayoutDashboardIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { InstanceState } from '@/generated/soulfire/instance.ts';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { getEnumKeyByValue } from '@/lib/types.ts';
import { hasGlobalPermission, hasInstancePermission } from '@/lib/utils.ts';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import {
  GlobalPermission,
  InstancePermission,
} from '@/generated/soulfire/common.ts';
import { InstanceListContext } from '@/components/providers/instance-list-context.tsx';

export const Route = createFileRoute('/dashboard/_layout/')({
  component: InstanceSelectPage,
});

function InstanceSelectPage() {
  const navigate = useNavigate();
  const clientInfo = useContext(ClientInfoContext);
  const instanceList = useContext(InstanceListContext);

  return (
    <>
      <DashboardMenuHeader />
      <ScrollArea className="h-[calc(100dvh-2.5rem)] w-full pr-4">
        <div className="flex flex-col min-h-[calc(100dvh-2.5rem)] w-full">
          <div className="flex flex-col p-4 m-auto gap-4">
            {instanceList.instances.length == 0 && (
              <div className="flex flex-col gap-4 p-4">
                <h1>No instances found</h1>
              </div>
            )}
            {instanceList.instances.map((instance) => (
              <div key={instance.id} className="flex flex-row gap-2">
                <Button asChild variant="secondary">
                  <Link
                    to="/dashboard/instance/$instance/controls"
                    params={{ instance: instance.id }}
                    search={{}}
                  >
                    Instance: {instance.friendlyName} (
                    {getEnumKeyByValue(InstanceState, instance.state)})
                  </Link>
                </Button>
                {hasInstancePermission(
                  instance,
                  InstancePermission.DELETE_INSTANCE,
                ) && (
                  <Button variant="destructive" onClick={() => {}}>
                    <TrashIcon className="w-fit h-4" />
                  </Button>
                )}
              </div>
            ))}
            {hasGlobalPermission(
              clientInfo,
              GlobalPermission.CREATE_INSTANCE,
            ) && (
              <Button variant="secondary" className="flex flex-row gap-1">
                <div>
                  <PlusIcon className="h-4" />
                </div>
                <span>Create instance</span>
              </Button>
            )}
            {hasGlobalPermission(
              clientInfo,
              GlobalPermission.CREATE_INSTANCE,
            ) && (
              <Button
                variant="secondary"
                className="flex flex-row gap-1"
                onClick={() =>
                  void navigate({
                    to: '/dashboard/admin/overview',
                  })
                }
              >
                <div>
                  <LayoutDashboardIcon className="h-4" />
                </div>
                <span>Admin panel</span>
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
