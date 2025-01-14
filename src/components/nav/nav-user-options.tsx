'use client';

import { Grid2x2Icon, PlusIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar.tsx';
import { Link, LinkProps } from '@tanstack/react-router';
import * as React from 'react';
import { ReactNode, useContext, useState } from 'react';
import { hasGlobalPermission } from '@/lib/utils';
import { GlobalPermission } from '@/generated/soulfire/common.ts';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { CreateInstancePopup } from '@/components/dialog/create-instance-popup.tsx';
import { useTranslation } from 'react-i18next';

type NavLinks = {
  title: string;
  icon: (props: {}) => ReactNode;
  linkProps: LinkProps;
}[];

export function NavUserOptions() {
  const { t } = useTranslation('common');
  const clientInfo = useContext(ClientInfoContext);
  const [createOpen, setCreateOpen] = useState(false);

  const navLinks: NavLinks = [
    {
      title: t('userSidebar.instances'),
      icon: Grid2x2Icon,
      linkProps: {
        to: '/dashboard/user/instances',
        params: {},
      },
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('userSidebar.userGroup')}</SidebarGroupLabel>
      <SidebarMenu>
        {navLinks.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <Link
                activeProps={{
                  'data-active': true,
                }}
                {...item.linkProps}
              >
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
              tooltip={t('userSidebar.createInstance')}
            >
              <PlusIcon />
              <span>{t('userSidebar.createInstance')}</span>
            </SidebarMenuButton>
            <CreateInstancePopup open={createOpen} setOpen={setCreateOpen} />
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
