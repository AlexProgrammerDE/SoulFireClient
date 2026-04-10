import { useSuspenseQuery } from "@tanstack/react-query";
import { CatchBoundary, Link, useRouteContext } from "@tanstack/react-router";
import { BookOpenTextIcon, HomeIcon } from "lucide-react";
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

function InstanceCrumb() {
  const instanceInfoQueryOptions = useRouteContext({
    from: "/_dashboard/instance/$instance",
    select: (context) => context.instanceInfoQueryOptions,
  });
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  return <>{instanceInfo.friendlyName}</>;
}

function InstanceCrumbSkeleton() {
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

export default function InstancePageLayout(props: {
  children: ReactNode;
  extraCrumbs?: { id: string; content: ReactNode }[];
  pageName: ReactNode;
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
            <Separator
              orientation="vertical"
              className="my-auto data-[orientation=vertical]:h-4"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link to="/user">
                <HomeIcon />
                <span className="sr-only">
                  {t("instanceSidebar.backToDashboard")}
                </span>
              </Link>
            </Button>
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
                      {t("instanceSidebar.readDocumentation")}
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
                <BreadcrumbItem className="hidden max-w-64 truncate md:block">
                  <Suspense fallback={<InstanceCrumbSkeleton />}>
                    <InstanceCrumb />
                  </Suspense>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
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
            getResetKey={() => "instance-page-layout"}
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
