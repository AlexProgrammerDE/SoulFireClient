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
import DynamicIcon, {
  convertUnsafeIconName,
} from '@/components/dynamic-icon.tsx';
import { InstanceInfoContext } from '../providers/instance-info-context.tsx';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible.tsx';
import { BlocksIcon, ChevronRightIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');
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
    throw new Error(t('settingsPage.namespacesNotFound'));
  }

  const navLinks: NavLinks = [
    {
      title: t('instanceSidebar.botSettings'),
      icon: (props) => (
        <DynamicIcon
          {...props}
          name={convertUnsafeIconName(botSettings.iconId)}
        />
      ),
      linkProps: {
        to: '/dashboard/instance/$instance/settings/$namespace',
        params: { instance: instanceInfo.id, namespace: 'bot' },
      },
    },
    {
      title: t('instanceSidebar.accountSettings'),
      icon: (props) => (
        <DynamicIcon
          {...props}
          name={convertUnsafeIconName(accountSettings.iconId)}
        />
      ),
      linkProps: {
        to: '/dashboard/instance/$instance/accounts',
        params: { instance: instanceInfo.id },
      },
    },
    {
      title: t('instanceSidebar.proxySettings'),
      icon: (props) => (
        <DynamicIcon
          {...props}
          name={convertUnsafeIconName(proxySettings.iconId)}
        />
      ),
      linkProps: {
        to: '/dashboard/instance/$instance/proxies',
        params: { instance: instanceInfo.id },
      },
    },
    {
      title: t('instanceSidebar.aiSettings'),
      icon: (props) => (
        <DynamicIcon
          {...props}
          name={convertUnsafeIconName(aiSettings.iconId)}
        />
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
        <DynamicIcon {...props} name={convertUnsafeIconName(setting.iconId)} />
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
      <SidebarGroupLabel>
        {t('instanceSidebar.settingsGroup')}
      </SidebarGroupLabel>
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
              <SidebarMenuButton tooltip={t('instanceSidebar.pluginSettings')}>
                <BlocksIcon />
                <span>{t('instanceSidebar.pluginSettings')}</span>
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
