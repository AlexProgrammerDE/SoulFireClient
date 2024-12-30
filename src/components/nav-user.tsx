'use client';

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LaptopMinimalIcon,
  LogOutIcon,
  PaintRollerIcon,
  PowerIcon,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useContext } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { isTauri } from '@/lib/utils.ts';
import { emit } from '@tauri-apps/api/event';
import { toast } from 'sonner';
import { exit } from '@tauri-apps/plugin-process';
import { useNavigate } from '@tanstack/react-router';
import { LOCAL_STORAGE_TERMINAL_THEME_KEY } from '@/lib/types.ts';
import { flavorEntries } from '@catppuccin/palette';
import { useTheme } from 'next-themes';
import { TerminalThemeContext } from '@/components/providers/terminal-theme-context.tsx';
import CastMenuEntry from '@/components/cast-menu-entry.tsx';

export function NavUser() {
  const navigate = useNavigate();
  const clientInfo = useContext(ClientInfoContext);
  const terminalTheme = useContext(TerminalThemeContext);
  const { theme, setTheme } = useTheme();
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={clientInfo.gravatarUrl}
                  alt={clientInfo.username}
                />
                <AvatarFallback className="rounded-lg">
                  {clientInfo.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {clientInfo.username}
                </span>
                <span className="truncate text-xs">{clientInfo.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={clientInfo.gravatarUrl}
                    alt={clientInfo.username}
                  />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {clientInfo.username}
                  </span>
                  <span className="truncate text-xs">{clientInfo.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <PaintRollerIcon className="h-4" />
                  <span>Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={theme}
                      onValueChange={(e) => setTheme(e)}
                    >
                      <DropdownMenuRadioItem value="system">
                        System
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="dark">
                        Dark
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="light">
                        Light
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <LaptopMinimalIcon className="h-4" />
                  <span>Terminal</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={terminalTheme.value}
                      onValueChange={(e) => {
                        localStorage.setItem(
                          LOCAL_STORAGE_TERMINAL_THEME_KEY,
                          e,
                        );
                        terminalTheme.setter(e);
                      }}
                    >
                      {flavorEntries.map((entry) => (
                        <DropdownMenuRadioItem key={entry[0]} value={entry[0]}>
                          {entry[1].emoji} {entry[1].name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {isTauri() && <CastMenuEntry />}
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {clientInfo && (
              <DropdownMenuItem
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
                <LogOutIcon className="h-4 mr-2" />
                <span>Log out</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                if (isTauri()) {
                  void exit(0);
                } else {
                  window.location.href = 'about:blank';
                }
              }}
            >
              <PowerIcon className="h-4 mr-2" />
              <span>Exit</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
