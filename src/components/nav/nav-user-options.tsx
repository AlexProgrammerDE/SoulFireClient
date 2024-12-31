'use client';

import { Grid2x2Icon, PlusIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar.tsx';
import { Link, LinkProps, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { ReactNode, useContext, useState } from 'react';
import { hasGlobalPermission } from '@/lib/utils';
import { GlobalPermission } from '@/generated/soulfire/common.ts';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateInstancePopup,
  CreateInstanceType,
} from '@/components/dialog/create-instance-popup.tsx';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { toast } from 'sonner';
import { listQueryKey } from '@/routes/dashboard/_layout.tsx';
import { TransportContext } from '@/components/providers/transport-context.tsx';

type NavLinks = {
  title: string;
  icon: (props: {}) => ReactNode;
  linkProps: LinkProps;
}[];

export function NavUserOptions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const transport = useContext(TransportContext);
  const clientInfo = useContext(ClientInfoContext);
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
          setCreateOpen(false);
          void navigate({
            to: '/dashboard/instance/$instance/console',
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

  const navLinks: NavLinks = [
    {
      title: 'Instances',
      icon: Grid2x2Icon,
      linkProps: {
        to: '/dashboard',
        params: {},
      },
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>User</SidebarGroupLabel>
      <SidebarMenu>
        {navLinks.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <Link {...item.linkProps}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        {hasGlobalPermission(clientInfo, GlobalPermission.CREATE_INSTANCE) && (
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setCreateOpen(true)}
              tooltip="Create Instance"
            >
              <PlusIcon />
              <span>Create Instance</span>
            </SidebarMenuButton>
            <CreateInstancePopup
              open={createOpen}
              setOpen={setCreateOpen}
              onSubmit={(values) => addMutation.mutate(values)}
            />
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
