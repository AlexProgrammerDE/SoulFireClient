import * as React from 'react';
import {
  BookOpenTextIcon,
  CoffeeIcon,
  LifeBuoyIcon,
  type LucideIcon,
} from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar.tsx';

type NavLinks = {
  title: string;
  url: string;
  icon: LucideIcon;
}[];

export function NavSecondary({
  ...props
}: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const items: NavLinks = [
    {
      title: 'Documentation',
      url: 'https://soulfiremc.com/docs',
      icon: BookOpenTextIcon,
    },
    {
      title: 'Buy me a Coffee',
      url: 'https://ko-fi.com/alexprogrammerde',
      icon: CoffeeIcon,
    },
    {
      title: 'Support',
      url: 'https://soulfiremc.com/discord',
      icon: LifeBuoyIcon,
    },
  ];

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild size="sm" tooltip={item.title}>
                <a href={item.url} target="_blank">
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
