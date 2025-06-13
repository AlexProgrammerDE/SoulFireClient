'use client';

import { TerminalIcon, TextSearchIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar.tsx';
import { Link, LinkProps, useRouteContext } from '@tanstack/react-router';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSuspenseQuery } from '@tanstack/react-query';

type NavLinks = {
  title: string;
  icon: (props: { className: string }) => ReactNode;
  linkProps: LinkProps;
}[];

export function NavControls() {
  const { t } = useTranslation('common');
  const instanceInfoQueryOptions = useRouteContext({
    from: '/_dashboard/instance/$instance',
    select: (context) => context.instanceInfoQueryOptions,
  });
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);

  const navLinks: NavLinks = [
    {
      title: t('instanceSidebar.console'),
      icon: TerminalIcon,
      linkProps: {
        to: '/instance/$instance',
        params: { instance: instanceInfo.id },
      },
    },
    {
      title: t('instanceSidebar.audit-log'),
      icon: TextSearchIcon,
      linkProps: {
        to: '/instance/$instance/audit-log',
        params: { instance: instanceInfo.id },
      },
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        {t('instanceSidebar.controlsGroup')}
      </SidebarGroupLabel>
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
