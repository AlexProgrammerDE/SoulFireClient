import { createRootRoute, Outlet } from '@tanstack/react-router';
import 'non.geist';
import '../index.css';
import { ThemeProvider } from '@/components/providers/theme-provider.tsx';
import { Toaster } from '@/components/ui/sonner.tsx';
import { TailwindIndicator } from '@/components/tailwind-indicator.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { lazy, Suspense, useEffect, useState } from 'react';
import {
  SystemInfo,
  SystemInfoContext,
} from '@/components/providers/system-info-context.tsx';
import { isTauri } from '@/lib/utils.ts';
import { appConfigDir, BaseDirectory, resolve } from '@tauri-apps/api/path';
import { mkdir, readDir, watch } from '@tauri-apps/plugin-fs';
import { arch, locale, platform, type, version } from '@tauri-apps/plugin-os';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { TooltipProvider } from '@/components/ui/tooltip';

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

  const appWindow = getCurrentWebviewWindow();
  return {
    availableProfiles,
    osType: type(),
    osVersion: version(),
    platformName: platform(),
    osLocale: await locale(),
    archName: arch(),
    theme: await appWindow.theme(),
  };
}

export const Route = createRootRoute({
  loader: async () => {
    let systemInfo: SystemInfo | null;
    if (isTauri()) {
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

function RootLayout() {
  const { systemInfo } = Route.useLoaderData();
  const [systemInfoState, setSystemInfoState] = useState<SystemInfo | null>(
    systemInfo,
  );
  const [showDevtools, setShowDevtools] = useState(false);

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
      <QueryClientProvider client={queryClientInstance}>
        <ThemeProvider
          attribute="class"
          defaultTheme={systemInfoState?.theme ?? 'system'}
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={0}>
            <SystemInfoContext.Provider value={systemInfoState}>
              <main vaul-drawer-wrapper="" className="flex h-screen w-screen">
                <Outlet />
              </main>
            </SystemInfoContext.Provider>
            <Toaster richColors />
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
    </>
  );
}
