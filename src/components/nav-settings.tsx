import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Link, LinkProps } from '@tanstack/react-router';
import { ReactNode, useContext } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import DynamicIcon from '@/components/dynamic-icon.tsx';
import { InstanceInfoContext } from './providers/instance-info-context';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible.tsx';
import { BlocksIcon, ChevronRightIcon } from 'lucide-react';
import { SettingsPage_Type } from '@/generated/soulfire/config.ts';

type NavLinks = {
  title: string;
  icon: (props: {}) => ReactNode;
  linkProps: LinkProps;
}[];

export function NavSettings() {
  const instanceInfo = useContext(InstanceInfoContext);
  const clientInfo = useContext(ClientInfoContext);

  const botSettings = clientInfo.settings.find(
    (settings) => settings.namespace === 'bot',
  );
  const accountSettings = clientInfo.settings.find(
    (settings) => settings.namespace === 'account',
  );
  const proxySettings = clientInfo.settings.find(
    (settings) => settings.namespace === 'proxy',
  );
  const aiSettings = clientInfo.settings.find(
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

  const pluginSettingLinks: NavLinks = clientInfo.settings
    .filter(
      (setting) =>
        setting.owningPlugin !== undefined &&
        setting.type === SettingsPage_Type.INSTANCE,
    )
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
            <SidebarMenuButton asChild>
              <Link {...item.linkProps}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        <Collapsible
          asChild
          defaultOpen={false}
          className="group/collapsible group-data-[collapsible=icon]:hidden"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
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
                      <Link {...subItem.linkProps}>
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
