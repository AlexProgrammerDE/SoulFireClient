import {createRootRoute, Outlet} from '@tanstack/react-router'
import 'non.geist';
import "../index.css";
import {ThemeProvider} from "@/components/theme-provider.tsx";
import {Toaster} from "@/components/ui/sonner.tsx";
import {TailwindIndicator} from "@/components/tailwind-indicator.tsx";
import {lazy, Suspense} from "react";
import {ScrollArea} from "@/components/ui/scroll-area.tsx";

const TanStackRouterDevtoolsLazy = lazy(() =>
    // Lazy load in development
    import('@tanstack/router-devtools').then((res) => ({
        default: res.TanStackRouterDevtools,
    })))

const TanStackRouterDevtools = () =>
    process.env.NODE_ENV === 'production'
        ? <></> // Render nothing in production
        : <div className="absolute">
            <Suspense>
                <TanStackRouterDevtoolsLazy/>
            </Suspense>
        </div>

export const Route = createRootRoute({
    component: () => (
        <>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <ScrollArea className="h-screen w-screen rounded-md border">
                    <main vaul-drawer-wrapper="" className="min-h-screen w-screen">
                        <Outlet/>
                    </main>
                </ScrollArea>
                <Toaster richColors/>
            </ThemeProvider>
            <TailwindIndicator/>
            <TanStackRouterDevtools/>
        </>
    ),
})
