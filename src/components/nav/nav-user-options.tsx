'use client';

import { Grid2x2Icon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar.tsx';
import { Link, LinkProps } from '@tanstack/react-router';
import { ReactNode } from 'react';

type NavLinks = {
  title: string;
  icon: (props: {}) => ReactNode;
  linkProps: LinkProps;
}[];

export function NavUserOptions() {
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
      </SidebarMenu>
    </SidebarGroup>
  );
}
