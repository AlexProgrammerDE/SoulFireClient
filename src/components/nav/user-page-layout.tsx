import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { ReactNode, useContext } from 'react';
import { getCookie } from '@/lib/utils.ts';
import { UserSidebar } from '@/components/nav/user-sidebar.tsx';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { TooltipProvider } from '@/components/ui/tooltip.tsx';

export default function UserPageLayout(props: {
  children: ReactNode;
  extraCrumbs?: string[];
  pageName: string;
  showUserCrumb: boolean;
}) {
  const clientInfo = useContext(ClientInfoContext);
  const defaultOpen = getCookie('sidebar:state') === 'true';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <UserSidebar />
      <TooltipProvider delayDuration={500}>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {props.showUserCrumb && (
                    <>
                      <BreadcrumbItem className="hidden md:block">
                        {clientInfo.username}
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                    </>
                  )}
                  {(props.extraCrumbs || []).map((crumb) => (
                    <>
                      <BreadcrumbItem className="hidden md:block">
                        {crumb}
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                    </>
                  ))}
                  <BreadcrumbItem>
                    <BreadcrumbPage>{props.pageName}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <ScrollArea className="h-[calc(100dvh-4rem)] w-full">
            <div className="flex flex-col min-h-[calc(100dvh-4rem)] w-full px-4">
              {props.children}
            </div>
          </ScrollArea>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}
