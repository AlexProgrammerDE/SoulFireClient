import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, type LinkProps, useRouteContext } from "@tanstack/react-router";
import {
  BoltIcon,
  BotIcon,
  RouteIcon,
  SparklesIcon,
  UsersIcon,
  WaypointsIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar.tsx";
import { InstancePermission } from "@/generated/soulfire/common.ts";
import { hasInstancePermission } from "@/lib/utils.tsx";

type NavLink = {
  title: string;
  icon: (props: { className: string }) => ReactNode;
  linkProps: LinkProps;
};

export function NavSettings() {
  const { t } = useTranslation("common");
  const instanceInfoQueryOptions = useRouteContext({
    from: "/_dashboard/instance/$instance",
    select: (context) => context.instanceInfoQueryOptions,
  });
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);

  const navLinks: NavLink[] = [
    {
      title: t("instanceSidebar.botSettings"),
      icon: BotIcon,
      linkProps: {
        to: "/instance/$instance/settings/$namespace",
        params: { instance: instanceInfo.id, namespace: "bot" },
      },
    },
    {
      title: t("instanceSidebar.accountSettings"),
      icon: UsersIcon,
      linkProps: {
        to: "/instance/$instance/accounts",
        params: { instance: instanceInfo.id },
      },
    },
    {
      title: t("instanceSidebar.proxySettings"),
      icon: WaypointsIcon,
      linkProps: {
        to: "/instance/$instance/proxies",
        params: { instance: instanceInfo.id },
      },
    },
    {
      title: t("instanceSidebar.aiSettings"),
      icon: SparklesIcon,
      linkProps: {
        to: "/instance/$instance/settings/$namespace",
        params: { instance: instanceInfo.id, namespace: "ai" },
      },
    },
    {
      title: t("instanceSidebar.pathfindingSettings"),
      icon: RouteIcon,
      linkProps: {
        to: "/instance/$instance/settings/$namespace",
        params: { instance: instanceInfo.id, namespace: "pathfinding" },
      },
    },
    ...(hasInstancePermission(
      instanceInfo,
      InstancePermission.UPDATE_INSTANCE_META,
    )
      ? [
          {
            title: t("instanceSidebar.metaSettings"),
            icon: BoltIcon,
            linkProps: {
              to: "/instance/$instance/meta",
              params: { instance: instanceInfo.id },
            },
          } satisfies NavLink,
        ]
      : []),
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        {t("instanceSidebar.settingsGroup")}
      </SidebarGroupLabel>
      <SidebarMenu>
        {navLinks.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <Link
                activeOptions={{ exact: true }}
                activeProps={{
                  "data-active": true,
                }}
                {...item.linkProps}
              >
                <item.icon className="size-4" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
