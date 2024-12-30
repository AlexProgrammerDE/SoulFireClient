import * as React from 'react';
import { useContext, useState } from 'react';
import { ChevronsUpDown, GalleryVerticalEndIcon, Plus } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { InstanceListContext } from '@/components/providers/instance-list-context.tsx';
import { getEnumKeyByValue } from '@/lib/types.ts';
import { InstanceState } from '@/generated/soulfire/instance.ts';
import { useNavigate } from '@tanstack/react-router';
import { toCapitalizedWords } from '@/lib/utils.ts';
import {
  CreateInstancePopup,
  CreateInstanceType,
} from '@/components/create-instance-popup.tsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { toast } from 'sonner';
import { listQueryKey } from '@/routes/dashboard/_layout.tsx';
import { TransportContext } from '@/components/providers/transport-context.tsx';

export function InstanceSwitcher() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const transport = useContext(TransportContext);
  const { isMobile } = useSidebar();
  const instanceInfo = useContext(InstanceInfoContext);
  const instanceList = useContext(InstanceListContext);
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
            to: '/dashboard/instance/$instance/controls',
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
        queryKey: listQueryKey,
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
        queryKey: listQueryKey,
      });
    },
  });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GalleryVerticalEndIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {instanceInfo.friendlyName}
                </span>
                <span className="truncate text-xs">
                  {toCapitalizedWords(
                    getEnumKeyByValue(InstanceState, instanceInfo.state),
                  )}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Instances
            </DropdownMenuLabel>
            {instanceList.instances.map((instance, index) => (
              <DropdownMenuItem
                key={instance.id}
                onClick={() =>
                  void navigate({
                    to: '/dashboard/instance/$instance/controls',
                    params: { instance: instance.id },
                  })
                }
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <GalleryVerticalEndIcon className="size-4 shrink-0" />
                </div>
                {instance.friendlyName}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setCreateOpen(true)}
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Add instance
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <CreateInstancePopup
          open={createOpen}
          setOpen={setCreateOpen}
          onSubmit={(values) => addMutation.mutate(values)}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
