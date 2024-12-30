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
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { AppSidebar } from '@/components/app-sidebar.tsx';

export default function InstancePageLayout(props: {
  children: ReactNode;
  extraCrumbs?: string[];
  pageName: string;
  expandPluginSettings?: boolean;
}) {
  const instanceInfo = useContext(InstanceInfoContext);

  return (
    <SidebarProvider>
      <AppSidebar expandPluginSettings={props.expandPluginSettings ?? false} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  {instanceInfo.friendlyName}
                </BreadcrumbItem>
                {(props.extraCrumbs || []).map((crumb) => (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem className="hidden md:block">
                      {crumb}
                    </BreadcrumbItem>
                  </>
                ))}
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{props.pageName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <ScrollArea className="h-[calc(100dvh-4rem)] w-full px-4">
          <div className="flex flex-col min-h-[calc(100dvh-4rem)] w-full">
            {props.children}
          </div>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
