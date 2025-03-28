'use client';

import { Grid2x2Icon, PlusIcon, SettingsIcon, ZapIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar.tsx';
import { Link, LinkProps } from '@tanstack/react-router';
import * as React from 'react';
import { ReactNode, useContext, useState } from 'react';
import { hasGlobalPermission } from '@/lib/utils.tsx';
import { GlobalPermission } from '@/generated/soulfire/common.ts';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { CreateInstancePopup } from '@/components/dialog/create-instance-popup.tsx';
import { useTranslation } from 'react-i18next';

type NavLinks = {
  title: string;
  icon: (props: { className: string }) => ReactNode;
  linkProps: LinkProps;
  createInstance?: boolean;
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
        to: '/user',
        params: {},
      },
      createInstance: true,
    },
    {
      title: t('userSidebar.access'),
      icon: ZapIcon,
      linkProps: {
        to: '/user/access',
        params: {},
      },
    },
    {
      title: t('userSidebar.settings'),
      icon: SettingsIcon,
      linkProps: {
        to: '/user/settings',
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
                activeOptions={{ exact: true }}
                activeProps={{
                  'data-active': true,
                }}
                {...item.linkProps}
              >
                <item.icon className="size-4" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
            {item.createInstance &&
              hasGlobalPermission(
                clientInfo,
                GlobalPermission.CREATE_INSTANCE,
              ) && (
                <>
                  <SidebarMenuAction
                    onClick={() => setCreateOpen(true)}
                    title={t('userSidebar.createInstance')}
                  >
                    <PlusIcon />
                  </SidebarMenuAction>
                  <CreateInstancePopup
                    open={createOpen}
                    setOpen={setCreateOpen}
                  />
                </>
              )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
