import { createRootRoute, Outlet } from '@tanstack/react-router'
import "@fontsource/inter/latin.css";
import "../index.css";
import {ThemeProvider} from "@/components/theme-provider.tsx";
import {Toaster} from "@/components/ui/sonner.tsx";
import {TailwindIndicator} from "@/components/tailwind-indicator.tsx";
import {lazy, Suspense} from "react";

const TanStackRouterDevtools =
    process.env.NODE_ENV === 'production'
        ? () => null // Render nothing in production
        : lazy(() =>
            // Lazy load in development
            import('@tanstack/router-devtools').then((res) => ({
                default: res.TanStackRouterDevtools,
            })),
        )

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
            <Suspense>
                <TanStackRouterDevtools />
            </Suspense>
        </>
    ),
})
