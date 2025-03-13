import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { ServerPlugin, SettingsPage } from '@/generated/soulfire/config.ts';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch.tsx';
import {
  getEntryValueByType,
  invalidateInstanceQuery,
  setInstanceConfig,
  updateEntry,
} from '@/lib/utils.tsx';
import { useContext, useMemo } from 'react';
import { ProfileContext } from '@/components/providers/profile-context.tsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { JsonValue } from '@protobuf-ts/runtime';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import DynamicIcon from './dynamic-icon';
import { Link } from '@tanstack/react-router';

export function PluginInfoCard(props: {
  pluginInfo: ServerPlugin;
  settingsEntry: SettingsPage;
}) {
  const { t } = useTranslation('common');
  const profile = useContext(ProfileContext);
  const instanceInfo = useContext(InstanceInfoContext);
  const transport = useContext(TransportContext);
  const queryClient = useQueryClient();
  const enabledEntry = props.settingsEntry.entries.find(
    (entry) => entry.key === props.settingsEntry.enabledKey,
  )!;
  const enabledValue = useMemo(
    () =>
      getEntryValueByType(
        props.settingsEntry.namespace,
        profile,
        enabledEntry,
      ) === true,
    [props.settingsEntry.namespace, profile, enabledEntry],
  );
  const setEnabledMutation = useMutation({
    mutationFn: async (value: JsonValue) => {
      await setInstanceConfig(
        updateEntry(
          props.settingsEntry.namespace,
          props.settingsEntry.enabledKey!,
          value,
          profile,
        ),
        instanceInfo,
        transport,
        queryClient,
      );
    },
    onSettled: () => {
      void invalidateInstanceQuery(instanceInfo, queryClient);
    },
  });

  return (
    <Card className="max-w-4xl">
      <CardHeader className="p-4">
        <div className="flex flex-row items-center justify-between gap-2">
          <Link
            to="/dashboard/instance/$instance/settings/$namespace"
            params={{
              instance: instanceInfo.id,
              namespace: props.settingsEntry.namespace,
            }}
            search={{}}
          >
            <CardTitle className="text-xl flex flex-row items-center gap-2">
              <DynamicIcon
                className="size-6 shrink-0"
                name={props.settingsEntry.iconId}
              />
              {props.settingsEntry.pageName}
            </CardTitle>
          </Link>
          <Switch
            checked={enabledValue}
            onCheckedChange={setEnabledMutation.mutate}
          />
        </div>
        <CardDescription className="whitespace-pre-line">
          {props.pluginInfo.description}
        </CardDescription>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary">
            {t('pluginCard.version', {
              version: props.pluginInfo.version,
            })}
          </Badge>
          <Badge variant="secondary">
            {t('pluginCard.author', {
              author: props.pluginInfo.author,
            })}
          </Badge>
          <Badge variant="secondary">
            {t('pluginCard.license', {
              license: props.pluginInfo.license,
            })}
          </Badge>
          <a
            href={props.pluginInfo.website}
            className="inline-flex items-center"
            target="_blank"
          >
            <Badge variant="secondary">
              {t('pluginCard.website', {
                website: props.pluginInfo.website,
              })}
            </Badge>
          </a>
        </div>
      </CardHeader>
    </Card>
  );
}
