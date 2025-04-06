import * as React from 'react';
import { Suspense } from 'react';
import { NavAccount } from '@/components/nav/nav-account.tsx';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from '@/components/ui/sidebar.tsx';
import { NavSecondary } from '@/components/nav/nav-secondary.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { NavUserOptions } from '@/components/nav/nav-user-options.tsx';
import { NavUserAdmin } from '@/components/nav/nav-user-admin.tsx';
import { NavDefaultSkeleton } from '@/components/nav/nav-default-skeleton.tsx';

export function UserSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <ScrollArea className="h-[calc(100svh-4rem)] w-full pr-2">
        <SidebarContent className="min-h-[calc(100svh-4rem)]">
          <Suspense fallback={<NavDefaultSkeleton />}>
            <NavUserOptions />
            <NavUserAdmin />
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
