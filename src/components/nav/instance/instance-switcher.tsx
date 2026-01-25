import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import { appConfigDir, resolve } from "@tauri-apps/api/path";
import { open, save } from "@tauri-apps/plugin-dialog";
import { mkdir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { saveAs } from "file-saver";
import {
  ChevronsUpDownIcon,
  DownloadIcon,
  FileIcon,
  FolderIcon,
  HomeIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
} from "lucide-react";
import { Suspense, use, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CreateInstanceContext } from "@/components/dialog/create-instance-dialog.tsx";
import DynamicIcon from "@/components/dynamic-icon.tsx";
import { SystemInfoContext } from "@/components/providers/system-info-context.tsx";
import { TransportContext } from "@/components/providers/transport-context.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  GlobalPermission,
  InstancePermission,
} from "@/generated/soulfire/common.ts";
import { InstanceServiceClient } from "@/generated/soulfire/instance.client.ts";
import { type ProfileRoot, translateInstanceState } from "@/lib/types.ts";
import {
  data2blob,
  hasGlobalPermission,
  hasInstancePermission,
  isTauri,
  runAsync,
  setInstanceConfigFull,
} from "@/lib/utils.tsx";

function SidebarInstanceButton() {
  const { i18n } = useTranslation("common");
  const instanceInfoQueryOptions = useRouteContext({
    from: "/_dashboard/instance/$instance",
    select: (context) => context.instanceInfoQueryOptions,
  });
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);

  const capitalizedState = translateInstanceState(i18n, instanceInfo.state);
  return (
    <DropdownMenuTrigger asChild>
      <SidebarMenuButton
        size="lg"
        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        tooltip={`${instanceInfo.friendlyName} | ${capitalizedState}`}
      >
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
          <DynamicIcon name={instanceInfo.icon} className="size-4" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="max-w-64 truncate font-semibold">
            {instanceInfo.friendlyName}
          </span>
          <span className="truncate text-xs">{capitalizedState}</span>
        </div>
        <ChevronsUpDownIcon className="ml-auto" />
      </SidebarMenuButton>
    </DropdownMenuTrigger>
  );
}

function SidebarInstanceButtonSkeleton() {
  return (
    <DropdownMenuTrigger asChild>
      <SidebarMenuButton
        size="lg"
        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
      >
        <Skeleton className="relative flex size-8 h-10 w-10 shrink-0 overflow-hidden rounded-lg" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-12" />
        </div>
        <ChevronsUpDownIcon className="ml-auto" />
      </SidebarMenuButton>
    </DropdownMenuTrigger>
  );
}

function InstanceList() {
  const instanceListQueryOptions = useRouteContext({
    from: "/_dashboard",
    select: (context) => context.instanceListQueryOptions,
  });
  const { data: instanceList } = useSuspenseQuery(instanceListQueryOptions);

  return (
    <>
      {instanceList.instances.map((instance, index) => {
        return (
          <DropdownMenuItem key={instance.id} asChild>
            <Link to="/instance/$instance" params={{ instance: instance.id }}>
              <DynamicIcon name={instance.icon} className="size-4 shrink-0" />
              {instance.friendlyName}
              <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
        );
      })}
    </>
  );
}

function InstanceListSkeleton() {
  return (
    <DropdownMenuItem>
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-3 w-32" />
    </DropdownMenuItem>
  );
}

