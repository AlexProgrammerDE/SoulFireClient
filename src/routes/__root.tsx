import { createRootRoute, Outlet } from '@tanstack/react-router';
import 'non.geist';
import '../index.css';
import { ThemeProvider } from '@/components/providers/theme-provider.tsx';
import { Toaster } from '@/components/ui/sonner.tsx';
import { TailwindIndicator } from '@/components/tailwind-indicator.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { lazy, Suspense, useEffect, useState } from 'react';

export const Route = createRootRoute({
  component: RootLayout,
});

const ReactQueryDevtoolsProduction = lazy(() =>
  import('@tanstack/react-query-devtools/production').then((d) => ({
    default: d.ReactQueryDevtools,
  })),
);

function RootLayout() {
  const [showDevtools, setShowDevtools] = useState(false);

  useEffect(() => {
    // @ts-expect-error - not in types
    window.toggleDevtools = () => setShowDevtools((old) => !old);
  }, []);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main vaul-drawer-wrapper="" className="flex h-screen w-screen">
            <Outlet />
          </main>
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
