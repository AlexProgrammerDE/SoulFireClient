import type { JsonValue } from "@protobuf-ts/runtime";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { use, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "@/components/external-link.tsx";
import { TransportContext } from "@/components/providers/transport-context.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import type {
  ServerPlugin,
  SettingsPage,
  SettingsPageEntry,
} from "@/generated/soulfire/common.ts";
import type { BaseSettings } from "@/lib/types.ts";
import {
  getEntryValueByType,
  setInstanceConfig,
  setServerConfig,
  updateEntry,
} from "@/lib/utils.tsx";
import DynamicIcon from "./dynamic-icon";

function PluginInfoCardContent(props: {
  settingsEntry: SettingsPage;
  plugin: ServerPlugin;
  link: ReactNode;
  enabledValue: boolean;
  onEnabledChange: (value: boolean) => void;
}) {
  const { t } = useTranslation("common");

  return (
    <Card className="container">
      <CardHeader>
        <div className="flex flex-row items-center justify-between gap-2">
          {props.link}
          <Switch
            checked={props.enabledValue}
            onCheckedChange={props.onEnabledChange}
          />
        </div>
        <CardDescription className="whitespace-pre-line">
          {props.plugin.description}
        </CardDescription>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">
            {t("pluginCard.version", {
              version: props.plugin.version,
            })}
          </Badge>
          <Badge variant="secondary">
            {t("pluginCard.author", {
              author: props.plugin.author,
            })}
          </Badge>
          <Badge variant="secondary">
            {t("pluginCard.license", {
              license: props.plugin.license,
            })}
          </Badge>
          {props.plugin.website && (
            <ExternalLink
              href={props.plugin.website}
              className="inline-flex items-center"
            >
              <Badge variant="secondary">
                {t("pluginCard.website", {
                  website: props.plugin.website,
                })}
              </Badge>
            </ExternalLink>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}

function PluginCardTitle(props: { settingsEntry: SettingsPage }) {
  return (
    <CardTitle className="flex flex-row items-center gap-2 text-xl">
      <DynamicIcon
        className="size-6 shrink-0"
        name={props.settingsEntry.iconId}
      />
      {props.settingsEntry.pageName}
    </CardTitle>
  );
}

function usePluginEnabledState(
  settingsEntry: SettingsPage,
  profile: BaseSettings,
) {
  const enabledIdentifier = settingsEntry.enabledIdentifier;
  const enabledEntry = settingsEntry.entries.find(
    (entry) =>
      entry.id?.key === enabledIdentifier?.key &&
      entry.id?.namespace === enabledIdentifier?.namespace,
  ) as SettingsPageEntry;
  const enabledValue = useMemo(
    () => getEntryValueByType(profile, enabledEntry) === true,
    [profile, enabledEntry],
  );
  return { enabledIdentifier, enabledValue };
}

export function PluginInfoCard(props: {
  settingsEntry: SettingsPage;
  plugin: ServerPlugin;
}) {
  const instanceInfoQueryOptions = useRouteContext({
    from: "/_dashboard/instance/$instance",
    select: (context) => context.instanceInfoQueryOptions,
  });
  const { data: profile } = useSuspenseQuery({
    ...instanceInfoQueryOptions,
    select: (info) => info.profile,
  });
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const transport = use(TransportContext);
  const queryClient = useQueryClient();

  const { enabledIdentifier, enabledValue } = usePluginEnabledState(
    props.settingsEntry,
    profile,
  );

  const setEnabledMutation = useMutation({
    mutationFn: async (value: JsonValue) => {
      if (!enabledIdentifier) return;
      await setInstanceConfig(
        updateEntry(
          enabledIdentifier.namespace,
          enabledIdentifier.key,
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
    <PluginInfoCardContent
      settingsEntry={props.settingsEntry}
      plugin={props.plugin}
      enabledValue={enabledValue}
      onEnabledChange={setEnabledMutation.mutate}
      link={
        <Link
          to="/instance/$instance/settings/$pageId"
          params={{
            instance: instanceInfo.id,
            pageId: props.settingsEntry.id,
          }}
          search={{}}
        >
          <PluginCardTitle settingsEntry={props.settingsEntry} />
        </Link>
      }
    />
  );
}

export function ServerPluginInfoCard(props: {
  settingsEntry: SettingsPage;
  plugin: ServerPlugin;
}) {
  const serverInfoQueryOptions = useRouteContext({
    from: "/_dashboard/user/admin",
    select: (context) => context.serverInfoQueryOptions,
  });
  const { data: profile } = useSuspenseQuery({
    ...serverInfoQueryOptions,
    select: (info) => info.profile,
  });
  const transport = use(TransportContext);
  const queryClient = useQueryClient();

  const { enabledIdentifier, enabledValue } = usePluginEnabledState(
    props.settingsEntry,
    profile,
  );

  const setEnabledMutation = useMutation({
    mutationFn: async (value: JsonValue) => {
      if (!enabledIdentifier) return;
      await setServerConfig(
        updateEntry(
          enabledIdentifier.namespace,
          enabledIdentifier.key,
          value,
          profile,
        ),
        transport,
        queryClient,
        serverInfoQueryOptions.queryKey,
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: serverInfoQueryOptions.queryKey,
      });
    },
  });

  return (
    <PluginInfoCardContent
      settingsEntry={props.settingsEntry}
      plugin={props.plugin}
      enabledValue={enabledValue}
      onEnabledChange={setEnabledMutation.mutate}
      link={
        <Link
          to="/user/admin/settings/$pageId"
          params={{
            pageId: props.settingsEntry.id,
          }}
          search={{}}
        >
          <PluginCardTitle settingsEntry={props.settingsEntry} />
        </Link>
      }
    />
  );
}