function InstanceActionButtons() {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const transport = use(TransportContext);
  const instanceInfoQueryOptions = useRouteContext({
    from: "/_dashboard/instance/$instance",
    select: (context) => context.instanceInfoQueryOptions,
  });
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const { data: profile } = useSuspenseQuery({
    ...instanceInfoQueryOptions,
    select: (info) => info.profile,
  });
  const systemInfo = use(SystemInfoContext);
  const instanceProfileInputRef = useRef<HTMLInputElement>(null);
  // Using setInstanceConfigFull for profile import
  const setProfileMutation = useMutation({
    mutationKey: ["instance", "profile", "import", instanceInfo.id],
    mutationFn: async (profile: ProfileRoot) => {
      await setInstanceConfigFull(
        profile,
        instanceInfo,
        transport,
        queryClient,
        instanceInfoQueryOptions.queryKey,
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
      });
    },
  });

  return (
    <>
      <DropdownMenuLabel className="text-muted-foreground max-w-64 truncate text-xs">
        {instanceInfo.friendlyName}
      </DropdownMenuLabel>
      {isTauri() && systemInfo ? (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <UploadIcon className="size-4" />
            {t("instanceSidebar.loadProfile")}
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {systemInfo.availableProfiles.length > 0 && (
                <>
                  {systemInfo.availableProfiles.map((file) => (
                    <DropdownMenuItem
                      key={file}
                      onClick={() => {
                        const loadProfile = async () => {
                          const data = await readTextFile(
                            await resolve(
                              await resolve(await appConfigDir(), "profile"),
                              file,
                            ),
                          );

                          await setProfileMutation.mutateAsync(
                            JSON.parse(data) as ProfileRoot,
                          );
                        };
                        toast.promise(loadProfile(), {
                          loading: t(
                            "instanceSidebar.loadProfileToast.loading",
                          ),
                          success: t(
                            "instanceSidebar.loadProfileToast.success",
                          ),
                          error: (e) => {
                            console.error(e);
                            return t("instanceSidebar.loadProfileToast.error");
                          },
                        });
                      }}
                    >
                      <FileIcon className="size-4" />
                      {file}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => {
                  runAsync(async () => {
                    const profileDir = await resolve(
                      await appConfigDir(),
                      "profile",
                    );
                    await mkdir(profileDir, { recursive: true });

                    const selected = await open({
                      title: t("instanceSidebar.loadProfile"),
                      filters: systemInfo.mobile
                        ? undefined
                        : [
                            {
                              name: "SoulFire JSON Profile",
                              extensions: ["json"],
                            },
                          ],
                      defaultPath: profileDir,
                      multiple: false,
                      directory: false,
                    });

                    if (selected) {
                      const data = await readTextFile(selected);
                      toast.promise(
                        (async () => {
                          await setProfileMutation.mutateAsync(
                            JSON.parse(data) as ProfileRoot,
                          );
                        })(),
                        {
                          loading: t(
                            "instanceSidebar.loadProfileToast.loading",
                          ),
                          success: t(
                            "instanceSidebar.loadProfileToast.success",
                          ),
                          error: (e) => {
                            console.error(e);
                            return t("instanceSidebar.loadProfileToast.error");
                          },
                        },
                      );
                    }
                  });
                }}
              >
                <FolderIcon className="size-4" />
                {t("instanceSidebar.loadFromFile")}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      ) : (
        <>
          <input
            ref={instanceProfileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onInput={(e) => {
              const file = (e.target as HTMLInputElement).files?.item(0);
              if (!file) return;

              const reader = new FileReader();
              reader.onload = () => {
                const data = reader.result as string;
                toast.promise(
                  setProfileMutation.mutateAsync(
                    JSON.parse(data) as ProfileRoot,
                  ),
                  {
                    loading: t("instanceSidebar.loadProfileToast.loading"),
                    success: t("instanceSidebar.loadProfileToast.success"),
                    error: (e) => {
                      console.error(e);
                      return t("instanceSidebar.loadProfileToast.error");
                    },
                  },
                );
              };
              reader.readAsText(file);
            }}
          />
          <DropdownMenuItem
            onClick={() => {
              instanceProfileInputRef.current?.click();
            }}
          >
            <UploadIcon className="size-4" />
            {t("instanceSidebar.loadProfile")}
          </DropdownMenuItem>
        </>
      )}
      <DropdownMenuItem
        onClick={() => {
          const data = JSON.stringify(profile, null, 2);
          if (isTauri()) {
            runAsync(async () => {
              const profileDir = await resolve(await appConfigDir(), "profile");
              await mkdir(profileDir, { recursive: true });

              let selected = await save({
                title: t("instanceSidebar.saveProfile"),
                filters: [
                  {
                    name: "SoulFire JSON Profile",
                    extensions: ["json"],
                  },
                ],
                defaultPath: profileDir,
              });

              if (selected) {
                if (!selected.endsWith(".json")) {
                  selected += ".json";
                }

                await writeTextFile(selected, data);
              }
            });
          } else {
            saveAs(data2blob(data), "profile.json");
          }

          toast.success(t("instanceSidebar.profileSaved"));
        }}
      >
        <DownloadIcon className="size-4" />
        {t("instanceSidebar.saveProfile")}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  );
}

function InstanceActionButtonsSkeleton() {
  return (
    <>
      <DropdownMenuLabel className="text-muted-foreground max-w-64 truncate text-xs">
        <Skeleton className="h-3 w-32" />
      </DropdownMenuLabel>
      <DropdownMenuItem>
        <Skeleton className="h-4 w-4" />

        <Skeleton className="h-3 w-32" />
      </DropdownMenuItem>
    </>
  );
}

export function InstanceSwitcher() {
  const { t } = useTranslation("common");
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <Suspense fallback={<SidebarInstanceButtonSkeleton />}>
            <SidebarInstanceButton />
          </Suspense>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {t("instanceSidebar.instancesGroup")}
            </DropdownMenuLabel>
            <Suspense fallback={<InstanceListSkeleton />}>
              <InstanceList />
            </Suspense>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/user">
                <HomeIcon className="size-4" />
                {t("instanceSidebar.backToDashboard")}
              </Link>
            </DropdownMenuItem>
            <Suspense>
              <CreateInstanceButton />
            </Suspense>
            <DropdownMenuSeparator />
            <Suspense fallback={<InstanceActionButtonsSkeleton />}>
              <InstanceActionButtons />
            </Suspense>
            <Suspense>
              <DeleteInstanceButton />
            </Suspense>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
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
    <DropdownMenuItem onClick={openCreateInstance}>
      <PlusIcon className="size-4" />
      {t("instanceSidebar.createInstance")}
    </DropdownMenuItem>
  );
}

function DeleteInstanceButton() {
  const { t } = useTranslation("common");
  const instanceListQueryOptions = useRouteContext({
    from: "/_dashboard",
    select: (context) => context.instanceListQueryOptions,
  });
  const instanceInfoQueryOptions = useRouteContext({
    from: "/_dashboard/instance/$instance",
    select: (context) => context.instanceInfoQueryOptions,
  });
  const transport = use(TransportContext);
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationKey: ["instance", "delete"],
    mutationFn: async (instanceId: string) => {
      if (transport === null) {
        return;
      }

      const instanceService = new InstanceServiceClient(transport);
      const promise = instanceService
        .deleteInstance({
          id: instanceId,
        })
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

  if (
    !hasInstancePermission(instanceInfo, InstancePermission.DELETE_INSTANCE)
  ) {
    return null;
  }

  return (
    <DropdownMenuItem
      onClick={() => {
        deleteMutation.mutate(instanceInfo.id);
        void navigate({
          to: "/user",
        });
      }}
    >
      <TrashIcon className="size-4" />
      {t("instanceSidebar.deleteInstance")}
    </DropdownMenuItem>
  );
}
