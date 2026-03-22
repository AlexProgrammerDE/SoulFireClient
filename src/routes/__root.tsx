import {
  createRootRouteWithContext,
  deepEqual,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import "../App.css";
import { AptabaseProvider, useAptabase } from "@aptabase/react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import {
  type QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { setTheme } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { appConfigDir, BaseDirectory, resolve } from "@tauri-apps/api/path";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { mkdir, readDir, watch } from "@tauri-apps/plugin-fs";
import { attachConsole } from "@tauri-apps/plugin-log";
import { arch, locale, platform, type, version } from "@tauri-apps/plugin-os";
import { useTheme } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { memo, useEffect, useMemo, useState } from "react";
import { CustomContextMenu } from "@/components/custom-context-menu.tsx";
import { AboutProvider } from "@/components/dialog/about-dialog.tsx";
import {
  type SystemInfo,
  SystemInfoContext,
} from "@/components/providers/system-info-context.tsx";
import { TerminalThemeContext } from "@/components/providers/terminal-theme-context";
import { ThemeProvider } from "@/components/providers/theme-provider.tsx";
import { TailwindIndicator } from "@/components/tailwind-indicator.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { GetInstanceMetricsResponse } from "@/generated/soulfire/metrics.ts";
import { useDiscordPresence } from "@/hooks/use-discord-presence.ts";
import { getTerminalTheme, isTauri } from "@/lib/utils.tsx";

async function getAvailableProfiles() {
  const profileDir = await resolve(
    await resolve(await appConfigDir(), "profile"),
  );
  await mkdir(profileDir, { recursive: true });

  return (await readDir(profileDir))
    .filter((file) => file.isFile)
    .filter((file) => file.name)
    .map((file) => file.name)
    .filter((file) => file.endsWith(".json"));
}

function isMobile() {
  const osType = type();
  return osType === "android" || osType === "ios";
}

async function createSystemInfo() {
  const osType = type();
  const [availableProfiles, osLocale, sfServerVersion] = await Promise.all([
    getAvailableProfiles(),
    locale(),
    invoke<string>("get_sf_server_version"),
  ]);
  return {
    availableProfiles,
    osType,
    osVersion: version(),
    platformName: platform(),
    osLocale,
    archName: arch(),
    mobile: isMobile(),
    sfServerVersion,
  };
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  loader: async () => {
    let systemInfo: SystemInfo | null;
    if (isTauri()) {
      void attachConsole();
      systemInfo = await createSystemInfo();
    } else {
      systemInfo = null;
    }

    return {
      systemInfo,
    };
  },
  component: RootLayout,
  // To make pendingComponent work on root route
  wrapInSuspense: true,
  pendingComponent: RootPending,
});

function RootPending() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <WindowThemeSyncer />
      <div vaul-drawer-wrapper="" className="flex h-dvh w-dvw flex-col" />
    </ThemeProvider>
  );
}

function PointerReset() {
  const location = useLocation();

  // Avoid mobile pointer events issues
  // When dropdowns were open when page is switched, sometimes the body still has pointer-events: none
  // This will reset it to auto
  useEffect(() => {
    console.debug("Resetting pointers because switched to ", location.pathname);
    document.body.style.pointerEvents = "auto";
  }, [location.pathname]);

  return null;
}

const AppStartedEvent = memo(() => {
  const { trackEvent } = useAptabase();
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => {
    if (!appLoaded) {
      void trackEvent("app_loaded");
      setAppLoaded(true);

      if (isTauri()) {
        void emit("app-loaded", {});
      }
    }
  }, [appLoaded, trackEvent]);

  return null;
});

const PageChangedEvent = memo(() => {
  const { trackEvent } = useAptabase();
  const location = useLocation();

  useEffect(() => {
    void trackEvent("page_changed", { path: location.pathname });
  }, [location.pathname, trackEvent]);

  return null;
});

