import * as React from 'react';

import { NavControls } from '@/components/nav/nav-controls.tsx';
import { NavSettings } from '@/components/nav/nav-settings.tsx';
import { NavUserControl } from '@/components/nav/nav-user-control.tsx';
import { NavPlugins } from '@/components/nav/nav-plugins';
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

export function InstanceSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-16">
        <InstanceSwitcher />
      </SidebarHeader>
      <ScrollArea className="h-[calc(100svh-4rem-4rem)] w-full pr-2">
        <SidebarContent className="min-h-[calc(100svh-4rem-4rem)]">
          <NavControls />
          <NavSettings />
          <NavPlugins />
          <NavSecondary className="mt-auto" />
        </SidebarContent>
      </ScrollArea>
      <SidebarFooter className="h-16 justify-center">
        <NavUserControl />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
