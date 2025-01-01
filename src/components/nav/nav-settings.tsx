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
import { Link, LinkProps } from '@tanstack/react-router';
import { ReactNode, useContext, useState } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import DynamicIcon from '@/components/dynamic-icon.tsx';
import { InstanceInfoContext } from '../providers/instance-info-context.tsx';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible.tsx';
import { BlocksIcon, ChevronRightIcon } from 'lucide-react';

type NavLinks = {
  title: string;
  icon: (props: {}) => ReactNode;
  linkProps: LinkProps;
}[];

export function NavSettings({
  expandPluginSettings,
}: {
  expandPluginSettings: boolean;
}) {
  const sidebar = useSidebar();
  const [pluginCollapsibleOpen, setPluginCollapsibleOpen] =
    useState(expandPluginSettings);
  const instanceInfo = useContext(InstanceInfoContext);
  const clientInfo = useContext(ClientInfoContext);

  const botSettings = clientInfo.instanceSettings.find(
    (settings) => settings.namespace === 'bot',
  );
  const accountSettings = clientInfo.instanceSettings.find(
    (settings) => settings.namespace === 'account',
  );
  const proxySettings = clientInfo.instanceSettings.find(
    (settings) => settings.namespace === 'proxy',
  );
  const aiSettings = clientInfo.instanceSettings.find(
    (settings) => settings.namespace === 'ai',
  );
  if (!botSettings || !accountSettings || !proxySettings || !aiSettings) {
    throw new Error('Namespaces missing');
  }

  const navLinks: NavLinks = [
    {
      title: 'Bot Settings',
      icon: (props) => (
        <DynamicIcon {...props} name={botSettings.iconId as never} />
      ),
      linkProps: {
        to: '/dashboard/instance/$instance/settings/$namespace',
        params: { instance: instanceInfo.id, namespace: 'bot' },
      },
    },
    {
      title: 'Account Settings',
      icon: (props) => (
        <DynamicIcon {...props} name={accountSettings.iconId as never} />
      ),
      linkProps: {
        to: '/dashboard/instance/$instance/accounts',
        params: { instance: instanceInfo.id },
      },
    },
    {
      title: 'Proxy Settings',
      icon: (props) => (
        <DynamicIcon {...props} name={proxySettings.iconId as never} />
      ),
      linkProps: {
        to: '/dashboard/instance/$instance/proxies',
        params: { instance: instanceInfo.id },
      },
    },
    {
      title: 'AI Settings',
      icon: (props) => (
        <DynamicIcon {...props} name={aiSettings.iconId as never} />
      ),
      linkProps: {
        to: '/dashboard/instance/$instance/settings/$namespace',
        params: { instance: instanceInfo.id, namespace: 'ai' },
      },
    },
  ];

  const pluginSettingLinks: NavLinks = clientInfo.instanceSettings
    .filter((setting) => setting.owningPlugin !== undefined)
    .map((setting) => ({
      title: setting.pageName,
      icon: (props) => (
        <DynamicIcon {...props} name={setting.iconId as never} />
      ),
      linkProps: {
        to: '/dashboard/instance/$instance/settings/$namespace',
        params: {
          instance: instanceInfo.id,
          namespace: setting.namespace,
        },
      },
    }));

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Settings</SidebarGroupLabel>
      <SidebarMenu>
        {navLinks.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <Link
                activeProps={{
                  'data-active': true,
                }}
                {...item.linkProps}
              >
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        <Collapsible
          asChild
          defaultOpen={expandPluginSettings}
          open={pluginCollapsibleOpen}
          onOpenChange={setPluginCollapsibleOpen}
          className="group/collapsible"
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
              <SidebarMenuButton tooltip="Plugin Settings">
                <BlocksIcon />
                <span>Plugin Settings</span>
                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {pluginSettingLinks.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton asChild>
                      <Link
                        activeProps={{
                          'data-active': true,
                        }}
                        {...subItem.linkProps}
                      >
                        <subItem.icon />
                        <span>{subItem.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
