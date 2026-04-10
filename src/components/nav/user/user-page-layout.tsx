import { useSuspenseQuery } from "@tanstack/react-query";
import { CatchBoundary, useRouteContext } from "@tanstack/react-router";
import { BookOpenTextIcon } from "lucide-react";
import { type ReactNode, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { ErrorComponent } from "@/components/error-component.tsx";
import { ExternalLink } from "@/components/external-link.tsx";
import { GlobalQueryIndicator } from "@/components/global-query-indicator.tsx";
import { LoadingComponent } from "@/components/loading-component.tsx";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { SidebarTrigger } from "@/components/ui/sidebar.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { WindowTitlebar } from "@/components/window/window-titlebar.tsx";

function UserCrumb() {
  const clientDataQueryOptions = useRouteContext({
    from: "/_dashboard",
    select: (context) => context.clientDataQueryOptions,
  });
  const { data: clientInfo } = useSuspenseQuery(clientDataQueryOptions);
  return <>{clientInfo.username}</>;
}

function UserCrumbSkeleton() {
  return <Skeleton className="h-4 w-24" />;
}

function CrumbComponent(props: { crumb: ReactNode }) {
  return (
    <>
      <BreadcrumbItem className="hidden md:block">{props.crumb}</BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
    </>
  );
}

export default function UserPageLayout(props: {
  children: ReactNode;
  extraCrumbs?: { id: string; content: ReactNode }[];
  pageName: ReactNode;
  showUserCrumb: boolean;
  documentationLink?: string;
  loadingSkeleton?: ReactNode;
}) {
  const { t } = useTranslation("common");

  return (
    <>
      <WindowTitlebar
        leading={
          <>
            <SidebarTrigger className="-ml-1 h-8 w-8" />
            {props.documentationLink && (
              <>
                <Separator
                  orientation="vertical"
                  className="my-auto data-[orientation=vertical]:h-4"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <ExternalLink href={props.documentationLink}>
                    <BookOpenTextIcon />
                    <span className="sr-only">
                      {t("userSidebar.readDocumentation")}
                    </span>
                  </ExternalLink>
                </Button>
              </>
            )}
          </>
        }
        center={
          <div className="window-titlebar-no-drag flex min-w-0 items-center">
            <Breadcrumb>
              <BreadcrumbList className="flex-nowrap">
                {props.showUserCrumb && (
                  <>
                    <BreadcrumbItem className="hidden max-w-64 truncate md:block">
                      <Suspense fallback={<UserCrumbSkeleton />}>
                        <UserCrumb />
                      </Suspense>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                  </>
                )}
                {(props.extraCrumbs || []).map((crumb) => (
                  <CrumbComponent crumb={crumb.content} key={crumb.id} />
                ))}
                <BreadcrumbItem>
                  <BreadcrumbPage className="truncate">
                    {props.pageName}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        }
        trailing={<GlobalQueryIndicator />}
      />
      <ScrollArea
        className="w-full max-w-dvw"
        style={{ height: "calc(100dvh - var(--titlebar-height))" }}
      >
        <div
          className="flex w-full max-w-dvw flex-col p-4"
          style={{ minHeight: "calc(100dvh - var(--titlebar-height))" }}
        >
          <CatchBoundary
            getResetKey={() => "user-page-layout"}
            errorComponent={ErrorComponent}
          >
            <Suspense fallback={props.loadingSkeleton ?? <LoadingComponent />}>
              {props.children}
            </Suspense>
          </CatchBoundary>
        </div>
      </ScrollArea>
    </>
  );
}
