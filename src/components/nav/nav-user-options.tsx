'use client';

import { Grid2x2Icon, PlusIcon, SettingsIcon, ZapIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar.tsx';
import { Link, LinkProps, useRouteContext } from '@tanstack/react-router';
import * as React from 'react';
import { ReactNode, use } from 'react';
import { hasGlobalPermission } from '@/lib/utils.tsx';
import { GlobalPermission } from '@/generated/soulfire/common.ts';
import { useTranslation } from 'react-i18next';
import { useSuspenseQuery } from '@tanstack/react-query';
import { CreateInstanceContext } from '@/components/providers/create-instance-provider.tsx';

type NavLinks = {
  title: string;
  icon: (props: { className: string }) => ReactNode;
  linkProps: LinkProps;
  createInstance?: boolean;
}[];

export function NavUserOptions() {
  const { t } = useTranslation('common');
  const clientDataQueryOptions = useRouteContext({
    from: '/_dashboard',
    select: (context) => context.clientDataQueryOptions,
  });
  const { data: clientInfo } = useSuspenseQuery(clientDataQueryOptions);
  const { openCreateInstance } = use(CreateInstanceContext);

  const navLinks: NavLinks = [
    {
      title: t('userSidebar.instances'),
      icon: Grid2x2Icon,
      linkProps: {
        to: '/user',
        params: {},
      },
      createInstance: true,
    },
    {
      title: t('userSidebar.access'),
      icon: ZapIcon,
      linkProps: {
        to: '/user/access',
        params: {},
      },
    },
    {
      title: t('userSidebar.settings'),
      icon: SettingsIcon,
      linkProps: {
        to: '/user/settings',
        params: {},
      },
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('userSidebar.userGroup')}</SidebarGroupLabel>
      <SidebarMenu>
        {navLinks.map((item) => (
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
            {item.createInstance &&
              hasGlobalPermission(
                clientInfo,
                GlobalPermission.CREATE_INSTANCE,
              ) && (
                <>
                  <SidebarMenuAction
                    onClick={openCreateInstance}
                    title={t('userSidebar.createInstance')}
                  >
                    <PlusIcon />
                  </SidebarMenuAction>
                </>
              )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
