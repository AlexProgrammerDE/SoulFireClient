import { createRootRoute, Outlet } from '@tanstack/react-router';
import 'non.geist';
import '../index.css';
import { ThemeProvider } from '@/components/providers/theme-provider.tsx';
import { Toaster } from '@/components/ui/sonner.tsx';
import { TailwindIndicator } from '@/components/tailwind-indicator.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query';

export const Route = createRootRoute({
  component: ClientLayout,
});

function ClientLayout() {
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
      </QueryClientProvider>
    </>
  );
}
