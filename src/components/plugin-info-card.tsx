import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch.tsx';
import {
  getEntryValueByType,
  setInstanceConfig,
  updateEntry,
} from '@/lib/utils.tsx';
import { use, useMemo } from 'react';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { JsonValue } from '@protobuf-ts/runtime';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import DynamicIcon from './dynamic-icon';
import { Link, useRouteContext } from '@tanstack/react-router';
import { SettingsPage } from '@/generated/soulfire/common.ts';
import { ExternalLink } from '@/components/external-link.tsx';

export function PluginInfoCard(props: { settingsEntry: SettingsPage }) {
  const { t } = useTranslation('common');
  const instanceInfoQueryOptions = useRouteContext({
    from: '/_dashboard/instance/$instance',
    select: (context) => context.instanceInfoQueryOptions,
  });
  const { data: profile } = useSuspenseQuery({
    ...instanceInfoQueryOptions,
    select: (info) => info.profile,
  });
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const transport = use(TransportContext);
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
        instanceInfoQueryOptions.queryKey,
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
      });
    },
  });

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <div className="flex flex-row items-center justify-between gap-2">
          <Link
            to="/instance/$instance/settings/$namespace"
            params={{
              instance: instanceInfo.id,
              namespace: props.settingsEntry.namespace,
            }}
            search={{}}
          >
            <CardTitle className="flex flex-row items-center gap-2 text-xl">
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
          {props.settingsEntry.owningPlugin!.description}
        </CardDescription>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">
            {t('pluginCard.version', {
              version: props.settingsEntry.owningPlugin!.version,
            })}
          </Badge>
          <Badge variant="secondary">
            {t('pluginCard.author', {
              author: props.settingsEntry.owningPlugin!.author,
            })}
          </Badge>
          <Badge variant="secondary">
            {t('pluginCard.license', {
              license: props.settingsEntry.owningPlugin!.license,
            })}
          </Badge>
          <ExternalLink
            href={props.settingsEntry.owningPlugin!.website}
            className="inline-flex items-center"
          >
            <Badge variant="secondary">
              {t('pluginCard.website', {
                website: props.settingsEntry.owningPlugin!.website,
              })}
            </Badge>
          </ExternalLink>
        </div>
      </CardHeader>
    </Card>
  );
}
