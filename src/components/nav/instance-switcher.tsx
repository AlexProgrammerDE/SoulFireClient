import * as React from 'react';
import { useContext, useRef, useState } from 'react';
import {
  ChevronsUpDownIcon,
  DownloadIcon,
  FileIcon,
  FolderIcon,
  HomeIcon,
  MinusIcon,
  PlusIcon,
  UploadIcon,
} from 'lucide-react';
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
} from '@/components/ui/dropdown-menu.tsx';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { InstanceListContext } from '@/components/providers/instance-list-context.tsx';
import {
  convertToInstanceProto,
  ProfileRoot,
  translateInstanceState,
} from '@/lib/types.ts';
import { Link, useNavigate, useRouteContext } from '@tanstack/react-router';
import {
  data2blob,
  hasGlobalPermission,
  hasInstancePermission,
  isTauri,
  runAsync,
} from '@/lib/utils.tsx';
import { CreateInstancePopup } from '@/components/dialog/create-instance-popup.tsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { toast } from 'sonner';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { appConfigDir, resolve } from '@tauri-apps/api/path';
import { open, save } from '@tauri-apps/plugin-dialog';
import { saveAs } from 'file-saver';
import { ProfileContext } from '@/components/providers/profile-context.tsx';
import { SystemInfoContext } from '@/components/providers/system-info-context.tsx';
import {
  GlobalPermission,
  InstancePermission,
} from '@/generated/soulfire/common.ts';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import DynamicIcon from '@/components/dynamic-icon.tsx';
import { useTranslation } from 'react-i18next';

