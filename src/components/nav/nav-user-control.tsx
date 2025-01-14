'use client';

import {
  ChevronsUpDown,
  CircleHelpIcon,
  FolderIcon,
  LanguagesIcon,
  LaptopMinimalIcon,
  LogOutIcon,
  MoonIcon,
  PaintRollerIcon,
  PowerIcon,
  SunIcon,
  SunMoonIcon,
} from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar.tsx';
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
} from '@/components/ui/dropdown-menu.tsx';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar.tsx';
import { useContext, useState } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { getLanguageName, isTauri, languageEmoji } from '@/lib/utils.ts';
import { emit } from '@tauri-apps/api/event';
import { toast } from 'sonner';
import { exit } from '@tauri-apps/plugin-process';
import { useNavigate } from '@tanstack/react-router';
import { LOCAL_STORAGE_TERMINAL_THEME_KEY } from '@/lib/types.ts';
import { flavorEntries } from '@catppuccin/palette';
import { useTheme } from 'next-themes';
import { TerminalThemeContext } from '@/components/providers/terminal-theme-context.tsx';
import CastMenuEntry from '@/components/nav/cast-menu-entry.tsx';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { appConfigDir, appDataDir } from '@tauri-apps/api/path';
import { SystemInfoContext } from '@/components/providers/system-info-context.tsx';
import { AboutPopup } from '@/components/dialog/about-popup.tsx';
import { useTranslation } from 'react-i18next';

export function NavUserControl() {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const clientInfo = useContext(ClientInfoContext);
  const terminalTheme = useContext(TerminalThemeContext);
  const [aboutOpen, setAboutOpen] = useState(false);
  const systemInfo = useContext(SystemInfoContext);
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
              tooltip={`${clientInfo.username} | ${clientInfo.email}`}
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
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <PaintRollerIcon />
                  {t('userSidebar.theme.title')}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={theme}
                      onValueChange={(e) => setTheme(e)}
                    >
                      <DropdownMenuRadioItem value="system">
                        <SunMoonIcon className="h-4 mr-1" />
                        {t('userSidebar.theme.system')}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="dark">
                        <MoonIcon className="h-4 mr-1" />
                        {t('userSidebar.theme.dark')}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="light">
                        <SunIcon className="h-4 mr-1" />
                        {t('userSidebar.theme.light')}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <LaptopMinimalIcon />
                  {t('userSidebar.terminal.title')}
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
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <LanguagesIcon />
                  {t('locale')}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={i18n.resolvedLanguage ?? i18n.language}
                      onValueChange={i18n.changeLanguage}
                    >
                      {(i18n.options.supportedLngs
                        ? i18n.options.supportedLngs
                        : []
                      )
                        .filter((lang) => lang !== 'cimode')
                        .map((lang) => (
                          <DropdownMenuRadioItem key={lang} value={lang}>
                            {languageEmoji(lang)} {getLanguageName(lang, lang)}
                          </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            {isTauri() && systemInfo && !systemInfo.mobile && (
              <>
                <DropdownMenuSeparator />
                <CastMenuEntry />
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      void (async () => {
                        await shellOpen(await appConfigDir());
                      })();
                    }}
                  >
                    <FolderIcon />
                    {t('userSidebar.configDir')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      void (async () => {
                        await shellOpen(await appDataDir());
                      })();
                    }}
                  >
                    <FolderIcon />
                    {t('userSidebar.dataDir')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  setAboutOpen(true);
                }}
              >
                <CircleHelpIcon />
                {t('userSidebar.about')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
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
                      loading: t('userSidebar.logOutToast.loading'),
                      success: t('userSidebar.logOutToast.success'),
                      error: (e) => {
                        console.error(e);
                        return t('userSidebar.logOutToast.error');
                      },
                    });
                  }}
                >
                  <LogOutIcon />
                  {t('userSidebar.logOut')}
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
                <PowerIcon />
                {t('userSidebar.exit')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <AboutPopup open={aboutOpen} setOpen={setAboutOpen} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
