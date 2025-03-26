import { SidebarTrigger } from '@/components/ui/sidebar.tsx';
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
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { BookOpenTextIcon } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { useTranslation } from 'react-i18next';
import { CatchBoundary } from '@tanstack/react-router';
import { ErrorComponent } from '@/components/error-component.tsx';

export default function UserPageLayout(props: {
  children: ReactNode;
  extraCrumbs?: string[];
  pageName: string;
  showUserCrumb: boolean;
  documentationLink?: string;
}) {
  const { t } = useTranslation('common');
  const clientInfo = useContext(ClientInfoContext);

  const CrumbComponent = (props: { crumb: string }) => (
    <>
      <BreadcrumbItem className="hidden md:block">{props.crumb}</BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
    </>
  );

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          {props.documentationLink && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <a href={props.documentationLink} target="_blank">
                  <BookOpenTextIcon />
                  <span className="sr-only">
                    {t('userSidebar.readDocumentation')}
                  </span>
                </a>
              </Button>
            </>
          )}
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {props.showUserCrumb && (
                <>
                  <BreadcrumbItem className="hidden max-w-64 truncate md:block">
                    {clientInfo.username}
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                </>
              )}
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
        <div className="flex min-h-[calc(100dvh-3rem)] w-full flex-col p-4">
          <CatchBoundary
            getResetKey={() => 'user-page-layout'}
            errorComponent={ErrorComponent}
          >
            {props.children}
          </CatchBoundary>
        </div>
      </ScrollArea>
    </>
  );
}
