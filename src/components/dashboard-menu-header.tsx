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
import { exit } from '@tauri-apps/api/process';
import { AboutPopup } from '@/components/about-popup.tsx';
import { useContext, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ProfileContext } from '@/components/providers/profile-context.tsx';
import { saveAs } from 'file-saver';
import { createDir, readTextFile, writeTextFile } from '@tauri-apps/api/fs';
import { open, save } from '@tauri-apps/api/dialog';
import { open as shellOpen } from '@tauri-apps/api/shell';
import { appConfigDir, appDataDir, resolve } from '@tauri-apps/api/path';
import { toast } from 'sonner';
import CastMenuEntry from '@/components/cast-menu-entry.tsx';
import {
  convertToProto,
  LOCAL_STORAGE_SERVER_ADDRESS_KEY,
  LOCAL_STORAGE_SERVER_TOKEN_KEY,
  LOCAL_STORAGE_TERMINAL_THEME_KEY,
  ProfileRoot,
} from '@/lib/types.ts';
import { SystemInfoContext } from '@/components/providers/system-info-context.tsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InstanceServiceClient } from '@/generated/com/soulfiremc/grpc/generated/instance.client.ts';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { TerminalThemeContext } from '@/components/providers/terminal-theme-context.tsx';
import { flavorEntries } from '@catppuccin/palette';

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
            <MenubarItem
              onClick={() => {
                void (async () => {
                  localStorage.removeItem(LOCAL_STORAGE_SERVER_ADDRESS_KEY);
                  localStorage.removeItem(LOCAL_STORAGE_SERVER_TOKEN_KEY);
                  await navigate({
                    to: '/',
                    replace: true,
                  });
                  toast.success('Logged out');
                })();
              }}
            >
              Log out
            </MenubarItem>
            {isTauri() && (
              <MenubarItem onClick={() => void exit(0)}>Exit</MenubarItem>
            )}
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
                  error: 'Failed to load profile',
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
                  <MenubarSubTrigger>Load Profile</MenubarSubTrigger>
                  <MenubarSubContent>
                    {systemInfo.availableProfiles.length > 0 && (
                      <>
                        {systemInfo.availableProfiles.map((file) => (
                          <MenubarItem
                            key={file}
                            onClick={() => {
                              void (async () => {
                                const data = await readTextFile(
                                  await resolve(
                                    await resolve(
                                      await appConfigDir(),
                                      'profile',
                                    ),
                                    file,
                                  ),
                                );

                                toast.promise(
                                  setProfileMutation.mutateAsync(
                                    JSON.parse(data) as ProfileRoot,
                                  ),
                                  {
                                    loading: 'Loading profile...',
                                    success: 'Profile loaded',
                                    error: 'Failed to load profile',
                                  },
                                );
                              })();
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
                          await createDir(profileDir, { recursive: true });

                          const selected = await open({
                            title: 'Load Profile',
                            filters: [
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
                            const single = Array.isArray(selected)
                              ? selected[0]
                              : selected;
                            const data = await readTextFile(single);
                            toast.promise(
                              setProfileMutation.mutateAsync(
                                JSON.parse(data) as ProfileRoot,
                              ),
                              {
                                loading: 'Loading profile...',
                                success: 'Profile loaded',
                                error: 'Failed to load profile',
                              },
                            );
                          }

                          toast.success('Profile loaded');
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
                    Load Profile
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
                      await createDir(profileDir, { recursive: true });

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
                Save Profile
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem
                onClick={() => {
                  void navigate({
                    to: '/dashboard',
                  });
                }}
              >
                Back to selection
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        )}
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarSub>
              <MenubarSubTrigger>Theme</MenubarSubTrigger>
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
              <MenubarSubTrigger>Terminal</MenubarSubTrigger>
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
            <MenubarItem
              onClick={() => {
                if (isTauri()) {
                  void shellOpen('https://soulfiremc.com/docs');
                } else {
                  window.open('https://soulfiremc.com/docs');
                }
              }}
            >
              Documentation
            </MenubarItem>
            <MenubarSeparator />
            {isTauri() && (
              <>
                <MenubarItem
                  onClick={() => {
                    void (async () => {
                      await shellOpen(await appConfigDir());
                    })();
                  }}
                >
                  Config directory
                </MenubarItem>
                <MenubarItem
                  onClick={() => {
                    void (async () => {
                      await shellOpen(await appDataDir());
                    })();
                  }}
                >
                  Data directory
                </MenubarItem>
                <MenubarSeparator />
              </>
            )}
            <MenubarItem
              onClick={() => {
                setAboutOpen(true);
              }}
            >
              About
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <AboutPopup
        open={aboutOpen}
        setOpen={setAboutOpen}
        systemInfo={systemInfo}
      />
    </>
  );
};