export function InstanceSwitcher() {
  const { t, i18n } = useTranslation('common');
  const instanceListQueryOptions = useRouteContext({
    from: '/dashboard',
    select: (context) => context.instanceListQueryOptions,
  });
  const instanceInfoQueryOptions = useRouteContext({
    from: '/dashboard/instance/$instance',
    select: (context) => context.instanceInfoQueryOptions,
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const transport = useContext(TransportContext);
  const { isMobile } = useSidebar();
  const instanceInfo = useContext(InstanceInfoContext);
  const instanceList = useContext(InstanceListContext);
  const profile = useContext(ProfileContext);
  const systemInfo = useContext(SystemInfoContext);
  const clientInfo = useContext(ClientInfoContext);
  const instanceProfileInputRef = useRef<HTMLInputElement>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const setProfileMutation = useMutation({
    mutationFn: async (profile: ProfileRoot) => {
      if (transport === null) {
        return;
      }

      const instanceService = new InstanceServiceClient(transport);
      await instanceService.updateInstanceConfig({
        id: instanceInfo.id,
        config: convertToInstanceProto(profile),
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
      });
    },
  });
  const deleteMutation = useMutation({
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
        loading: t('instanceSidebar.deleteToast.loading'),
        success: t('instanceSidebar.deleteToast.success'),
        error: (e) => {
          console.error(e);
          return t('instanceSidebar.deleteToast.error');
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

  const capitalizedState = translateInstanceState(i18n, instanceInfo.state);
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
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
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {t('instanceSidebar.instancesGroup')}
            </DropdownMenuLabel>
            {instanceList.instances.map((instance, index) => {
              return (
                <DropdownMenuItem
                  key={instance.id}
                  asChild
                  className="gap-2 p-2"
                >
                  <Link
                    to="/dashboard/instance/$instance/console"
                    params={{ instance: instance.id }}
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <DynamicIcon
                        name={instance.icon}
                        className="size-4 shrink-0"
                      />
                    </div>
                    {instance.friendlyName}
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  </Link>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 p-2">
              <Link to="/dashboard/user/instances">
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                  <HomeIcon className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  {t('instanceSidebar.backToDashboard')}
                </div>
              </Link>
            </DropdownMenuItem>
            {hasGlobalPermission(
              clientInfo,
              GlobalPermission.CREATE_INSTANCE,
            ) && (
              <DropdownMenuItem
                onClick={() => setCreateOpen(true)}
                className="gap-2 p-2"
              >
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                  <PlusIcon className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  {t('instanceSidebar.createInstance')}
                </div>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground max-w-64 truncate text-xs">
              {instanceInfo.friendlyName}
            </DropdownMenuLabel>
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
                      loading: t('instanceSidebar.loadProfileToast.loading'),
                      success: t('instanceSidebar.loadProfileToast.success'),
                      error: (e) => {
                        console.error(e);
                        return t('instanceSidebar.loadProfileToast.error');
                      },
                    },
                  );
                };
                reader.readAsText(file);
              }}
            />
            {isTauri() && systemInfo ? (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2 p-2">
                  <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                    <UploadIcon className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">
                    {t('instanceSidebar.loadProfile')}
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {systemInfo.availableProfiles.length > 0 && (
                      <>
                        {systemInfo.availableProfiles.map((file) => (
                          <DropdownMenuItem
                            className="gap-2 p-2"
                            key={file}
                            onClick={() => {
                              const loadProfile = async () => {
                                const data = await readTextFile(
                                  await resolve(
                                    await resolve(
                                      await appConfigDir(),
                                      'profile',
                                    ),
                                    file,
                                  ),
                                );

                                await setProfileMutation.mutateAsync(
                                  JSON.parse(data) as ProfileRoot,
                                );
                              };
                              toast.promise(loadProfile(), {
                                loading: t(
                                  'instanceSidebar.loadProfileToast.loading',
                                ),
                                success: t(
                                  'instanceSidebar.loadProfileToast.success',
                                ),
                                error: (e) => {
                                  console.error(e);
                                  return t(
                                    'instanceSidebar.loadProfileToast.error',
                                  );
                                },
                              });
                            }}
                          >
                            <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                              <FileIcon className="size-4" />
                            </div>
                            {file}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      className="gap-2 p-2"
                      onClick={() => {
                        runAsync(async () => {
                          const profileDir = await resolve(
                            await appConfigDir(),
                            'profile',
                          );
                          await mkdir(profileDir, { recursive: true });

                          const selected = await open({
                            title: t('instanceSidebar.loadProfile'),
                            filters: systemInfo.mobile
                              ? undefined
                              : [
                                  {
                                    name: 'SoulFire JSON Profile',
                                    extensions: ['json'],
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
                                  'instanceSidebar.loadProfileToast.loading',
                                ),
                                success: t(
                                  'instanceSidebar.loadProfileToast.success',
                                ),
                                error: (e) => {
                                  console.error(e);
                                  return t(
                                    'instanceSidebar.loadProfileToast.error',
                                  );
                                },
                              },
                            );
                          }
                        });
                      }}
                    >
                      <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                        <FolderIcon className="size-4" />
                      </div>
                      {t('instanceSidebar.loadFromFile')}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            ) : (
              <>
                <DropdownMenuItem
                  className="gap-2 p-2"
                  onClick={() => {
                    instanceProfileInputRef.current?.click();
                  }}
                >
                  <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                    <UploadIcon className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">
                    {t('instanceSidebar.loadProfile')}
                  </div>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => {
                const data = JSON.stringify(profile, null, 2);
                if (isTauri()) {
                  runAsync(async () => {
                    const profileDir = await resolve(
                      await appConfigDir(),
                      'profile',
                    );
                    await mkdir(profileDir, { recursive: true });

                    let selected = await save({
                      title: t('instanceSidebar.saveProfile'),
                      filters: [
                        {
                          name: 'SoulFire JSON Profile',
                          extensions: ['json'],
                        },
                      ],
                      defaultPath: profileDir,
                    });

                    if (selected) {
                      if (!selected.endsWith('.json')) {
                        selected += '.json';
                      }

                      await writeTextFile(selected, data);
                    }
                  });
                } else {
                  saveAs(data2blob(data), 'profile.json');
                }

                toast.success(t('instanceSidebar.profileSaved'));
              }}
            >
              <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                <DownloadIcon className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                {t('instanceSidebar.saveProfile')}
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {hasInstancePermission(
              instanceInfo,
              InstancePermission.DELETE_INSTANCE,
            ) && (
              <DropdownMenuItem
                onClick={() => {
                  deleteMutation.mutate(instanceInfo.id);
                  void navigate({
                    to: '/dashboard/user/instances',
                  });
                }}
                className="gap-2 p-2"
              >
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                  <MinusIcon className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  {t('instanceSidebar.deleteInstance')}
                </div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <CreateInstancePopup open={createOpen} setOpen={setCreateOpen} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
