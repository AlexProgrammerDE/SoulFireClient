import type { JsonValue } from "@protobuf-ts/runtime";
import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { Suspense, use, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import DynamicIcon from "@/components/dynamic-icon.tsx";
import { ExternalLink } from "@/components/external-link.tsx";
import {
  createSettingsRegistry,
  SettingsRegistryContext,
  useSettingsDefinition,
} from "@/components/providers/settings-registry-context.tsx";
import { TransportContext } from "@/components/providers/transport-context.tsx";
import { SettingTypeRenderer } from "@/components/settings-page.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Value } from "@/generated/google/protobuf/struct.ts";
import { BotServiceClient } from "@/generated/soulfire/bot.client.ts";
import type { BotInfoResponse } from "@/generated/soulfire/bot.ts";
import type {
  ServerPlugin,
  SettingsDefinition,
  SettingsEntryIdentifier,
  SettingsPage,
} from "@/generated/soulfire/common.ts";
import { useIsMobile } from "@/hooks/use-mobile.ts";
import type { ProfileAccount } from "@/lib/types.ts";
import { getSettingIdentifierKey, updateBotConfigEntry } from "@/lib/utils.tsx";

// Scope 2 = per-bot settings
const PER_BOT_SCOPE = 2;

type BotSettingsPage = SettingsPage & {
  plugin?: ServerPlugin;
};

function getBotSettingsPages(
  instanceSettings: SettingsPage[],
  settingsDefinitions: SettingsDefinition[],
  plugins: ServerPlugin[],
): BotSettingsPage[] {
  // Build a set of all per-bot setting identifiers (scope 2)
  const perBotDefinitionIds = new Set(
    settingsDefinitions
      .filter((def) => def.scope === PER_BOT_SCOPE)
      .map((def) => getSettingIdentifierKey(def.id as SettingsEntryIdentifier)),
  );

  // Go through all pages in order, filter entries to only include per-bot settings
  return instanceSettings
    .map((page) => {
      const filteredEntries = page.entries.filter((entry) =>
        perBotDefinitionIds.has(getSettingIdentifierKey(entry)),
      );

      // Find plugin info if this is a plugin page
      const plugin = page.owningPluginId
        ? plugins.find((p) => p.id === page.owningPluginId)
        : undefined;

      return {
        ...page,
        entries: filteredEntries,
        plugin,
      };
    })
    .filter((page) => page.entries.length > 0);
}

function convertBotConfigToSettings(
  botInfo: BotInfoResponse,
): Record<string, Record<string, JsonValue>> {
  const settings: Record<string, Record<string, JsonValue>> = {};
  for (const namespace of botInfo.config?.settings ?? []) {
    const entries: Record<string, JsonValue> = {};
    for (const entry of namespace.entries) {
      entries[entry.key] = Value.toJson(entry.value as Value);
    }
    settings[namespace.namespace] = entries;
  }
  return settings;
}

type AccountConfigDialogProps = {
  account: ProfileAccount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AccountConfigDialog({
  account,
  open,
  onOpenChange,
}: AccountConfigDialogProps) {
  const { t } = useTranslation("instance");
  const isMobile = useIsMobile();
  const [selectedPage, setSelectedPage] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]"
      >
        <DialogTitle className="sr-only">
          {t("account.config.title", { name: account.lastKnownName })}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {t("account.config.description")}
        </DialogDescription>
        <Suspense fallback={<DialogSkeleton isMobile={isMobile} />}>
          <DialogContentInner
            account={account}
            selectedPage={selectedPage}
            setSelectedPage={setSelectedPage}
            isMobile={isMobile}
          />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}

function DialogSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <SidebarProvider className="items-start">
      {!isMobile && (
        <Sidebar collapsible="none" className="hidden md:flex">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[1, 2, 3].map((i) => (
                    <SidebarMenuItem key={i}>
                      <SidebarMenuButton disabled>
                        <Skeleton className="size-4" />
                        <Skeleton className="h-4 w-24" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      )}
      <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          {isMobile ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Skeleton className="h-6 w-48" />
          )}
        </header>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <Skeleton className="h-10 w-full max-w-xl" />
          <Skeleton className="h-10 w-full max-w-xl" />
          <Skeleton className="h-10 w-full max-w-xl" />
        </div>
      </main>
    </SidebarProvider>
  );
}

