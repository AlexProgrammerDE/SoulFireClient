'use client';

import { LayoutDashboardIcon, TerminalIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar.tsx';
import { Link, LinkProps } from '@tanstack/react-router';
import * as React from 'react';
import { ReactNode, useContext } from 'react';
import DynamicIcon, {
  convertUnsafeIconName,
} from '@/components/dynamic-icon.tsx';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';

type NavLinks = {
  title: string;
  icon: (props: {}) => ReactNode;
  linkProps: LinkProps;
}[];

export function NavUserAdmin() {
  const clientInfo = useContext(ClientInfoContext);

  const serverSettings = clientInfo.serverSettings.find(
    (settings) => settings.namespace === 'server',
  );
  const devSettings = clientInfo.serverSettings.find(
    (settings) => settings.namespace === 'dev',
  );
  if (!serverSettings || !devSettings) {
    throw new Error('Namespaces missing');
  }

  const navLinks: NavLinks = [
    {
      title: 'Overview',
      icon: LayoutDashboardIcon,
      linkProps: {
        to: '/dashboard/admin/overview',
        params: {},
      },
    },
    {
      title: 'Admin Console',
      icon: TerminalIcon,
      linkProps: {
        to: '/dashboard/admin/console',
        params: {},
      },
    },
    {
      title: 'Server Settings',
      icon: (props) => (
        <DynamicIcon
          {...props}
          name={convertUnsafeIconName(serverSettings.iconId)}
        />
      ),
      linkProps: {
        to: '/dashboard/admin/settings/$namespace',
        params: { namespace: 'server' },
      },
    },
    {
      title: 'Dev Settings',
      icon: (props) => (
        <DynamicIcon
          {...props}
          name={convertUnsafeIconName(devSettings.iconId)}
        />
      ),
      linkProps: {
        to: '/dashboard/admin/settings/$namespace',
        params: { namespace: 'dev' },
      },
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin</SidebarGroupLabel>
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
      </SidebarMenu>
    </SidebarGroup>
  );
}
