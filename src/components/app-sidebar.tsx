import * as React from 'react';
import { BookOpenTextIcon, CoffeeIcon, LifeBuoyIcon } from 'lucide-react';

import { NavControls } from '@/components/nav-controls.tsx';
import { NavSettings } from '@/components/nav-settings.tsx';
import { NavUser } from '@/components/nav-user';
import { InstanceSwitcher } from '@/components/instance-switcher.tsx';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { NavSecondary } from '@/components/nav-secondary.tsx';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <InstanceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavControls />
        <NavSettings />
        <NavSecondary
          items={[
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
          ]}
          className="mt-auto"
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
