import * as React from 'react';
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
import { hasGlobalPermission } from '@/lib/utils.tsx';
import { GlobalPermission } from '@/generated/soulfire/common.ts';
import { NavUserAdmin } from '@/components/nav/nav-user-admin.tsx';
import { useRouteContext } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';

export function UserSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const clientDataQueryOptions = useRouteContext({
    from: '/_dashboard',
    select: (context) => context.clientDataQueryOptions,
  });
  const { data: clientInfo } = useSuspenseQuery(clientDataQueryOptions);

  return (
    <Sidebar collapsible="icon" {...props}>
      <ScrollArea className="h-[calc(100svh-4rem)] w-full pr-2">
        <SidebarContent className="min-h-[calc(100svh-4rem)]">
          <NavUserOptions />
          {hasGlobalPermission(
            clientInfo,
            GlobalPermission.READ_SERVER_CONFIG,
          ) && <NavUserAdmin />}
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
