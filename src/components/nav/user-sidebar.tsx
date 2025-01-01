import * as React from 'react';
import { useContext } from 'react';
import { BookOpenTextIcon, CoffeeIcon, LifeBuoyIcon } from 'lucide-react';
import { NavUserControl } from '@/components/nav/nav-user-control.tsx';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from '@/components/ui/sidebar.tsx';
import { NavSecondary } from '@/components/nav/nav-secondary.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { NavUserOptions } from '@/components/nav/nav-user-options.tsx';
import { hasGlobalPermission } from '@/lib/utils.ts';
import { GlobalPermission } from '@/generated/soulfire/common.ts';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { NavUserAdmin } from '@/components/nav/nav-user-admin.tsx';

export function UserSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const clientInfo = useContext(ClientInfoContext);

  return (
    <Sidebar collapsible="icon" {...props}>
      <ScrollArea className="h-[calc(100svh-4rem)] w-full pr-2">
        <SidebarContent className="min-h-[calc(100svh-4rem)]">
          <NavUserOptions />
          {hasGlobalPermission(
            clientInfo,
            GlobalPermission.READ_SERVER_CONFIG,
          ) && <NavUserAdmin />}
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
