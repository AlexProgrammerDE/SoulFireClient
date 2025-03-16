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
import { Link, LinkProps, useParams } from '@tanstack/react-router';
import { ReactNode, useContext, useState } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import DynamicIcon from '@/components/dynamic-icon.tsx';
import { InstanceInfoContext } from '../providers/instance-info-context.tsx';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible.tsx';
import { BlocksIcon, ChevronRightIcon, TelescopeIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getEntryValueByType } from '@/lib/utils.tsx';
import { ProfileContext } from '@/components/providers/profile-context.tsx';

type NavLinks = {
  title: string;
  icon: (props: { className: string }) => ReactNode;
  linkProps: LinkProps;
}[];

export function NavPlugins() {
  const { t } = useTranslation('common');
  const sidebar = useSidebar();
  const clientInfo = useContext(ClientInfoContext);
  const instanceInfo = useContext(InstanceInfoContext);
  const profile = useContext(ProfileContext);
  const namespace = useParams({
    from: '/dashboard/instance/$instance/settings/$namespace',
    select: (params) => params.namespace,
    shouldThrow: false,
  });
  const settingsEntry = clientInfo.instanceSettings.find(
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
        to: '/dashboard/instance/$instance/discover',
        params: { instance: instanceInfo.id },
      },
    },
  ];

  const pluginSettingLinks: NavLinks = clientInfo.instanceSettings
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
        to: '/dashboard/instance/$instance/settings/$namespace',
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
        <Collapsible
          asChild
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
      </SidebarMenu>
    </SidebarGroup>
  );
}
