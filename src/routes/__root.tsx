import {
  createRootRoute,
  deepEqual,
  Outlet,
  useLocation,
} from '@tanstack/react-router';
import '../App.css';
import { ThemeProvider } from '@/components/providers/theme-provider.tsx';
import { Toaster } from '@/components/ui/sonner.tsx';
import { TailwindIndicator } from '@/components/tailwind-indicator.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query';
import { memo, useEffect, useState } from 'react';
import {
  SystemInfo,
  SystemInfoContext,
} from '@/components/providers/system-info-context.tsx';
import { getTerminalTheme, isTauri } from '@/lib/utils.tsx';
import { appConfigDir, BaseDirectory, resolve } from '@tauri-apps/api/path';
import { mkdir, readDir, watch } from '@tauri-apps/plugin-fs';
import { arch, locale, platform, type, version } from '@tauri-apps/plugin-os';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TerminalThemeContext } from '@/components/providers/terminal-theme-context';
import { attachConsole } from '@tauri-apps/plugin-log';
import { AptabaseProvider, useAptabase } from '@aptabase/react';
import { emit } from '@tauri-apps/api/event';
import { useTheme } from 'next-themes';

async function getAvailableProfiles() {
  const profileDir = await resolve(
    await resolve(await appConfigDir(), 'profile'),
  );
  await mkdir(profileDir, { recursive: true });

  return (await readDir(profileDir))
    .filter((file) => file.isFile)
    .filter((file) => file.name)
    .map((file) => file.name)
    .filter((file) => file.endsWith('.json'));
}

function isMobile() {
  const osType = type();
  return osType === 'android' || osType === 'ios';
}

async function getSystemTheme() {
  return isMobile() ? null : await getCurrentWebviewWindow().theme();
}

async function createSystemInfo() {
  const osType = type();
  const [availableProfiles, theme, osLocale] = await Promise.all([
    getAvailableProfiles(),
    getSystemTheme(),
    locale(),
  ]);
  return {
    availableProfiles,
    osType,
    osVersion: version(),
    platformName: platform(),
    osLocale,
    archName: arch(),
    theme,
    mobile: isMobile(),
  };
}

export const Route = createRootRoute({
  loader: async () => {
    let systemInfo: SystemInfo | null;
    if (isTauri()) {
      void attachConsole();
      systemInfo = await createSystemInfo();
    } else {
      systemInfo = null;
    }

    return {
      systemInfo,
    };
  },
  component: RootLayout,
  // To make pendingComponent work on root route
  wrapInSuspense: true,
  pendingComponent: RootPending,
});

function RootPending() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <WindowThemeSyncer />
      <div vaul-drawer-wrapper="" className="flex h-dvh w-dvw flex-col" />
    </ThemeProvider>
  );
}

function PointerReset() {
  const location = useLocation();

  // Avoid mobile pointer events issues
  // When dropdowns were open when page is switched, sometimes the body still has pointer-events: none
  // This will reset it to auto
  useEffect(() => {
    document.body.style.pointerEvents = 'auto';
  }, [location.pathname]);

  return null;
}

const AppStartedEvent = memo(() => {
  const { trackEvent } = useAptabase();
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => {
    if (!appLoaded) {
      void trackEvent('app_loaded');
      setAppLoaded(true);

      if (isTauri()) {
        void emit('app-loaded', {});
      }
    }
  }, [appLoaded, trackEvent]);

  return null;
});

function WindowThemeSyncer() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (isTauri()) {
      if (resolvedTheme === 'dark') {
        void getCurrentWebviewWindow().setTheme('dark');
      } else if (resolvedTheme === 'light') {
        void getCurrentWebviewWindow().setTheme('light');
      }
    }
  }, [resolvedTheme]);

  return null;
}

function RootLayout() {
  const { systemInfo } = Route.useLoaderData();
  const [systemInfoState, setSystemInfoState] = useState<SystemInfo | null>(
    systemInfo,
  );
  const [terminalTheme, setTerminalTheme] = useState(getTerminalTheme());

  useEffect(() => {
    if (isTauri()) {
      let didUnmount = false;
      let unwatch: null | (() => void) = null;
      void watch(
        'profile',
        () => {
          void createSystemInfo().then((newSystemInfo) => {
            setSystemInfoState((oldSystemInfo) => {
              if (deepEqual(oldSystemInfo, newSystemInfo)) {
                return oldSystemInfo;
              } else {
                return newSystemInfo;
              }
            });
          });
        },
        {
          baseDir: BaseDirectory.AppConfig,
          delayMs: 500,
          recursive: true,
        },
      ).then((unwatchFn) => {
        if (didUnmount) {
          unwatchFn();
        } else {
          unwatch = unwatchFn;
        }
      });

      return () => {
        didUnmount = true;
        if (unwatch) {
          unwatch();
        }
      };
    }
  }, []);

  return (
    <>
      <AptabaseProvider
        appKey="A-SH-6467566517"
        options={{
          apiUrl: 'https://aptabase.pistonmaster.net/api/v0/event',
          appVersion: APP_VERSION,
        }}
      >
        <AppStartedEvent />
        <QueryClientProvider client={queryClientInstance}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <WindowThemeSyncer />
            <TooltipProvider delayDuration={500}>
              <SystemInfoContext.Provider value={systemInfoState}>
                <TerminalThemeContext.Provider
                  value={{
                    value: terminalTheme,
                    setter: setTerminalTheme,
                  }}
                >
                  <div
                    vaul-drawer-wrapper=""
                    className="flex h-dvh w-dvw flex-col"
                  >
                    <PointerReset />
                    <Outlet />
                  </div>
                </TerminalThemeContext.Provider>
              </SystemInfoContext.Provider>
              <Toaster richColors />
            </TooltipProvider>
          </ThemeProvider>
          <TailwindIndicator />
        </QueryClientProvider>
      </AptabaseProvider>
    </>
  );
}
