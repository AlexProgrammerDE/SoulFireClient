import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouteContext,
} from "@tanstack/react-router";
import {
  ClipboardCopyIcon,
  ExternalLinkIcon,
  PlusIcon,
  SearchXIcon,
  TrashIcon,
} from "lucide-react";
import { use } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ContextMenuPortal } from "@/components/context-menu-portal.tsx";
import {
  MenuItem,
  MenuSeparator,
} from "@/components/context-menu-primitives.tsx";
import { CreateInstanceContext } from "@/components/dialog/create-instance-dialog.tsx";
import DynamicIcon from "@/components/dynamic-icon.tsx";
import UserPageLayout from "@/components/nav/user/user-page-layout.tsx";
import { TransportContext } from "@/components/providers/transport-context.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardDescription, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { GlobalPermission } from "@/generated/soulfire/common.ts";
import { InstanceServiceClient } from "@/generated/soulfire/instance.client.ts";
import type { InstanceListResponse_Instance } from "@/generated/soulfire/instance.ts";
import { useContextMenu } from "@/hooks/use-context-menu.ts";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard.ts";
import { translateInstanceState } from "@/lib/types.ts";
import { hasGlobalPermission } from "@/lib/utils.tsx";

export const Route = createFileRoute("/_dashboard/user/")({
  component: InstanceSelectPage,
});

function InstanceCardSkeleton() {
  return (
    <div className="flex w-full flex-row items-center gap-4 rounded-lg border px-6 py-4">
      <Skeleton className="size-12 rounded-lg" />
      <div className="flex grow flex-col gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-8 w-8" />
    </div>
  );
}

function InstanceListSkeleton() {
  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list
        <InstanceCardSkeleton key={i} />
      ))}
    </div>
  );
}

function InstanceSelectPage() {
  const { t } = useTranslation("common");

  return (
    <UserPageLayout
      showUserCrumb={true}
      pageName={t("pageName.instances")}
      loadingSkeleton={<InstanceListSkeleton />}
    >
      <Content />
    </UserPageLayout>
  );
}

function Content() {
  const { t, i18n } = useTranslation("common");
  const { instanceListQueryOptions } = Route.useRouteContext();
  const { data: instanceList } = useSuspenseQuery(instanceListQueryOptions);
  const navigate = useNavigate();
  const transport = use(TransportContext);
  const queryClient = useQueryClient();
  const { contextMenu, handleContextMenu, dismiss, menuRef } =
    useContextMenu<InstanceListResponse_Instance>();
  const copyToClipboard = useCopyToClipboard();

  const deleteMutation = useMutation({
    mutationKey: ["instance", "delete"],
    mutationFn: async (instanceId: string) => {
      if (transport === null) return;
      const instanceService = new InstanceServiceClient(transport);
      const promise = instanceService
        .deleteInstance({ id: instanceId })
        .then((r) => r.response);
      toast.promise(promise, {
        loading: t("instanceSidebar.deleteToast.loading"),
        success: t("instanceSidebar.deleteToast.success"),
        error: (e) => {
          console.error(e);
          return t("instanceSidebar.deleteToast.error");
        },
      });
      return promise;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceListQueryOptions.queryKey,
      });
    },
  });

  return (
    <>
      {instanceList.instances.length === 0 ? (
        <div className="flex size-full flex-1">
          <div className="m-auto flex flex-col items-center gap-4">
            <div className="flex flex-row gap-2">
              <SearchXIcon className="m-auto size-7" />
              <h1 className="m-auto text-xl font-bold">
                {t("noInstancesFound")}
              </h1>
            </div>
            <CreateInstanceButton />
          </div>
        </div>
      ) : (
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
          {instanceList.instances.map((instance, index) => (
            <Link
              key={instance.id}
              to="/instance/$instance"
              params={{ instance: instance.id }}
              search={{}}
              className="max-h-fit w-full"
              onContextMenu={(e) => handleContextMenu(e, instance)}
            >
              <Card className="flex w-full flex-row items-center gap-4 px-6">
                <div className="shrink-0 pr-0">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-12 items-center justify-center rounded-lg">
                    <DynamicIcon
                      name={instance.icon}
                      className="size-8 shrink-0"
                    />
                  </div>
                </div>
                <div className="grow">
                  <CardTitle className="max-w-64 truncate">
                    {instance.friendlyName}
                  </CardTitle>
                  <CardDescription className="font-semibold">
                    {translateInstanceState(i18n, instance.state)}
                  </CardDescription>
                </div>
                <div className="ml-auto shrink-0">
                  <p className="mb-auo m-auto text-2xl tracking-widest opacity-60">
                    ⌘{index + 1}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
      {contextMenu && (
        <ContextMenuPortal
          x={contextMenu.position.x}
          y={contextMenu.position.y}
          menuRef={menuRef}
        >
          <MenuItem
            onClick={() => {
              void navigate({
                to: "/instance/$instance",
                params: { instance: contextMenu.data.id },
              });
              dismiss();
            }}
          >
            <ExternalLinkIcon />
            {t("contextMenu.instance.goToInstance")}
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            onClick={() => {
              copyToClipboard(contextMenu.data.friendlyName);
              dismiss();
            }}
          >
            <ClipboardCopyIcon />
            {t("contextMenu.instance.copyInstanceName")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              copyToClipboard(contextMenu.data.id);
              dismiss();
            }}
          >
            <ClipboardCopyIcon />
            {t("contextMenu.instance.copyInstanceId")}
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            variant="destructive"
            onClick={() => {
              deleteMutation.mutate(contextMenu.data.id);
              dismiss();
            }}
          >
            <TrashIcon />
            {t("contextMenu.instance.deleteInstance")}
          </MenuItem>
        </ContextMenuPortal>
      )}
    </>
  );
}

function CreateInstanceButton() {
  const { t } = useTranslation("common");
  const clientDataQueryOptions = useRouteContext({
    from: "/_dashboard",
    select: (context) => context.clientDataQueryOptions,
  });
  const { data: clientInfo } = useSuspenseQuery(clientDataQueryOptions);
  const { openCreateInstance } = use(CreateInstanceContext);

  if (!hasGlobalPermission(clientInfo, GlobalPermission.CREATE_INSTANCE)) {
    return null;
  }

  return (
    <Button onClick={openCreateInstance} variant="outline" className="w-fit">
      <PlusIcon className="size-4" />
      {t("instanceSidebar.createInstance")}
    </Button>
  );
}
