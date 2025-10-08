import type * as React from "react";
import { Suspense } from "react";
import { InstanceSwitcher } from "@/components/nav/instance/instance-switcher.tsx";
import { NavControls } from "@/components/nav/instance/nav-controls.tsx";
import { NavPlugins } from "@/components/nav/instance/nav-plugins";
import { NavSettings } from "@/components/nav/instance/nav-settings.tsx";
import { NavAccount } from "@/components/nav/nav-account.tsx";
import { NavDefaultSkeleton } from "@/components/nav/nav-default-skeleton.tsx";
import { NavSecondary } from "@/components/nav/nav-secondary.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar.tsx";

export function InstanceSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-16">
        <InstanceSwitcher />
      </SidebarHeader>
      <ScrollArea className="h-[calc(100svh-4rem-4rem)] w-full pr-2">
        <SidebarContent className="min-h-[calc(100svh-4rem-4rem)]">
          <Suspense fallback={<NavDefaultSkeleton />}>
            <NavControls />
            <NavSettings />
            <NavPlugins />
          </Suspense>
          <NavSecondary className="mt-auto" />
        </SidebarContent>
      </ScrollArea>
      <SidebarFooter className="h-16 justify-center">
        <NavAccount />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
