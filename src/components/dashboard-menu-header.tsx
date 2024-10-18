import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar.tsx';
import { useTheme } from 'next-themes';
import { isTauri } from '@/lib/utils.ts';
import { exit } from '@tauri-apps/plugin-process';
import { AboutPopup } from '@/components/about-popup.tsx';
import { useContext, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ProfileContext } from '@/components/providers/profile-context.tsx';
import { saveAs } from 'file-saver';
import { mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { open, save } from '@tauri-apps/plugin-dialog';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { appConfigDir, appDataDir, resolve } from '@tauri-apps/api/path';
import { toast } from 'sonner';
import CastMenuEntry from '@/components/cast-menu-entry.tsx';
import {
  convertToProto,
  LOCAL_STORAGE_TERMINAL_THEME_KEY,
  ProfileRoot,
} from '@/lib/types.ts';
import { SystemInfoContext } from '@/components/providers/system-info-context.tsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { TerminalThemeContext } from '@/components/providers/terminal-theme-context.tsx';
import { flavorEntries } from '@catppuccin/palette';
import {
  BookOpenTextIcon,
  CircleHelpIcon,
  DownloadIcon,
  FolderIcon,
  LaptopMinimalIcon,
  LifeBuoyIcon,
  ListIcon,
  PaintRollerIcon,
  PowerIcon,
  UnplugIcon,
  UploadIcon,
} from 'lucide-react';
import { emit } from '@tauri-apps/api/event';

function data2blob(data: string) {
  const bytes = new Array(data.length);
  for (let i = 0; i < data.length; i++) {
    bytes[i] = data.charCodeAt(i);
  }

  return new Blob([new Uint8Array(bytes)]);
}

export const DashboardMenuHeader = () => {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [aboutOpen, setAboutOpen] = useState(false);
  const navigate = useNavigate();
  const systemInfo = useContext(SystemInfoContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profile = useContext(ProfileContext);
  const transport = useContext(TransportContext);
  const instanceInfo = useContext(InstanceInfoContext);
  const terminalTheme = useContext(TerminalThemeContext);
  const setProfileMutation = useMutation({
    mutationFn: async (profile: ProfileRoot) => {
      if (transport === null) {
        return;
      }

      const instanceService = new InstanceServiceClient(transport);
      await instanceService.updateInstanceConfig({
        id: instanceInfo.id,
        config: convertToProto(profile),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['instance-info', instanceInfo.id],
      });
    },
  });

  return (
    <>
      <Menubar
        data-tauri-drag-region
        className="rounded-none border-l-0 border-r-0 border-t-0"
      >
        <MenubarMenu>
          <MenubarTrigger>
            <img src="/logo.png" alt="SoulFIre logo" className="h-6" />
          </MenubarTrigger>
          <MenubarContent>
            {transport && (
              <MenubarItem
                onClick={() => {
                  const disconnect = async () => {
                    if (isTauri()) {
                      await emit('kill-integrated-server', {});
                    }
                    await navigate({
                      to: '/',
                      replace: true,
                    });
                  };
                  toast.promise(disconnect(), {
                    loading: 'Disconnecting...',
                    success: 'Disconnected',
                    error: (e) => {
                      console.error(e);
                      return 'Failed to disconnect';
                    },
                  });
                }}
              >
                <UnplugIcon className="w-4 h-4 mr-2" />
                <span>Disconnect</span>
              </MenubarItem>
            )}
            <MenubarItem
              onClick={() => {
                if (isTauri()) {
                  void exit(0);
                } else {
                  window.location.href = 'about:blank';
                }
              }}
            >
              <PowerIcon className="w-4 h-4 mr-2" />
              <span>Exit</span>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <input
          ref={fileInputRef}
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
                setProfileMutation.mutateAsync(JSON.parse(data) as ProfileRoot),
                {
                  loading: 'Loading profile...',
                  success: 'Profile loaded',
                  error: (e) => {
                    console.error(e);
                    return 'Failed to load profile';
                  },
                },
              );
            };
            reader.readAsText(file);
          }}
        />
        {profile && (
          <MenubarMenu>
            <MenubarTrigger>Instance</MenubarTrigger>
            <MenubarContent>
              {isTauri() && systemInfo ? (
                <MenubarSub>
                  <MenubarSubTrigger>
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    <span>Load Profile</span>
                  </MenubarSubTrigger>
                  <MenubarSubContent>
                    {systemInfo.availableProfiles.length > 0 && (
                      <>
                        {systemInfo.availableProfiles.map((file) => (
                          <MenubarItem
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
                                loading: 'Loading profile...',
                                success: 'Profile loaded',
                                error: (e) => {
                                  console.error(e);
                                  return 'Failed to load profile';
                                },
                              });
                            }}
                          >
                            {file}
                          </MenubarItem>
                        ))}
                        <MenubarSeparator />
                      </>
                    )}
                    <MenubarItem
                      onClick={() => {
                        void (async () => {
                          const profileDir = await resolve(
                            await appConfigDir(),
                            'profile',
                          );
                          await mkdir(profileDir, { recursive: true });

                          const selected = await open({
                            title: 'Load Profile',
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
                                loading: 'Loading profile...',
                                success: 'Profile loaded',
                                error: (e) => {
                                  console.error(e);
                                  return 'Failed to load profile';
                                },
                              },
                            );
                          }
                        })();
                      }}
                    >
                      Load from file
                    </MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
              ) : (
                <>
                  <MenubarItem
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                  >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    <span>Load Profile</span>
                  </MenubarItem>
                </>
              )}
              <MenubarItem
                onClick={() => {
                  const data = JSON.stringify(profile, null, 2);
                  if (isTauri()) {
                    void (async () => {
                      const profileDir = await resolve(
                        await appConfigDir(),
                        'profile',
                      );
                      await mkdir(profileDir, { recursive: true });

                      let selected = await save({
                        title: 'Save Profile',
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
                    })();
                  } else {
                    saveAs(data2blob(data), 'profile.json');
                  }

                  toast.success('Profile saved');
                }}
              >
                <UploadIcon className="w-4 h-4 mr-2" />
                <span>Save Profile</span>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem
                onClick={() => {
                  void navigate({
                    to: '/dashboard',
                  });
                }}
              >
                <ListIcon className="w-4 h-4 mr-2" />
                <span>Back to selection</span>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        )}
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarSub>
              <MenubarSubTrigger>
                <PaintRollerIcon className="w-4 h-4 mr-2" />
                <span>Theme</span>
              </MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarRadioGroup
                  value={theme}
                  onValueChange={(e) => setTheme(e)}
                >
                  <MenubarRadioItem value="system">System</MenubarRadioItem>
                  <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
                  <MenubarRadioItem value="light">Light</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSub>
              <MenubarSubTrigger>
                <LaptopMinimalIcon className="w-4 h-4 mr-2" />
                <span>Terminal</span>
              </MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarRadioGroup
                  value={terminalTheme.value}
                  onValueChange={(e) => {
                    localStorage.setItem(LOCAL_STORAGE_TERMINAL_THEME_KEY, e);
                    terminalTheme.setter(e);
                  }}
                >
                  {flavorEntries.map((entry) => (
                    <MenubarRadioItem key={entry[0]} value={entry[0]}>
                      {entry[1].emoji} {entry[1].name}
                    </MenubarRadioItem>
                  ))}
                </MenubarRadioGroup>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
        {isTauri() && <CastMenuEntry />}
        <MenubarMenu>
          <MenubarTrigger>Help</MenubarTrigger>
          <MenubarContent>
            <a href="https://soulfiremc.com/docs" target="_blank">
              <MenubarItem>
                <BookOpenTextIcon className="w-4 h-4 mr-2" />
                <span>Documentation</span>
              </MenubarItem>
            </a>
            <a
              href="https://github.com/AlexProgrammerDE/SoulFireClient"
              target="_blank"
            >
              <MenubarItem>
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 mr-2 fill-current"
                >
                  <title>GitHub</title>
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                <span>Client GitHub</span>
              </MenubarItem>
            </a>
            <a
              href="https://github.com/AlexProgrammerDE/SoulFire"
              target="_blank"
            >
              <MenubarItem>
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 mr-2 fill-current"
                >
                  <title>GitHub</title>
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                <span>Server GitHub</span>
              </MenubarItem>
            </a>
            <a href="https://soulfiremc.com/discord" target="_blank">
              <MenubarItem>
                <LifeBuoyIcon className="w-4 h-4 mr-2" />
                <span>Support</span>
              </MenubarItem>
            </a>
            <MenubarSeparator />
            {isTauri() && systemInfo && !systemInfo.mobile && (
              <>
                <MenubarItem
                  onClick={() => {
                    void (async () => {
                      await shellOpen(await appConfigDir());
                    })();
                  }}
                >
                  <FolderIcon className="w-4 h-4 mr-2" />
                  <span>Config directory</span>
                </MenubarItem>
                <MenubarItem
                  onClick={() => {
                    void (async () => {
                      await shellOpen(await appDataDir());
                    })();
                  }}
                >
                  <FolderIcon className="w-4 h-4 mr-2" />
                  <span>Data directory</span>
                </MenubarItem>
                <MenubarSeparator />
              </>
            )}
            <MenubarItem
              onClick={() => {
                setAboutOpen(true);
              }}
            >
              <CircleHelpIcon className="w-4 h-4 mr-2" />
              <span>About</span>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <AboutPopup open={aboutOpen} setOpen={setAboutOpen} />
    </>
  );
};
