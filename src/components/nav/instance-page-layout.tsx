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
import { InstanceSidebar } from '@/components/nav/instance-sidebar.tsx';
import { TooltipProvider } from '@/components/ui/tooltip.tsx';
import { Button } from '@/components/ui/button.tsx';
import { BookOpenTextIcon, HomeIcon } from 'lucide-react';
import { CatchBoundary, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ErrorComponent } from '@/components/error-component.tsx';

export default function InstancePageLayout(props: {
  children: ReactNode;
  extraCrumbs?: string[];
  pageName: string;
  documentationLink?: string;
}) {
  const { t } = useTranslation('common');
  const instanceInfo = useContext(InstanceInfoContext);
  const defaultOpen = localStorage.getItem('sidebar:state') === 'true';

  const CrumbComponent = (props: { crumb: string }) => (
    <>
      <BreadcrumbItem className="hidden md:block">{props.crumb}</BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
    </>
  );

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <InstanceSidebar />
      <TooltipProvider delayDuration={500}>
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4" />
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <Link to="/dashboard/user/instances">
                  <HomeIcon />
                  <span className="sr-only">
                    {t('instanceSidebar.backToDashboard')}
                  </span>
                </Link>
              </Button>
              {props.documentationLink && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    asChild
                  >
                    <a href={props.documentationLink} target="_blank">
                      <BookOpenTextIcon />
                      <span className="sr-only">
                        {t('instanceSidebar.readDocumentation')}
                      </span>
                    </a>
                  </Button>
                </>
              )}
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    {instanceInfo.friendlyName}
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  {(props.extraCrumbs || []).map((crumb) => (
                    <CrumbComponent crumb={crumb} key={crumb} />
                  ))}
                  <BreadcrumbItem>
                    <BreadcrumbPage>{props.pageName}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <ScrollArea className="h-[calc(100dvh-3rem)] w-full">
            <div className="flex flex-col min-h-[calc(100dvh-3rem)] w-full p-4">
              <CatchBoundary
                getResetKey={() => 'instance-page-layout'}
                errorComponent={ErrorComponent}
              >
                {props.children}
              </CatchBoundary>
            </div>
          </ScrollArea>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}
