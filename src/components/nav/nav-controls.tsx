'use client';

import { TerminalIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar.tsx';
import { Link, LinkProps } from '@tanstack/react-router';
import { ReactNode, useContext } from 'react';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';

type NavLinks = {
  title: string;
  icon: (props: {}) => ReactNode;
  linkProps: LinkProps;
}[];

export function NavControls() {
  const instanceInfo = useContext(InstanceInfoContext);

  const navLinks: NavLinks = [
    {
      title: 'Console',
      icon: TerminalIcon,
      linkProps: {
        to: '/dashboard/instance/$instance/console',
        params: { instance: instanceInfo.id },
      },
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Controls</SidebarGroupLabel>
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
      </SidebarMenu>
    </SidebarGroup>
  );
}
