import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar.tsx';
import { Link, LinkProps } from '@tanstack/react-router';
import { ReactNode, useContext } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import DynamicIcon from '@/components/dynamic-icon.tsx';
import { InstanceInfoContext } from '../providers/instance-info-context.tsx';
import { useTranslation } from 'react-i18next';

type NavLinks = {
  title: string;
  icon: (props: { className: string }) => ReactNode;
  linkProps: LinkProps;
}[];

export function NavSettings() {
  const { t } = useTranslation('common');
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
      icon: (props) => <DynamicIcon {...props} name={botSettings.iconId} />,
      linkProps: {
        to: '/dashboard/instance/$instance/settings/$namespace',
        params: { instance: instanceInfo.id, namespace: 'bot' },
      },
    },
    {
      title: t('instanceSidebar.accountSettings'),
      icon: (props) => <DynamicIcon {...props} name={accountSettings.iconId} />,
      linkProps: {
        to: '/dashboard/instance/$instance/accounts',
        params: { instance: instanceInfo.id },
      },
    },
    {
      title: t('instanceSidebar.proxySettings'),
      icon: (props) => <DynamicIcon {...props} name={proxySettings.iconId} />,
      linkProps: {
        to: '/dashboard/instance/$instance/proxies',
        params: { instance: instanceInfo.id },
      },
    },
    {
      title: t('instanceSidebar.aiSettings'),
      icon: (props) => <DynamicIcon {...props} name={aiSettings.iconId} />,
      linkProps: {
        to: '/dashboard/instance/$instance/settings/$namespace',
        params: { instance: instanceInfo.id, namespace: 'ai' },
      },
    },
  ];

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
