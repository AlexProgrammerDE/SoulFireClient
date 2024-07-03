import { createRootRoute, Outlet } from '@tanstack/react-router';
import 'non.geist';
import '../index.css';
import { ThemeProvider } from '@/components/providers/theme-provider.tsx';
import { Toaster } from '@/components/ui/sonner.tsx';
import { TailwindIndicator } from '@/components/tailwind-indicator.tsx';

export const Route = createRootRoute({
  component: () => (
    <>
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
    </>
  ),
});
