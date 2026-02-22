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
      <header className="flex h-12 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="my-auto data-[orientation=vertical]:h-4"
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
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
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <ExternalLink href={props.documentationLink}>
                  <BookOpenTextIcon />
                  <span className="sr-only">
                    {t("instanceSidebar.readDocumentation")}
                  </span>
                </ExternalLink>
              </Button>
            </>
          )}
          <Separator
            orientation="vertical"
            className="mr-2 my-auto data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
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
                <BreadcrumbPage>{props.pageName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto px-4">
          <GlobalQueryIndicator />
        </div>
      </header>
      <ScrollArea className="h-[calc(100dvh-3rem)] w-full max-w-dvw">
        <div className="flex min-h-[calc(100dvh-3rem)] w-full max-w-dvw flex-col p-4">
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
