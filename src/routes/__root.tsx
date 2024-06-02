import {createRootRoute, Outlet} from '@tanstack/react-router'
import 'non.geist';
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
                <main vaul-drawer-wrapper="" className="h-screen w-screen flex">
                    <Outlet/>
                </main>
                <Toaster richColors/>
            </ThemeProvider>
            <TailwindIndicator/>
        </>
    ),
})
