import type { JsonValue } from "@protobuf-ts/runtime";
import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { BotIcon, RouteIcon, SparklesIcon } from "lucide-react";
import { type ReactNode, Suspense, use, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createSettingsRegistry,
  SettingsRegistryContext,
  useSettingsDefinition,
} from "@/components/providers/settings-registry-context.tsx";
import { TransportContext } from "@/components/providers/transport-context.tsx";
import { SettingTypeRenderer } from "@/components/settings-page.tsx";
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
import { Value } from "@/generated/google/protobuf/struct.ts";
import { BotServiceClient } from "@/generated/soulfire/bot.client.ts";
import type { BotInfoResponse } from "@/generated/soulfire/bot.ts";
import type {
  SettingsDefinition,
  SettingsEntryIdentifier,
  SettingsPage,
} from "@/generated/soulfire/common.ts";
import { useIsMobile } from "@/hooks/use-mobile.ts";
import type { ProfileAccount } from "@/lib/types.ts";
import { getSettingIdentifierKey, updateBotConfigEntry } from "@/lib/utils.tsx";

type NavItem = {
  id: string;
  name: string;
  icon: (props: { className?: string }) => ReactNode;
};

const BOT_SETTINGS_NAV: NavItem[] = [
  { id: "bot", name: "Bot", icon: BotIcon },
  { id: "ai", name: "AI", icon: SparklesIcon },
  { id: "pathfinding", name: "Pathfinding", icon: RouteIcon },
];

// Scope 2 = per-bot settings
const PER_BOT_SCOPE = 2;

function getBotSettingsPages(
  instanceSettings: SettingsPage[],
  settingsDefinitions: SettingsDefinition[],
): SettingsPage[] {
  // Filter settings pages to only include entries with scope 2 (per-bot)
  const perBotDefinitionIds = new Set(
    settingsDefinitions
      .filter((def) => def.scope === PER_BOT_SCOPE)
      .map((def) => getSettingIdentifierKey(def.id as SettingsEntryIdentifier)),
  );

  return instanceSettings
    .filter((page) => BOT_SETTINGS_NAV.some((nav) => nav.id === page.id))
    .map((page) => ({
      ...page,
      entries: page.entries.filter((entry) =>
        perBotDefinitionIds.has(getSettingIdentifierKey(entry)),
      ),
    }))
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
  const [selectedPage, setSelectedPage] = useState(BOT_SETTINGS_NAV[0].id);

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
                  {BOT_SETTINGS_NAV.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton disabled>
                        <item.icon />
                        <span>{item.name}</span>
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
  selectedPage: string;
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
      ),
    [instanceInfo.instanceSettings, instanceInfo.settingsDefinitions],
  );

  const settingsRegistry = useMemo(
    () => createSettingsRegistry(instanceInfo.settingsDefinitions),
    [instanceInfo.settingsDefinitions],
  );

  const botConfig = useMemo(
    () => convertBotConfigToSettings(botInfo),
    [botInfo],
  );

  const currentPage = botSettingsPages.find((p) => p.id === selectedPage);
  const currentNavItem = BOT_SETTINGS_NAV.find((n) => n.id === selectedPage);

  return (
    <SettingsRegistryContext.Provider value={settingsRegistry}>
      <SidebarProvider className="items-start">
        {!isMobile && (
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {BOT_SETTINGS_NAV.filter((nav) =>
                      botSettingsPages.some((p) => p.id === nav.id),
                    ).map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={item.id === selectedPage}
                          onClick={() => setSelectedPage(item.id)}
                        >
                          <item.icon />
                          <span>{item.name}</span>
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
              <Select value={selectedPage} onValueChange={setSelectedPage}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOT_SETTINGS_NAV.filter((nav) =>
                    botSettingsPages.some((p) => p.id === nav.id),
                  ).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-2">
                        <item.icon className="size-4" />
                        <span>{item.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                {currentNavItem && (
                  <>
                    <currentNavItem.icon className="size-4" />
                    <span className="font-medium">
                      {t("account.config.pageTitle", {
                        name: account.lastKnownName,
                        page: currentNavItem.name,
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

function BotSettingsPageContent({
  page,
  botConfig,
  instanceId,
  botId,
  botInfoQueryKey,
}: {
  page: SettingsPage;
  botConfig: Record<string, Record<string, JsonValue>>;
  instanceId: string;
  botId: string;
  botInfoQueryKey: readonly unknown[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {page.entries.map((entryId) => (
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
