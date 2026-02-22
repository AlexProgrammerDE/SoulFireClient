import { queryOptions } from "@tanstack/react-query";
import { CatchBoundary, createFileRoute, Outlet } from "@tanstack/react-router";
import { ErrorComponent } from "@/components/error-component.tsx";
import { InstanceSidebar } from "@/components/nav/instance/instance-sidebar.tsx";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar.tsx";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import {
  demoInstanceSettings,
  demoInstanceSettingsDefinitions,
} from "@/demo-data.ts";
import {
  InstancePermission,
  MinecraftAccountProto_AccountTypeProto,
  ProxyProto_Type,
} from "@/generated/soulfire/common.ts";
import { InstanceServiceClient } from "@/generated/soulfire/instance.client.ts";
import {
  type InstanceConfig,
  InstanceState,
} from "@/generated/soulfire/instance.ts";
import { useCastBroadcast } from "@/hooks/use-cast-broadcast.ts";
import { useIsMobile } from "@/hooks/use-mobile.ts";
import { instanceMetricsQueryOptions } from "@/lib/metrics-query.ts";
import {
  convertFromInstanceProto,
  type InstanceInfoQueryData,
} from "@/lib/types.ts";
import { smartEntries } from "@/lib/utils.tsx";
import { createTransport } from "@/lib/web-rpc.ts";

export const Route = createFileRoute("/_dashboard/instance/$instance")({
  beforeLoad: (props) => {
    const { instance } = props.params;
    const instanceInfoQueryOptions = queryOptions({
      queryKey: ["instance-info", instance],
      queryFn: async (props): Promise<InstanceInfoQueryData> => {
        const transport = createTransport();
        if (transport === null) {
          const instanceConfig: InstanceConfig = {
            settings: [],
            accounts: [
              {
                type: MinecraftAccountProto_AccountTypeProto.OFFLINE,
                profileId: "607d30e7-115b-3838-914a-e4229c2b985d",
                lastKnownName: "Pistonmaster",
                accountData: {
                  oneofKind: "offlineJavaData",
                  offlineJavaData: {},
                },
                config: [],
                persistentMetadata: [],
              },
            ],
            proxies: [
              {
                type: ProxyProto_Type.HTTP,
                address: "127.0.0.1:8080",
                username: "admin",
                password: "admin",
              },
              {
                type: ProxyProto_Type.SOCKS4,
                address: "127.0.0.1:8081",
                username: "admin",
              },
              {
                type: ProxyProto_Type.SOCKS5,
                address: "127.0.0.1:8082",
                username: "admin",
                password: "admin",
              },
            ],
            persistentMetadata: [],
          };
          return {
            id: instance,
            profile: convertFromInstanceProto(instanceConfig),
            friendlyName: "Demo",
            icon: "pickaxe",
            instancePermissions: smartEntries(InstancePermission).map(
              (permission) => ({
                instancePermission: permission[1],
                granted: true,
              }),
            ),
            config: instanceConfig,
            settingsDefinitions: demoInstanceSettingsDefinitions,
            instanceSettings: demoInstanceSettings,
            plugins: [],
            state: InstanceState.RUNNING,
            lastModified: {
              seconds: "0",
              nanos: 0,
            },
          };
        }

        // Get previous cached data to use for if-modified-since check
        const previousData = props.client.getQueryData<InstanceInfoQueryData>([
          "instance-info",
          instance,
        ]);

        const instanceService = new InstanceServiceClient(transport);
        const result = await instanceService.getInstanceInfo(
          {
            id: instance,
            ifModifiedSince: previousData?.lastModified,
          },
          {
            abort: props.signal,
          },
        );

        if (result.response.result.oneofKind === "notModified") {
          // Return previous data if not modified
          if (previousData) {
            return previousData;
          }
          throw new Error("No cached data available");
        }

        if (result.response.result.oneofKind !== "info") {
          throw new Error("Unexpected response type");
        }

        const info = result.response.result.info;
        return {
          id: instance,
          profile: convertFromInstanceProto(info.config),
          ...info,
        };
      },
      refetchInterval: 3_000,
    });
    const transport = createTransport();
    const metricsQueryOptions = instanceMetricsQueryOptions(
      transport,
      instance,
    );
    props.abortController.signal.addEventListener("abort", () => {
      void props.context.queryClient.cancelQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
      });
    });
    return {
      instanceInfoQueryOptions,
      metricsQueryOptions,
    };
  },
  loader: (props) => {
    void props.context.queryClient.prefetchQuery(
      props.context.instanceInfoQueryOptions,
    );
  },
  component: InstanceLayout,
});

function InstanceLayout() {
  const { metricsQueryOptions, instanceInfoQueryOptions } =
    Route.useRouteContext();
  useCastBroadcast(
    metricsQueryOptions.queryKey,
    instanceInfoQueryOptions.queryKey,
  );
  const isMobile = useIsMobile();
  const sidebarState = localStorage.getItem("sidebar:state");
  const defaultOpen =
    sidebarState === null ? !isMobile : sidebarState === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <InstanceSidebar />
      <TooltipProvider delayDuration={500}>
        <SidebarInset>
          <CatchBoundary
            getResetKey={() => "instance-layout"}
            errorComponent={ErrorComponent}
          >
            <Outlet />
          </CatchBoundary>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}
