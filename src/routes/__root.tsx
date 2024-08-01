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
import { appConfigDir, resolve } from '@tauri-apps/api/path';
import { createDir, readDir } from '@tauri-apps/api/fs';
import { arch, locale, platform, type, version } from '@tauri-apps/api/os';
import { appWindow } from '@tauri-apps/api/window';

export const Route = createRootRoute({
  loader: async () => {
    let systemInfo: SystemInfo | null;
    if (isTauri()) {
      const profileDir = await resolve(
        await resolve(await appConfigDir(), 'profile'),
      );
      await createDir(profileDir, { recursive: true });

      const availableProfiles = (await readDir(profileDir))
        .filter((file) => !file.children)
        .filter((file) => file.name)
        .map((file) => file.name!)
        .filter((file) => file.endsWith('.json'));

      systemInfo = {
        availableProfiles,
        osType: await type(),
        osVersion: await version(),
        platformName: await platform(),
        osLocale: await locale(),
        archName: await arch(),
        theme: await appWindow.theme(),
      };
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
  const [showDevtools, setShowDevtools] = useState(false);

  useEffect(() => {
    // @ts-expect-error - not in types
    window.toggleDevtools = () => setShowDevtools((old) => !old);
  }, []);

  return (
    <>
      <QueryClientProvider client={queryClientInstance}>
        <ThemeProvider
          attribute="class"
          defaultTheme={systemInfo?.theme ?? 'system'}
          enableSystem
          disableTransitionOnChange
        >
          <SystemInfoContext.Provider value={systemInfo}>
            <main vaul-drawer-wrapper="" className="flex h-screen w-screen">
              <Outlet />
            </main>
          </SystemInfoContext.Provider>
          <Toaster richColors />
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
