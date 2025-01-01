import * as React from 'react';
import { BookOpenTextIcon, CoffeeIcon, LifeBuoyIcon } from 'lucide-react';

import { NavControls } from '@/components/nav/nav-controls.tsx';
import { NavSettings } from '@/components/nav/nav-settings.tsx';
import { NavUserControl } from '@/components/nav/nav-user-control.tsx';
import { InstanceSwitcher } from '@/components/nav/instance-switcher.tsx';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar.tsx';
import { NavSecondary } from '@/components/nav/nav-secondary.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

export function InstanceSidebar({
  expandPluginSettings,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  expandPluginSettings: boolean;
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-16">
        <InstanceSwitcher />
      </SidebarHeader>
      <ScrollArea className="h-[calc(100svh-4rem-4rem)] w-full pr-2">
        <SidebarContent className="min-h-[calc(100svh-4rem-4rem)]">
          <NavControls />
          <NavSettings expandPluginSettings={expandPluginSettings} />
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
      </ScrollArea>
      <SidebarFooter className="h-16 justify-center">
        <NavUserControl />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
