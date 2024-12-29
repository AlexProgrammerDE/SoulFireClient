import { createFileRoute } from '@tanstack/react-router';
import { useContext } from 'react';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { InstanceSettingsPageComponent } from '@/components/settings-page.tsx';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { SettingsPage_Type } from '@/generated/soulfire/config.ts';
import SettingsPageButton from '@/components/settings-page-button.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import DynamicIcon from '@/components/dynamic-icon.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';

export const Route = createFileRoute(
  '/dashboard/_layout/$instance/settings/$namespace',
)({
  component: SettingsNamespace,
});

function SettingsNamespace() {
  const { namespace } = Route.useParams();
  const navigate = Route.useNavigate();
  const instanceInfo = useContext(InstanceInfoContext);
  const clientInfo = useContext(ClientInfoContext);
  const settingsEntry = clientInfo.settings.find(
    (s) => s.namespace === namespace,
  );
  if (!settingsEntry) {
    return (
      <div className="grow flex h-full w-full p-2">
        <div className="m-auto flex flex-col">
          <p>No settings found for {namespace}</p>
        </div>
      </div>
    );
  }

  const pluginInfo = clientInfo.plugins.find(
    (plugin) => plugin.id === settingsEntry.owningPlugin,
  );
  return (
    <div className="grow flex h-full w-full flex-row pl-2 gap-2">
      {pluginInfo && (
        <>
          <div className="shrink hidden md:flex h-full flex-col gap-1 py-2">
            {clientInfo.settings
              .filter(
                (pluginSetting) =>
                  pluginSetting.type === SettingsPage_Type.INSTANCE &&
                  pluginSetting.owningPlugin !== undefined,
              )
              .map((pluginSetting) => (
                <SettingsPageButton
                  key={pluginSetting.namespace}
                  page={pluginSetting}
                />
              ))}
          </div>
          <div className="hidden md:block">
            <Separator orientation="vertical" />
          </div>
        </>
      )}
      <div className="grow flex h-full flex-col gap-4 py-2">
        {pluginInfo && (
          <div className="flex flex-col gap-2">
            <Select
              onValueChange={(value) => {
                void navigate({
                  to: '/dashboard/$instance/settings/$namespace',
                  params: {
                    instance: instanceInfo.id,
                    namespace: value,
                  },
                });
              }}
              defaultValue={settingsEntry.namespace}
            >
              <SelectTrigger className="flex md:hidden">
                <SelectValue placeholder="Select a plugin" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {clientInfo.settings
                    .filter(
                      (pluginSetting) =>
                        pluginSetting.type === SettingsPage_Type.INSTANCE &&
                        pluginSetting.owningPlugin !== undefined,
                    )
                    .map((pluginSetting) => (
                      <SelectItem
                        key={pluginSetting.namespace}
                        value={pluginSetting.namespace}
                      >
                        <div className="inline-flex items-center">
                          <div>
                            <DynamicIcon
                              name={pluginSetting.iconId as never}
                              className="mr-2 h-4 w-4"
                            />
                          </div>
                          <span>{pluginSetting.pageName}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Card className="max-w-4xl">
              <CardHeader className="p-4">
                <CardTitle className="text-xl">
                  {settingsEntry.pageName}
                </CardTitle>
                <CardDescription>{pluginInfo.description}</CardDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">
                    Version: {pluginInfo.version}
                  </Badge>
                  <Badge variant="secondary">Author: {pluginInfo.author}</Badge>
                  <Badge variant="secondary">
                    License: {pluginInfo.license}
                  </Badge>
                  <a
                    href={pluginInfo.website}
                    className="inline-flex items-center"
                    target="_blank"
                  >
                    <Badge variant="secondary">Website</Badge>
                  </a>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <InstanceSettingsPageComponent data={settingsEntry} />
        </div>
      </div>
    </div>
  );
}