function DialogContentInner({
  account,
  selectedPage,
  setSelectedPage,
  isMobile,
}: {
  account: ProfileAccount;
  selectedPage: string | null;
  setSelectedPage: (page: string) => void;
  isMobile: boolean;
}) {
  const { t } = useTranslation("instance");
  const instanceInfoQueryOptions = useRouteContext({
    from: "/_dashboard/instance/$instance",
    select: (context) => context.instanceInfoQueryOptions,
  });
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const transport = use(TransportContext);

  const botInfoQueryOptions = useMemo(
    () =>
      queryOptions({
        queryKey: ["bot-info", instanceInfo.id, account.profileId],
        queryFn: async (): Promise<BotInfoResponse> => {
          if (transport === null) {
            // Demo mode - return empty config
            return {
              config: { settings: [] },
            };
          }

          const botService = new BotServiceClient(transport);
          const result = await botService.getBotInfo({
            instanceId: instanceInfo.id,
            botId: account.profileId,
          });
          return result.response;
        },
      }),
    [instanceInfo.id, account.profileId, transport],
  );

  const { data: botInfo } = useSuspenseQuery(botInfoQueryOptions);

  const botSettingsPages = useMemo(
    () =>
      getBotSettingsPages(
        instanceInfo.instanceSettings,
        instanceInfo.settingsDefinitions,
        instanceInfo.plugins,
      ),
    [
      instanceInfo.instanceSettings,
      instanceInfo.settingsDefinitions,
      instanceInfo.plugins,
    ],
  );

  const settingsRegistry = useMemo(
    () => createSettingsRegistry(instanceInfo.settingsDefinitions),
    [instanceInfo.settingsDefinitions],
  );

  const botConfig = useMemo(
    () => convertBotConfigToSettings(botInfo),
    [botInfo],
  );

  // Auto-select first page if none selected
  useEffect(() => {
    if (selectedPage === null && botSettingsPages.length > 0) {
      setSelectedPage(botSettingsPages[0].id);
    }
  }, [selectedPage, botSettingsPages, setSelectedPage]);

  const currentPage = botSettingsPages.find((p) => p.id === selectedPage);

  return (
    <SettingsRegistryContext.Provider value={settingsRegistry}>
      <SidebarProvider className="items-start">
        {!isMobile && (
          <Sidebar collapsible="none" className="hidden h-[480px] md:flex">
            <SidebarContent className="overflow-y-auto">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {botSettingsPages.map((page) => (
                      <SidebarMenuItem key={page.id}>
                        <SidebarMenuButton
                          isActive={page.id === selectedPage}
                          onClick={() => setSelectedPage(page.id)}
                        >
                          <DynamicIcon
                            name={page.iconId}
                            className="size-4 shrink-0"
                          />
                          <span className="truncate">{page.pageName}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        )}
        <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            {isMobile ? (
              <Select
                value={selectedPage ?? undefined}
                onValueChange={setSelectedPage}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {botSettingsPages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      <div className="flex items-center gap-2">
                        <DynamicIcon
                          name={page.iconId}
                          className="size-4 shrink-0"
                        />
                        <span>{page.pageName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                {currentPage && (
                  <>
                    <DynamicIcon
                      name={currentPage.iconId}
                      className="size-4 shrink-0"
                    />
                    <span className="font-medium">
                      {t("account.config.pageTitle", {
                        name: account.lastKnownName,
                        page: currentPage.pageName,
                      })}
                    </span>
                  </>
                )}
              </div>
            )}
          </header>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            {currentPage ? (
              <BotSettingsPageContent
                page={currentPage}
                botConfig={botConfig}
                instanceId={instanceInfo.id}
                botId={account.profileId}
                botInfoQueryKey={botInfoQueryOptions.queryKey}
                settingsDefinitions={instanceInfo.settingsDefinitions}
              />
            ) : (
              <div className="text-muted-foreground">
                {t("account.config.noSettings")}
              </div>
            )}
          </div>
        </main>
      </SidebarProvider>
    </SettingsRegistryContext.Provider>
  );
}

function BotPluginInfoCard({
  page,
  plugin,
  botConfig,
  instanceId,
  botId,
  botInfoQueryKey,
  settingsDefinitions,
}: {
  page: BotSettingsPage;
  plugin: ServerPlugin;
  botConfig: Record<string, Record<string, JsonValue>>;
  instanceId: string;
  botId: string;
  botInfoQueryKey: readonly unknown[];
  settingsDefinitions: SettingsDefinition[];
}) {
  const { t } = useTranslation("common");
  const transport = use(TransportContext);
  const queryClient = useQueryClient();

  const enabledIdentifier = page.enabledIdentifier;

  // Find enabled definition
  const enabledDefinition = useMemo(
    () =>
      settingsDefinitions.find(
        (def) =>
          def.id?.key === enabledIdentifier?.key &&
          def.id?.namespace === enabledIdentifier?.namespace,
      ),
    [settingsDefinitions, enabledIdentifier],
  );

  // Get enabled value from bot config, falling back to default
  const enabledValue = useMemo(() => {
    if (!enabledIdentifier || !enabledDefinition) return true;

    const namespace = enabledIdentifier.namespace;
    const key = enabledIdentifier.key;
    const current = botConfig[namespace]?.[key];

    if (current !== undefined) {
      return current === true;
    }

    // Get default from definition (bool settings have a def field)
    if (enabledDefinition.type.oneofKind === "bool") {
      return enabledDefinition.type.bool.def;
    }

    return true;
  }, [botConfig, enabledIdentifier, enabledDefinition]);

  const setEnabledMutation = useMutation({
    mutationFn: async (value: JsonValue) => {
      if (!enabledIdentifier) return;
      await updateBotConfigEntry(
        enabledIdentifier.namespace,
        enabledIdentifier.key,
        value,
        instanceId,
        botId,
        transport,
        queryClient,
        botInfoQueryKey,
      );
    },
  });

  return (
    <Card className="container">
      <CardHeader>
        <div className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex flex-row items-center gap-2 text-xl">
            <DynamicIcon className="size-6 shrink-0" name={page.iconId} />
            {page.pageName}
          </CardTitle>
          {enabledIdentifier && (
            <Switch
              checked={enabledValue}
              onCheckedChange={setEnabledMutation.mutate}
            />
          )}
        </div>
        <CardDescription className="whitespace-pre-line">
          {plugin.description}
        </CardDescription>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">
            {t("pluginCard.version", { version: plugin.version })}
          </Badge>
          <Badge variant="secondary">
            {t("pluginCard.author", { author: plugin.author })}
          </Badge>
          <Badge variant="secondary">
            {t("pluginCard.license", { license: plugin.license })}
          </Badge>
          {plugin.website && (
            <ExternalLink
              href={plugin.website}
              className="inline-flex items-center"
            >
              <Badge variant="secondary">
                {t("pluginCard.website", { website: plugin.website })}
              </Badge>
            </ExternalLink>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}

function BotSettingsPageContent({
  page,
  botConfig,
  instanceId,
  botId,
  botInfoQueryKey,
  settingsDefinitions,
}: {
  page: BotSettingsPage;
  botConfig: Record<string, Record<string, JsonValue>>;
  instanceId: string;
  botId: string;
  botInfoQueryKey: readonly unknown[];
  settingsDefinitions: SettingsDefinition[];
}) {
  // Filter out the enabled identifier from the entries list
  const enabledIdentifier = page.enabledIdentifier;
  const filteredEntries = useMemo(() => {
    if (!enabledIdentifier) return page.entries;
    return page.entries.filter(
      (entry) =>
        !(
          entry.namespace === enabledIdentifier.namespace &&
          entry.key === enabledIdentifier.key
        ),
    );
  }, [page.entries, enabledIdentifier]);

  return (
    <div className="flex flex-col gap-4">
      {page.plugin && (
        <BotPluginInfoCard
          page={page}
          plugin={page.plugin}
          botConfig={botConfig}
          instanceId={instanceId}
          botId={botId}
          botInfoQueryKey={botInfoQueryKey}
          settingsDefinitions={settingsDefinitions}
        />
      )}
      {filteredEntries.map((entryId) => (
        <BotSettingField
          key={getSettingIdentifierKey(entryId)}
          settingId={entryId}
          botConfig={botConfig}
          instanceId={instanceId}
          botId={botId}
          botInfoQueryKey={botInfoQueryKey}
        />
      ))}
    </div>
  );
}

function BotSettingField({
  settingId,
  botConfig,
  instanceId,
  botId,
  botInfoQueryKey,
}: {
  settingId: SettingsEntryIdentifier;
  botConfig: Record<string, Record<string, JsonValue>>;
  instanceId: string;
  botId: string;
  botInfoQueryKey: readonly unknown[];
}) {
  const transport = use(TransportContext);
  const queryClient = useQueryClient();
  const definition = useSettingsDefinition(settingId);

  const value = useMemo(() => {
    if (!definition) return null;

    const namespace = settingId.namespace;
    const key = settingId.key;
    const current = botConfig[namespace]?.[key];

    if (current !== undefined) {
      return current;
    }

    // Return default value from definition
    switch (definition.type.oneofKind) {
      case "string":
        return definition.type.string.def;
      case "int":
        return definition.type.int.def;
      case "bool":
        return definition.type.bool.def;
      case "double":
        return definition.type.double.def;
      case "combo":
        return definition.type.combo.def;
      case "stringList":
        return definition.type.stringList.def;
      case "minMax":
        return {
          min: definition.type.minMax.minEntry?.def ?? null,
          max: definition.type.minMax.maxEntry?.def ?? null,
        };
      default:
        return null;
    }
  }, [botConfig, settingId, definition]);

  const setValueMutation = useMutation({
    mutationFn: async (newValue: JsonValue) => {
      await updateBotConfigEntry(
        settingId.namespace,
        settingId.key,
        newValue,
        instanceId,
        botId,
        transport,
        queryClient,
        botInfoQueryKey,
      );
    },
  });

  if (!definition || value === null) {
    return null;
  }

  return (
    <SettingTypeRenderer
      settingType={definition.type}
      value={value}
      changeCallback={setValueMutation.mutate}
    />
  );
}
