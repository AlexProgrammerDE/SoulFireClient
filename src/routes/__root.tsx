import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router';
import '../App.css';
import { ThemeProvider } from '@/components/providers/theme-provider.tsx';
import { Toaster } from '@/components/ui/sonner.tsx';
import { TailwindIndicator } from '@/components/tailwind-indicator.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { lazy, memo, Suspense, useEffect, useState } from 'react';
import {
  SystemInfo,
  SystemInfoContext,
} from '@/components/providers/system-info-context.tsx';
import { getTerminalTheme, isTauri } from '@/lib/utils.ts';
import { appConfigDir, BaseDirectory, resolve } from '@tauri-apps/api/path';
import { mkdir, readDir, watch } from '@tauri-apps/plugin-fs';
import { arch, locale, platform, type, version } from '@tauri-apps/plugin-os';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TerminalThemeContext } from '@/components/providers/terminal-theme-context';
import { attachConsole } from '@tauri-apps/plugin-log';
import { AptabaseProvider, useAptabase } from '@aptabase/react';

async function createSystemInfo() {
  const profileDir = await resolve(
    await resolve(await appConfigDir(), 'profile'),
  );
  await mkdir(profileDir, { recursive: true });

  const availableProfiles = (await readDir(profileDir))
    .filter((file) => file.isFile)
    .filter((file) => file.name)
    .map((file) => file.name)
    .filter((file) => file.endsWith('.json'));

  const osType = type();
  const mobile = osType === 'android' || osType === 'ios';
  const theme = mobile ? null : await getCurrentWebviewWindow().theme();
  return {
    availableProfiles,
    osType,
    osVersion: version(),
    platformName: platform(),
    osLocale: await locale(),
    archName: arch(),
    theme,
    mobile,
  };
}

export const Route = createRootRoute({
  loader: async () => {
    let systemInfo: SystemInfo | null;
    if (isTauri()) {
      await attachConsole();
      systemInfo = await createSystemInfo();
    } else {
      systemInfo = null;
    }

    return {
      systemInfo,
    };
  },
  component: RootLayout,
});

const ReactQueryDevtoolsProduction = lazy(() =>
  import('@tanstack/react-query-devtools/production').then((d) => ({
    default: d.ReactQueryDevtools,
  })),
);

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
    }
  }, [appLoaded, trackEvent]);

  return null;
});

function RootLayout() {
  const { systemInfo } = Route.useLoaderData();
  const [systemInfoState, setSystemInfoState] = useState<SystemInfo | null>(
    systemInfo,
  );
  const [showDevtools, setShowDevtools] = useState(false);
  const [terminalTheme, setTerminalTheme] = useState(getTerminalTheme());

  useEffect(() => {
    // @ts-expect-error - not in types
    window.toggleDevtools = () => setShowDevtools((old) => !old);
  }, []);

  useEffect(() => {
    if (isTauri()) {
      let didUnmount = false;
      let unwatch: null | (() => void) = null;
      void watch(
        'profile',
        () => {
          void createSystemInfo().then(setSystemInfoState);
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
            defaultTheme={systemInfoState?.theme ?? 'system'}
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider delayDuration={500}>
              <SystemInfoContext.Provider value={systemInfoState}>
                <TerminalThemeContext.Provider
                  value={{
                    value: terminalTheme,
                    setter: setTerminalTheme,
                  }}
                >
                  <main
                    vaul-drawer-wrapper=""
                    className="flex h-dvh w-dvw flex-col"
                  >
                    <PointerReset />
                    <Outlet />
                  </main>
                </TerminalThemeContext.Provider>
              </SystemInfoContext.Provider>
              <Toaster richColors pauseWhenPageIsHidden />
            </TooltipProvider>
          </ThemeProvider>
          <TailwindIndicator />
          <ReactQueryDevtools initialIsOpen />
          {showDevtools && (
            <Suspense fallback={null}>
              <ReactQueryDevtoolsProduction />
            </Suspense>
          )}
        </QueryClientProvider>
      </AptabaseProvider>
    </>
  );
}