function getPresenceForPath(
  pathname: string,
  queryClient: QueryClient,
): { state: string; details?: string } {
  const instanceMatch = pathname.match(/\/instance\/([^/]+)(?:\/(.*))?/);
  if (instanceMatch) {
    const instanceId = instanceMatch[1];
    const subPage = instanceMatch[2] ?? "";

    const metrics = queryClient.getQueryData<GetInstanceMetricsResponse>([
      "instance-metrics",
      instanceId,
    ]);
    const snapshots = metrics?.snapshots;
    const lastSnapshot = snapshots?.[snapshots.length - 1];
    const botInfo = lastSnapshot
      ? `${lastSnapshot.botsOnline}/${lastSnapshot.botsTotal} bots online`
      : undefined;

    if (subPage.startsWith("bot/"))
      return { state: "Controlling a bot", details: botInfo };
    if (subPage === "bots") return { state: "Managing bots", details: botInfo };
    if (subPage.startsWith("script/"))
      return { state: "Editing a script", details: botInfo };
    if (subPage === "scripts")
      return { state: "Managing scripts", details: botInfo };
    if (subPage === "accounts")
      return { state: "Managing accounts", details: botInfo };
    if (subPage === "proxies")
      return { state: "Managing proxies", details: botInfo };
    if (subPage === "discover")
      return { state: "Discovering servers", details: botInfo };
    if (subPage === "terminal")
      return { state: "Viewing terminal", details: botInfo };
    if (subPage === "audit-log")
      return { state: "Viewing audit log", details: botInfo };
    if (subPage === "meta")
      return { state: "Editing metadata", details: botInfo };
    if (subPage.startsWith("settings"))
      return { state: "Configuring settings", details: botInfo };

    return { state: "Viewing instance overview", details: botInfo };
  }

  if (pathname.includes("/user/admin"))
    return { state: "Server administration" };
  if (pathname.includes("/user/settings")) return { state: "User settings" };
  if (pathname.includes("/user/access")) return { state: "Managing access" };
  if (pathname.includes("/user")) return { state: "User profile" };

  if (pathname === "/") return { state: "Logging in" };

  return { state: "Browsing dashboard" };
}

function DiscordPresenceUpdater() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const presence = useMemo(
    () => getPresenceForPath(location.pathname, queryClient),
    [location.pathname, queryClient],
  );

  useDiscordPresence(presence.state, presence.details);

  return null;
}

function WindowThemeSyncer() {
  const { theme } = useTheme();

  useEffect(() => {
    if (isTauri()) {
      if (theme === "dark") {
        void setTheme("dark");
        void getCurrentWebviewWindow().setTheme("dark");
      } else if (theme === "light") {
        void setTheme("light");
        void getCurrentWebviewWindow().setTheme("light");
      } else if (theme === "system") {
        void setTheme(null);
        void getCurrentWebviewWindow().setTheme(null);
      }
    }
  }, [theme]);

  return null;
}

function RootLayout() {
  const { systemInfo } = Route.useLoaderData();
  const { queryClient } = Route.useRouteContext();
  const [systemInfoState, setSystemInfoState] = useState<SystemInfo | null>(
    systemInfo,
  );
  const [terminalTheme, setTerminalTheme] = useState(getTerminalTheme());

  useEffect(() => {
    if (isTauri()) {
      let didUnmount = false;
      let unwatch: null | (() => void) = null;
      void watch(
        "profile",
        () => {
          void createSystemInfo().then((newSystemInfo) => {
            setSystemInfoState((oldSystemInfo) => {
              if (deepEqual(oldSystemInfo, newSystemInfo)) {
                return oldSystemInfo;
              } else {
                return newSystemInfo;
              }
            });
          });
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
    <NuqsAdapter>
      <AptabaseProvider
        appKey="A-SH-6467566517"
        options={{
          apiUrl: "https://aptabase.pistonmaster.net/api/v0/event",
          appVersion: APP_VERSION,
        }}
      >
        <AppStartedEvent />
        <PageChangedEvent />
        <QueryClientProvider client={queryClient}>
          <DiscordPresenceUpdater />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <WindowThemeSyncer />
            <TooltipProvider delayDuration={500}>
              <SystemInfoContext value={systemInfoState}>
                <TerminalThemeContext
                  value={{
                    value: terminalTheme,
                    setter: setTerminalTheme,
                  }}
                >
                  <div
                    vaul-drawer-wrapper=""
                    className="flex h-dvh w-dvw flex-col"
                  >
                    <PointerReset />
                    <CustomContextMenu />
                    <AboutProvider>
                      <Outlet />
                      <TanStackDevtools
                        plugins={[
                          {
                            name: "TanStack Query",
                            render: <ReactQueryDevtoolsPanel />,
                          },
                          {
                            name: "TanStack Router",
                            render: <TanStackRouterDevtoolsPanel />,
                          },
                        ]}
                      />
                    </AboutProvider>
                  </div>
                </TerminalThemeContext>
              </SystemInfoContext>
              <Toaster richColors />
            </TooltipProvider>
          </ThemeProvider>
          <TailwindIndicator />
        </QueryClientProvider>
      </AptabaseProvider>
    </NuqsAdapter>
  );
}
