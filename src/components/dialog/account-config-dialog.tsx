import type { JsonValue } from "@protobuf-ts/runtime";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import DynamicIcon from "@/components/dynamic-icon.tsx";
import { BotPluginInfoCard } from "@/components/instance-plugin-info-card.tsx";
import { BotSettingsPageComponent } from "@/components/settings-page.tsx";
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
import {
  type ServerPlugin,
  type SettingsDefinition,
  type SettingsEntryIdentifier,
  type SettingsPage,
  SettingsPageEntryScopeType,
} from "@/generated/soulfire/common.ts";
import { useIsMobile } from "@/hooks/use-mobile.ts";
import type { BaseSettings, ProfileAccount } from "@/lib/types.ts";
import { getSettingIdentifierKey } from "@/lib/utils.tsx";

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
      .filter((def) => def.scope === SettingsPageEntryScopeType.BOT)
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

function convertAccountConfigToSettings(
  account: ProfileAccount,
): Record<string, Record<string, JsonValue>> {
  const settings: Record<string, Record<string, JsonValue>> = {};
  for (const namespace of account.config) {
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
    <SidebarProvider className="h-[480px] min-h-0 items-stretch">
      {!isMobile && (
        <Sidebar collapsible="none" className="hidden md:flex">
          <SidebarContent className="overflow-y-auto">
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
      <main className="flex flex-1 flex-col overflow-hidden">
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

  const botSettingsConfig: BaseSettings = useMemo(
    () => ({ settings: convertAccountConfigToSettings(account) }),
    [account],
  );

  // Auto-select first page if none selected
  useEffect(() => {
    if (selectedPage === null && botSettingsPages.length > 0) {
      setSelectedPage(botSettingsPages[0].id);
    }
  }, [selectedPage, botSettingsPages, setSelectedPage]);

  const currentPage = botSettingsPages.find((p) => p.id === selectedPage);

  return (
    <SidebarProvider className="h-[480px] min-h-0 items-stretch">
      {!isMobile && (
        <Sidebar collapsible="none" className="hidden md:flex">
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
      <main className="flex flex-1 flex-col overflow-hidden">
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
            <>
              {currentPage.plugin && (
                <BotPluginInfoCard
                  settingsEntry={currentPage}
                  plugin={currentPage.plugin}
                  botConfig={botSettingsConfig}
                  instanceId={instanceInfo.id}
                  botId={account.profileId}
                  instanceInfoQueryKey={instanceInfoQueryOptions.queryKey}
                  settingsDefinitions={instanceInfo.settingsDefinitions}
                />
              )}
              <BotSettingsPageComponent
                data={currentPage}
                botConfig={botSettingsConfig}
                botId={account.profileId}
              />
            </>
          ) : (
            <div className="text-muted-foreground">
              {t("account.config.noSettings")}
            </div>
          )}
        </div>
      </main>
    </SidebarProvider>
  );
}
