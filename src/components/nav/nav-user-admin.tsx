'use client';

import {
  BugIcon,
  ChartAreaIcon,
  ServerIcon,
  TerminalIcon,
  UsersIcon,
} from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar.tsx';
import { Link, LinkProps } from '@tanstack/react-router';
import * as React from 'react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type NavLinks = {
  title: string;
  icon: (props: { className: string }) => ReactNode;
  linkProps: LinkProps;
}[];

export function NavUserAdmin() {
  const { t } = useTranslation('common');

  const navLinks: NavLinks = [
    {
      title: t('userSidebar.adminOverview'),
      icon: ChartAreaIcon,
      linkProps: {
        to: '/dashboard/user/admin',
        params: {},
      },
    },
    {
      title: t('userSidebar.adminConsole'),
      icon: TerminalIcon,
      linkProps: {
        to: '/dashboard/user/admin/console',
        params: {},
      },
    },
    {
      title: t('userSidebar.users'),
      icon: UsersIcon,
      linkProps: {
        to: '/dashboard/user/admin/users',
        params: {},
      },
    },
    {
      title: t('userSidebar.serverSettings'),
      icon: ServerIcon,
      linkProps: {
        to: '/dashboard/user/admin/settings/$namespace',
        params: { namespace: 'server' },
      },
    },
    {
      title: t('userSidebar.devSettings'),
      icon: BugIcon,
      linkProps: {
        to: '/dashboard/user/admin/settings/$namespace',
        params: { namespace: 'dev' },
      },
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('userSidebar.adminGroup')}</SidebarGroupLabel>
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
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
