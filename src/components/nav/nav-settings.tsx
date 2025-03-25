import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar.tsx';
import { Link, LinkProps } from '@tanstack/react-router';
import { ReactNode, useContext } from 'react';
import { InstanceInfoContext } from '../providers/instance-info-context.tsx';
import { useTranslation } from 'react-i18next';
import {
  BoltIcon,
  BotIcon,
  SparklesIcon,
  UsersIcon,
  WaypointsIcon,
} from 'lucide-react';
import { hasInstancePermission } from '@/lib/utils.tsx';
import { InstancePermission } from '@/generated/soulfire/common.ts';

type NavLink = {
  title: string;
  icon: (props: { className: string }) => ReactNode;
  linkProps: LinkProps;
};

export function NavSettings() {
  const { t } = useTranslation('common');
  const instanceInfo = useContext(InstanceInfoContext);

  const navLinks: NavLink[] = [
    {
      title: t('instanceSidebar.botSettings'),
      icon: BotIcon,
      linkProps: {
        to: '/dashboard/instance/$instance/settings/$namespace',
        params: { instance: instanceInfo.id, namespace: 'bot' },
      },
    },
    {
      title: t('instanceSidebar.accountSettings'),
      icon: UsersIcon,
      linkProps: {
        to: '/dashboard/instance/$instance/accounts',
        params: { instance: instanceInfo.id },
      },
    },
    {
      title: t('instanceSidebar.proxySettings'),
      icon: WaypointsIcon,
      linkProps: {
        to: '/dashboard/instance/$instance/proxies',
        params: { instance: instanceInfo.id },
      },
    },
    {
      title: t('instanceSidebar.aiSettings'),
      icon: SparklesIcon,
      linkProps: {
        to: '/dashboard/instance/$instance/settings/$namespace',
        params: { instance: instanceInfo.id, namespace: 'ai' },
      },
    },
    ...(hasInstancePermission(
      instanceInfo,
      InstancePermission.UPDATE_INSTANCE_META,
    )
      ? [
          {
            title: t('instanceSidebar.metaSettings'),
            icon: BoltIcon,
            linkProps: {
              to: '/dashboard/instance/$instance/meta',
              params: { instance: instanceInfo.id },
            },
          } satisfies NavLink,
        ]
      : []),
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
