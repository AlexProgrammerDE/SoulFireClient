import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import "@fontsource/inter";
import "../index.css";
import {ThemeProvider} from "@/components/theme-provider.tsx";
import {Toaster} from "@/components/ui/sonner.tsx";
import {TailwindIndicator} from "@/components/tailwind-indicator.tsx";

export const Route = createRootRoute({
    component: () => (
        <>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <main className="h-full">
                    <Outlet />
                </main>
                <Toaster richColors/>
            </ThemeProvider>
            <TailwindIndicator/>
            <TanStackRouterDevtools />
        </>
    ),
})
