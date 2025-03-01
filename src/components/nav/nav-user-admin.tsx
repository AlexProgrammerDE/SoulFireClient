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
import DynamicIcon from '@/components/dynamic-icon.tsx';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { useTranslation } from 'react-i18next';

type NavLinks = {
  title: string;
  icon: (props: { className: string }) => ReactNode;
  linkProps: LinkProps;
}[];

export function NavUserAdmin() {
  const { t } = useTranslation('common');
  const clientInfo = useContext(ClientInfoContext);

  const serverSettings = clientInfo.serverSettings.find(
    (settings) => settings.namespace === 'server',
  );
  const devSettings = clientInfo.serverSettings.find(
    (settings) => settings.namespace === 'dev',
  );
  if (!serverSettings || !devSettings) {
    throw new Error(t('settingsPage.namespacesNotFound'));
  }

  const navLinks: NavLinks = [
    {
      title: t('userSidebar.adminOverview'),
      icon: LayoutDashboardIcon,
      linkProps: {
        to: '/dashboard/user/admin/overview',
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
      title: t('userSidebar.serverSettings'),
      icon: (props) => <DynamicIcon {...props} name={serverSettings.iconId} />,
      linkProps: {
        to: '/dashboard/user/admin/settings/$namespace',
        params: { namespace: 'server' },
      },
    },
    {
      title: t('userSidebar.devSettings'),
      icon: (props) => <DynamicIcon {...props} name={devSettings.iconId} />,
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
