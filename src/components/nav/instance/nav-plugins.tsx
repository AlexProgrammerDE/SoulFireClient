import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar.tsx';
import {
  Link,
  LinkProps,
  useParams,
  useRouteContext,
} from '@tanstack/react-router';
import { ReactNode, useState } from 'react';
import DynamicIcon from '@/components/dynamic-icon.tsx';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible.tsx';
import {
  BlocksIcon,
  ChevronRightIcon,
  ScrollTextIcon,
  TelescopeIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getEntryValueByType } from '@/lib/utils.tsx';
import { useSuspenseQuery } from '@tanstack/react-query';

type NavLinks = {
  title: string;
  icon: (props: { className: string }) => ReactNode;
  linkProps: LinkProps;
  pluginList?: boolean;
}[];

export function NavPlugins() {
  const { t } = useTranslation('common');
  const sidebar = useSidebar();
  const instanceInfoQueryOptions = useRouteContext({
    from: '/_dashboard/instance/$instance',
    select: (context) => context.instanceInfoQueryOptions,
  });
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const { data: profile } = useSuspenseQuery({
    ...instanceInfoQueryOptions,
    select: (info) => info.profile,
  });
  const namespace = useParams({
    from: '/_dashboard/instance/$instance/settings/$namespace',
    select: (params) => params.namespace,
    shouldThrow: false,
  });
  const settingsEntry = instanceInfo.instanceSettings.find(
    (s) => s.namespace === namespace,
  );
  const [pluginCollapsibleOpen, setPluginCollapsibleOpen] = useState(
    settingsEntry !== undefined && settingsEntry.owningPlugin !== undefined,
  );

  const navLinks: NavLinks = [
    {
      title: t('instanceSidebar.discoverPlugins'),
      icon: TelescopeIcon,
      linkProps: {
        to: '/instance/$instance/discover',
        params: { instance: instanceInfo.id },
      },
    },
    {
      title: t('instanceSidebar.pluginSettings'),
      icon: BlocksIcon,
      linkProps: {
        to: '/instance/$instance/discover',
        params: { instance: instanceInfo.id },
      },
      pluginList: true,
    },
    {
      title: t('instanceSidebar.instanceScripts'),
      icon: ScrollTextIcon,
      linkProps: {
        to: '/instance/$instance/scripts',
        params: { instance: instanceInfo.id },
      },
    },
  ];

  const pluginSettingLinks: NavLinks = instanceInfo.instanceSettings
    .filter(
      (setting) =>
        setting.owningPlugin !== undefined && setting.enabledKey !== undefined,
    )
    .filter(
      (setting) =>
        getEntryValueByType(
          setting.namespace,
          profile,
          setting.entries.find((entry) => entry.key === setting.enabledKey),
        ) === true,
    )
    .map((setting) => ({
      title: setting.pageName,
      icon: (props) => <DynamicIcon {...props} name={setting.iconId} />,
      linkProps: {
        to: '/instance/$instance/settings/$namespace',
        params: {
          instance: instanceInfo.id,
          namespace: setting.namespace,
        },
      },
    }));

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('instanceSidebar.pluginsGroup')}</SidebarGroupLabel>
      <SidebarMenu>
        {navLinks.map((item) =>
          item.pluginList ? (
            <Collapsible
              asChild
              open={pluginCollapsibleOpen}
              onOpenChange={setPluginCollapsibleOpen}
              className="group/collapsible"
              key={item.title}
            >
              <SidebarMenuItem>
                <CollapsibleTrigger
                  onClick={(e) => {
                    // When sidebar closed, open sidebar and make sure collapsible is expanded
                    if (!sidebar.isMobile && !sidebar.open) {
                      e.preventDefault();
                      sidebar.setOpen(true);
                      if (!pluginCollapsibleOpen) {
                        setPluginCollapsibleOpen(true);
                      }
                    }
                  }}
                  asChild
                >
                  <SidebarMenuButton tooltip={item.title}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                    <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {pluginSettingLinks.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <Link
                            activeOptions={{ exact: true }}
                            activeProps={{
                              'data-active': true,
                            }}
                            {...subItem.linkProps}
                          >
                            <subItem.icon className="size-4" />
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link
                  activeOptions={{ exact: true }}
                  activeProps={{
                    'data-active': true,
                  }}
                  {...item.linkProps}
                >
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
