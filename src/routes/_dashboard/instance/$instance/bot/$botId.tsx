import {
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  CameraIcon,
  CompassIcon,
  EyeIcon,
  HandIcon,
  HeartIcon,
  KeyRoundIcon,
  LoaderIcon,
  MonitorIcon,
  MonitorSmartphoneIcon,
  MousePointerClickIcon,
  PackageIcon,
  PauseIcon,
  PlayIcon,
  RefreshCwIcon,
  RotateCcwKeyIcon,
  ShieldIcon,
  SparklesIcon,
  TerminalIcon,
  Trash2Icon,
  UtensilsIcon,
  WifiOffIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import CommandInput from "@/components/command-input.tsx";
import InstancePageLayout from "@/components/nav/instance/instance-page-layout.tsx";
import { TerminalComponent } from "@/components/terminal.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { BotServiceClient } from "@/generated/soulfire/bot.client.ts";
import type {
  BotInfoResponse,
  BotInventoryClickRequest,
  BotInventoryStateResponse,
  BotLiveState,
  BotMouseClickRequest,
  InventorySlot,
  SlotRegion,
} from "@/generated/soulfire/bot.ts";
import {
  ClickType,
  MouseButton,
  SlotRegionType,
} from "@/generated/soulfire/bot.ts";
import type { CommandScope } from "@/generated/soulfire/command.ts";
import {
  InstancePermission,
  MinecraftAccountProto_AccountTypeProto,
} from "@/generated/soulfire/common.ts";
import type { LogScope } from "@/generated/soulfire/logs.ts";
import {
  getEnumKeyByValue,
  type InstanceInfoQueryData,
  mapUnionToValue,
  type ProfileAccount,
} from "@/lib/types.ts";
import { hasInstancePermission } from "@/lib/utils.tsx";
import { createTransport } from "@/lib/web-rpc.ts";

export const Route = createFileRoute(
  "/_dashboard/instance/$instance/bot/$botId",
)({
  beforeLoad: (props) => {
    const { instance, botId } = props.params;
    const botInfoQueryOptions = queryOptions({
      queryKey: ["bot-info", instance, botId],
      queryFn: async (queryProps): Promise<BotInfoResponse> => {
        const transport = createTransport();
        if (transport === null) {
          // Demo mode - return empty config with no live state
          return { config: { settings: [] } };
        }
        const botService = new BotServiceClient(transport);
        const result = await botService.getBotInfo(
          { instanceId: instance, botId },
          { abort: queryProps.signal },
        );
        return result.response;
      },
      refetchInterval: 1_000, // Faster polling for live data
    });
    return { botInfoQueryOptions };
  },
  loader: (props) => {
    void props.context.queryClient.prefetchQuery(
      props.context.botInfoQueryOptions,
    );
  },
  component: BotDetail,
});

const accountTypeLabel = (
  type: keyof typeof MinecraftAccountProto_AccountTypeProto,
) =>
  mapUnionToValue(type, (key) => {
    switch (key) {
      case "OFFLINE":
        return "Offline Account";
      case "MICROSOFT_JAVA_CREDENTIALS":
        return "Java (Credentials)";
      case "MICROSOFT_JAVA_DEVICE_CODE":
        return "Java (Device Code)";
      case "MICROSOFT_JAVA_REFRESH_TOKEN":
        return "Java (Refresh Token)";
      case "MICROSOFT_BEDROCK_CREDENTIALS":
        return "Bedrock (Credentials)";
      case "MICROSOFT_BEDROCK_DEVICE_CODE":
        return "Bedrock (Device Code)";
    }
  });

const accountTypeToIcon = (
  type: keyof typeof MinecraftAccountProto_AccountTypeProto,
) =>
  mapUnionToValue(type, (key) => {
    switch (key) {
      case "OFFLINE":
        return WifiOffIcon;
      case "MICROSOFT_JAVA_CREDENTIALS":
        return KeyRoundIcon;
      case "MICROSOFT_JAVA_DEVICE_CODE":
        return MonitorSmartphoneIcon;
      case "MICROSOFT_JAVA_REFRESH_TOKEN":
        return RotateCcwKeyIcon;
      case "MICROSOFT_BEDROCK_CREDENTIALS":
        return KeyRoundIcon;
      case "MICROSOFT_BEDROCK_DEVICE_CODE":
        return MonitorSmartphoneIcon;
    }
  });

function BotDetail() {
  const { t } = useTranslation("common");
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const { botId } = Route.useParams();

  // Find the account
  const account = useMemo(
    () => instanceInfo.profile.accounts.find((a) => a.profileId === botId),
    [instanceInfo.profile.accounts, botId],
  );

  if (!account) {
    return (
      <InstancePageLayout
        extraCrumbs={[
          { id: "controls", content: t("breadcrumbs.controls") },
          { id: "bots", content: t("breadcrumbs.bots") },
        ]}
        pageName={t("pageName.botDetail")}
      >
        <div className="container flex flex-col items-center justify-center gap-4 py-8">
          <p className="text-muted-foreground">Bot not found</p>
          <Button asChild variant="outline">
            <Link
              to="/instance/$instance/bots"
              params={{ instance: instanceInfo.id }}
            >
              <ArrowLeftIcon className="mr-2 size-4" />
              Back to Bots
            </Link>
          </Button>
        </div>
      </InstancePageLayout>
    );
  }

  return (
    <InstancePageLayout
      extraCrumbs={[
        { id: "controls", content: t("breadcrumbs.controls") },
        { id: "bots", content: t("breadcrumbs.bots") },
      ]}
      pageName={account.lastKnownName}
    >
      <BotDetailContent account={account} instanceId={instanceInfo.id} />
    </InstancePageLayout>
  );
}

function BotDetailContent({
  account,
  instanceId,
}: {
  account: ProfileAccount;
  instanceId: string;
}) {
  const { t } = useTranslation("instance");
  const { botInfoQueryOptions, instanceInfoQueryOptions } =
    Route.useRouteContext();
  const { data: botInfo } = useSuspenseQuery(botInfoQueryOptions);
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);

  const isOnline = !!botInfo.liveState;
  const typeKey = getEnumKeyByValue(
    MinecraftAccountProto_AccountTypeProto,
    account.type,
  );
  const TypeIcon = accountTypeToIcon(typeKey);

  const logScope = useMemo<LogScope>(
    () => ({
      scope: {
        oneofKind: "personal",
        personal: {},
      },
    }),
    [],
  );

  const commandScope = useMemo<CommandScope>(
    () => ({
      scope: {
        oneofKind: "bot",
        bot: {
          instanceId,
          botId: account.profileId,
        },
      },
    }),
    [instanceId, account.profileId],
  );

  return (
    <div className="container flex flex-col gap-4 py-4">
      {/* Back button */}
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/instance/$instance/bots" params={{ instance: instanceId }}>
            <ArrowLeftIcon className="mr-2 size-4" />
            {t("bots.backToBots")}
          </Link>
        </Button>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          {/* Bot info card */}
          <BotSkinPreview
            account={account}
            isOnline={isOnline}
            skinTextureHash={botInfo.liveState?.skinTextureHash}
            typeKey={typeKey}
            TypeIcon={TypeIcon}
          />

          {/* Stats panel (health, food, xp) */}
          <BotStatsPanel liveState={botInfo.liveState} isOnline={isOnline} />

          {/* Inventory panel */}
          <BotInventoryPanel
            isOnline={isOnline}
            instanceId={instanceId}
            botId={account.profileId}
          />

          {/* Actions panel */}
          <BotActionsPanel
            isOnline={isOnline}
            instanceId={instanceId}
            botId={account.profileId}
          />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* POV Render panel */}
          <BotPovPanel
            instanceId={instanceId}
            botId={account.profileId}
            isOnline={isOnline}
          />

          {/* Position panel */}
          <BotPositionPanel liveState={botInfo.liveState} isOnline={isOnline} />

          {/* Visual panel with compass */}
          <BotVisualPanel liveState={botInfo.liveState} isOnline={isOnline} />

          {/* Terminal panel with personal logs */}
          <BotTerminalPanel
            logScope={logScope}
            commandScope={commandScope}
            instanceInfo={instanceInfo}
          />
        </div>
      </div>
    </div>
  );
}

// Helper to get the avatar URL based on online status and skin hash
function getAvatarUrl(skinTextureHash?: string): string {
  if (skinTextureHash) {
    // Use the skin texture hash for online bots with skins
    return `https://mc-heads.net/body/${skinTextureHash}`;
  }
  // Default to Steve for offline bots or bots without skin data
  return "https://mc-heads.net/body/MHF_Steve";
}

function BotSkinPreview({
  account,
  isOnline,
  skinTextureHash,
  typeKey,
  TypeIcon,
}: {
  account: ProfileAccount;
  isOnline: boolean;
  skinTextureHash?: string;
  typeKey: keyof typeof MinecraftAccountProto_AccountTypeProto;
  TypeIcon: React.ComponentType<{ className?: string }>;
}) {
  const { t } = useTranslation("instance");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          {/* Full body render */}
          <img
            src={getAvatarUrl(skinTextureHash)}
            alt={account.lastKnownName}
            className="h-32 w-auto"
            loading="lazy"
          />
          <div className="flex flex-1 flex-col gap-2">
            <CardTitle className="text-2xl">{account.lastKnownName}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={isOnline ? "default" : "secondary"}
                className="text-sm"
              >
                {isOnline ? t("bots.online") : t("bots.notJoined")}
              </Badge>
              <Badge variant="outline" className="text-sm">
                <TypeIcon className="mr-1 size-3" />
                {accountTypeLabel(typeKey)}
              </Badge>
            </div>
            <CardDescription className="font-mono text-xs">
              UUID: {account.profileId}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function BotPositionPanel({
  liveState,
  isOnline,
}: {
  liveState?: BotLiveState;
  isOnline: boolean;
}) {
  const { t } = useTranslation("instance");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CompassIcon className="size-5" />
          {t("bots.positionPanel.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isOnline && liveState ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase">
                  {t("bots.positionPanel.position")}
                </p>
                <div className="mt-1 grid grid-cols-3 gap-2 font-mono text-sm">
                  <div>
                    <span className="text-muted-foreground">X:</span>{" "}
                    {liveState.x.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Y:</span>{" "}
                    {liveState.y.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Z:</span>{" "}
                    {liveState.z.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase">
                  {t("bots.positionPanel.rotation")}
                </p>
                <div className="mt-1 grid grid-cols-2 gap-2 font-mono text-sm">
                  <div>
                    <span className="text-muted-foreground">Pitch:</span>{" "}
                    {liveState.xRot.toFixed(1)}°
                  </div>
                  <div>
                    <span className="text-muted-foreground">Yaw:</span>{" "}
                    {liveState.yRot.toFixed(1)}°
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 flex items-center justify-center rounded-lg p-6">
            <p className="text-muted-foreground">
              {t("bots.positionPanel.offline")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BotTerminalPanel({
  logScope,
  commandScope,
  instanceInfo,
}: {
  logScope: LogScope;
  commandScope: CommandScope;
  instanceInfo: InstanceInfoQueryData;
}) {
  const { t } = useTranslation("instance");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <TerminalIcon className="size-5" />
          {t("bots.terminalPanel.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <TerminalComponent scope={logScope} />
        {hasInstancePermission(
          instanceInfo,
          InstancePermission.INSTANCE_COMMAND_EXECUTION,
        ) && <CommandInput scope={commandScope} />}
      </CardContent>
    </Card>
  );
}

function BotStatsPanel({
  liveState,
  isOnline,
}: {
  liveState?: BotLiveState;
  isOnline: boolean;
}) {
  const { t } = useTranslation("instance");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartIcon className="size-5" />
          {t("bots.statsPanel.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isOnline && liveState ? (
          <div className="space-y-4">
            {/* Health bar */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <HeartIcon className="size-4 text-red-500" />
                  <span className="text-sm font-medium">
                    {t("bots.statsPanel.health")}
                  </span>
                </div>
                <span className="font-mono text-sm">
                  {liveState.health.toFixed(1)} /{" "}
                  {liveState.maxHealth.toFixed(1)}
                </span>
              </div>
              <div className="bg-muted h-3 overflow-hidden rounded-full">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{
                    width: `${(liveState.health / liveState.maxHealth) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Food bar */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <UtensilsIcon className="size-4 text-amber-500" />
                  <span className="text-sm font-medium">
                    {t("bots.statsPanel.food")}
                  </span>
                </div>
                <span className="font-mono text-sm">
                  {liveState.foodLevel} / 20
                </span>
              </div>
              <div className="bg-muted h-3 overflow-hidden rounded-full">
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${(liveState.foodLevel / 20) * 100}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {t("bots.statsPanel.saturation")}:{" "}
                {liveState.saturationLevel.toFixed(1)}
              </p>
            </div>

            {/* Experience bar */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <SparklesIcon className="size-4 text-green-500" />
                  <span className="text-sm font-medium">
                    {t("bots.statsPanel.experience")}
                  </span>
                </div>
                <span className="font-mono text-sm">
                  {t("bots.statsPanel.level")} {liveState.experienceLevel}
                </span>
              </div>
              <div className="bg-muted h-3 overflow-hidden rounded-full">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${liveState.experienceProgress * 100}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {(liveState.experienceProgress * 100).toFixed(0)}%{" "}
                {t("bots.statsPanel.toNextLevel")}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 flex items-center justify-center rounded-lg p-6">
            <p className="text-muted-foreground">
              {t("bots.statsPanel.offline")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BotPovPanel({
  instanceId,
  botId,
  isOnline,
}: {
  instanceId: string;
  botId: string;
  isOnline: boolean;
}) {
  const { t } = useTranslation("instance");
  const [povImage, setPovImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const isLoadingRef = useRef(false);

  const renderPov = useCallback(async () => {
    // Prevent overlapping requests
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const transport = createTransport();
      if (transport === null) {
        // Demo mode
        setError("POV rendering not available in demo mode");
        return;
      }

      const botService = new BotServiceClient(transport);
      const result = await botService.renderBotPov({
        instanceId,
        botId,
        width: 854,
        height: 480,
      });

      setPovImage(result.response.imageBase64);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to render POV");
      // Stop auto-refresh on error
      setAutoRefresh(false);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [instanceId, botId]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !isOnline) return;

    // Capture immediately when auto-refresh is enabled
    void renderPov();

    const interval = setInterval(() => {
      void renderPov();
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, isOnline, renderPov]);

  // Stop auto-refresh when going offline
  useEffect(() => {
    if (!isOnline) {
      setAutoRefresh(false);
    }
  }, [isOnline]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CameraIcon className="size-5" />
          {t("bots.povPanel.title")}
          {isOnline && (
            <div className="ml-auto flex gap-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                title={
                  autoRefresh
                    ? t("bots.povPanel.stopAutoRefresh")
                    : t("bots.povPanel.startAutoRefresh")
                }
              >
                {autoRefresh ? (
                  <PauseIcon className="mr-1 size-4" />
                ) : (
                  <PlayIcon className="mr-1 size-4" />
                )}
                {t("bots.povPanel.auto")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={renderPov}
                disabled={isLoading || autoRefresh}
              >
                {isLoading ? (
                  <LoaderIcon className="mr-1 size-4 animate-spin" />
                ) : (
                  <RefreshCwIcon className="mr-1 size-4" />
                )}
                {povImage
                  ? t("bots.povPanel.refresh")
                  : t("bots.povPanel.capture")}
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isOnline ? (
          <div className="space-y-2">
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                {error}
              </div>
            )}
            {povImage ? (
              <div className="overflow-hidden rounded-lg">
                <img
                  src={`data:image/png;base64,${povImage}`}
                  alt="Bot POV"
                  className="w-full"
                />
              </div>
            ) : (
              <div className="bg-muted/30 flex aspect-video items-center justify-center rounded-lg">
                <div className="text-center">
                  <CameraIcon className="text-muted-foreground mx-auto size-12" />
                  <p className="text-muted-foreground mt-2 text-sm">
                    {t("bots.povPanel.clickToCapture")}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-muted/30 flex aspect-video items-center justify-center rounded-lg">
            <div className="text-center">
              <CameraIcon className="text-muted-foreground mx-auto size-12" />
              <p className="text-muted-foreground mt-2 text-sm">
                {t("bots.povPanel.offline")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatItemId(itemId: string): string {
  // Remove minecraft: prefix and format nicely
  return itemId.replace("minecraft:", "").replace(/_/g, " ");
}

function InventorySlotDisplay({
  item,
  isSelected,
  slotNumber,
  onClick,
  onRightClick,
  onShiftClick,
  isClickable,
}: {
  item?: InventorySlot;
  isSelected?: boolean;
  slotNumber?: number;
  onClick?: () => void;
  onRightClick?: () => void;
  onShiftClick?: () => void;
  isClickable?: boolean;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (e.shiftKey && onShiftClick) {
      onShiftClick();
    } else if (onClick) {
      onClick();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onRightClick) {
      onRightClick();
    }
  };

  const baseClasses = `flex size-8 items-center justify-center rounded border text-xs transition-colors ${
    isSelected ? "ring-primary ring-2" : ""
  } ${isClickable ? "cursor-pointer hover:border-primary/50" : ""}`;

  if (!item) {
    return (
      <button
        type="button"
        className={`bg-muted/50 border-border ${baseClasses}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        disabled={!isClickable}
      >
        {slotNumber !== undefined && (
          <span className="text-muted-foreground/30">{slotNumber}</span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`bg-muted border-border relative ${baseClasses}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={`${item.displayName || formatItemId(item.itemId)} x${item.count}${isClickable ? "\nLeft click: Pick up/place\nRight click: Pick up half/place one\nShift+click: Quick move" : ""}`}
      disabled={!isClickable}
    >
      <span className="max-w-full truncate px-0.5 text-center text-[10px] leading-tight">
        {formatItemId(item.itemId).slice(0, 6)}
      </span>
      {item.count > 1 && (
        <span className="absolute bottom-0 right-0.5 text-[9px] font-bold">
          {item.count}
        </span>
      )}
    </button>
  );
}

// Renders a single region of inventory slots
function SlotRegionGrid({
  region,
  slots,
  selectedHotbarSlot,
  onSlotClick,
}: {
  region: SlotRegion;
  slots: InventorySlot[];
  selectedHotbarSlot: number;
  onSlotClick: (slotIndex: number, clickType: ClickType) => void;
}) {
  const isHotbar = region.type === SlotRegionType.SLOT_REGION_HOTBAR;
  const isArmor = region.type === SlotRegionType.SLOT_REGION_ARMOR;
  const isOutput = region.type === SlotRegionType.SLOT_REGION_OUTPUT;

  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs font-medium flex items-center gap-1">
        {isArmor && <ShieldIcon className="size-3" />}
        {region.label}
        {isOutput && <span className="text-muted-foreground/50">(output)</span>}
      </p>
      <div
        className="inline-grid gap-1"
        style={{ gridTemplateColumns: `repeat(${region.columns}, 2rem)` }}
      >
        {Array.from({ length: region.slotCount }, (_, i) => {
          const slotIndex = region.startIndex + i;
          const item = slots.find((s) => s.slot === slotIndex);
          const isSelected = isHotbar && i === selectedHotbarSlot;

          return (
            <InventorySlotDisplay
              key={`${region.id}-${slotIndex}`}
              item={item}
              isSelected={isSelected}
              slotNumber={isHotbar ? i + 1 : undefined}
              isClickable={region.type !== SlotRegionType.SLOT_REGION_DISPLAY}
              onClick={() => onSlotClick(slotIndex, ClickType.LEFT_CLICK)}
              onRightClick={() => onSlotClick(slotIndex, ClickType.RIGHT_CLICK)}
              onShiftClick={() =>
                onSlotClick(slotIndex, ClickType.SHIFT_LEFT_CLICK)
              }
            />
          );
        })}
      </div>
    </div>
  );
}

function BotInventoryPanel({
  isOnline,
  instanceId,
  botId,
}: {
  isOnline: boolean;
  instanceId: string;
  botId: string;
}) {
  const { t } = useTranslation("instance");

  // Query for inventory state with layout
  const { data: inventoryState, refetch } = useSuspenseQuery(
    queryOptions({
      queryKey: ["inventory-state", instanceId, botId],
      queryFn: async (): Promise<BotInventoryStateResponse | null> => {
        if (!isOnline) return null;
        const transport = createTransport();
        if (transport === null) return null;
        const botService = new BotServiceClient(transport);
        const result = await botService.getInventoryState({
          instanceId,
          botId,
        });
        return result.response;
      },
      refetchInterval: 1_000,
    }),
  );

  // Mutation for clicking inventory slots
  const clickMutation = useMutation({
    mutationFn: async (request: BotInventoryClickRequest) => {
      const transport = createTransport();
      if (transport === null) {
        throw new Error("Not connected");
      }
      const botService = new BotServiceClient(transport);
      return botService.clickInventorySlot(request);
    },
    onSuccess: () => {
      void refetch();
    },
  });

  // Mutation for closing container
  const closeContainerMutation = useMutation({
    mutationFn: async () => {
      const transport = createTransport();
      if (transport === null) {
        throw new Error("Not connected");
      }
      const botService = new BotServiceClient(transport);
      return botService.closeContainer({ instanceId, botId });
    },
    onSuccess: () => {
      void refetch();
    },
  });

  const handleSlotClick = useCallback(
    (slotIndex: number, clickType: ClickType) => {
      clickMutation.mutate({
        instanceId,
        botId,
        slot: slotIndex,
        clickType,
        hotbarSlot: 0,
      });
    },
    [clickMutation, instanceId, botId],
  );

  const handleDropOutside = useCallback(
    (dropAll: boolean) => {
      clickMutation.mutate({
        instanceId,
        botId,
        slot: -999, // Outside slot for dropping
        clickType: dropAll ? ClickType.LEFT_CLICK : ClickType.RIGHT_CLICK,
        hotbarSlot: 0,
      });
    },
    [clickMutation, instanceId, botId],
  );

  const layout = inventoryState?.layout;
  const slots = inventoryState?.slots ?? [];
  const carriedItem = inventoryState?.carriedItem;
  const selectedHotbarSlot = inventoryState?.selectedHotbarSlot ?? 0;
  const isPlayerInventory = layout?.title === "Inventory";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageIcon className="size-5" />
          {layout?.title || t("bots.inventoryPanel.title")}
          {slots.length > 0 && (
            <Badge variant="outline" className="ml-auto">
              {slots.length} {t("bots.inventoryPanel.items")}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isOnline && layout ? (
          <div className="space-y-3">
            {/* Container controls */}
            {!isPlayerInventory && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => closeContainerMutation.mutate()}
                  disabled={closeContainerMutation.isPending}
                >
                  <XIcon className="mr-1 size-4" />
                  {t("bots.inventoryPanel.closeContainer")}
                </Button>
              </div>
            )}

            {/* Carried item indicator */}
            {carriedItem && (
              <div className="border-primary/50 bg-primary/10 flex items-center gap-2 rounded-lg border p-2">
                <HandIcon className="text-primary size-4" />
                <span className="text-sm">
                  {t("bots.inventoryPanel.carrying")}:{" "}
                  <span className="font-medium">
                    {formatItemId(carriedItem.itemId)} x{carriedItem.count}
                  </span>
                </span>
              </div>
            )}

            {/* Render all slot regions from layout */}
            {layout.regions.map((region) => (
              <SlotRegionGrid
                key={region.id}
                region={region}
                slots={slots}
                selectedHotbarSlot={selectedHotbarSlot}
                onSlotClick={handleSlotClick}
              />
            ))}

            {/* Drop zone */}
            <div className="border-destructive/30 hover:border-destructive/50 hover:bg-destructive/5 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 transition-colors">
              <Trash2Icon className="text-muted-foreground size-4" />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDropOutside(false)}
                  disabled={!carriedItem}
                  className="text-xs"
                >
                  {t("bots.inventoryPanel.dropOne")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDropOutside(true)}
                  disabled={!carriedItem}
                  className="text-xs"
                >
                  {t("bots.inventoryPanel.dropAll")}
                </Button>
              </div>
            </div>

            {/* Click instructions */}
            <p className="text-muted-foreground text-center text-xs">
              {t("bots.inventoryPanel.clickHint")}
            </p>
          </div>
        ) : (
          <div className="bg-muted/30 flex items-center justify-center rounded-lg p-6">
            <p className="text-muted-foreground">
              {t("bots.inventoryPanel.offline")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BotActionsPanel({
  isOnline,
  instanceId,
  botId,
}: {
  isOnline: boolean;
  instanceId: string;
  botId: string;
}) {
  const { t } = useTranslation("instance");

  // Mutation for mouse click actions
  const clickMutation = useMutation({
    mutationFn: async (request: BotMouseClickRequest) => {
      const transport = createTransport();
      if (transport === null) {
        throw new Error("Not connected");
      }
      const botService = new BotServiceClient(transport);
      return botService.mouseClick(request);
    },
  });

  const handleLeftClick = useCallback(() => {
    clickMutation.mutate({
      instanceId,
      botId,
      button: MouseButton.LEFT_BUTTON,
    });
  }, [clickMutation, instanceId, botId]);

  const handleRightClick = useCallback(() => {
    clickMutation.mutate({
      instanceId,
      botId,
      button: MouseButton.RIGHT_BUTTON,
    });
  }, [clickMutation, instanceId, botId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MousePointerClickIcon className="size-5" />
          {t("bots.actionsPanel.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isOnline ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleLeftClick}
              disabled={clickMutation.isPending}
              title={t("bots.actionsPanel.leftClickDescription")}
            >
              {clickMutation.isPending ? (
                <LoaderIcon className="mr-2 size-4 animate-spin" />
              ) : null}
              {t("bots.actionsPanel.leftClick")}
            </Button>
            <Button
              variant="outline"
              onClick={handleRightClick}
              disabled={clickMutation.isPending}
              title={t("bots.actionsPanel.rightClickDescription")}
            >
              {clickMutation.isPending ? (
                <LoaderIcon className="mr-2 size-4 animate-spin" />
              ) : null}
              {t("bots.actionsPanel.rightClick")}
            </Button>
          </div>
        ) : (
          <div className="bg-muted/30 flex items-center justify-center rounded-lg p-6">
            <p className="text-muted-foreground">
              {t("bots.actionsPanel.offline")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatDimension(dimension: string): string {
  // Format dimension ID like "minecraft:overworld" to "Overworld"
  const name = dimension.replace("minecraft:", "").replace(/_/g, " ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function BotVisualPanel({
  liveState,
  isOnline,
}: {
  liveState?: BotLiveState;
  isOnline: boolean;
}) {
  const { t } = useTranslation("instance");

  // Convert yaw to compass direction
  const getCompassDirection = (yaw: number) => {
    // Normalize yaw to 0-360
    const normalizedYaw = ((yaw % 360) + 360) % 360;
    if (normalizedYaw >= 337.5 || normalizedYaw < 22.5) return "S";
    if (normalizedYaw >= 22.5 && normalizedYaw < 67.5) return "SW";
    if (normalizedYaw >= 67.5 && normalizedYaw < 112.5) return "W";
    if (normalizedYaw >= 112.5 && normalizedYaw < 157.5) return "NW";
    if (normalizedYaw >= 157.5 && normalizedYaw < 202.5) return "N";
    if (normalizedYaw >= 202.5 && normalizedYaw < 247.5) return "NE";
    if (normalizedYaw >= 247.5 && normalizedYaw < 292.5) return "E";
    return "SE";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EyeIcon className="size-5" />
          {t("bots.visualPanel.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isOnline && liveState ? (
          <div className="flex flex-col gap-4">
            {/* Compass and Look direction side by side on desktop */}
            <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center md:gap-8">
              {/* Compass */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-muted-foreground text-xs font-medium uppercase">
                  {t("bots.visualPanel.compass")}
                </p>
                <div className="relative size-32">
                  {/* Compass background */}
                  <div className="border-border bg-muted/30 absolute inset-0 rounded-full border-2" />
                  {/* Cardinal directions */}
                  <span className="text-muted-foreground absolute left-1/2 top-1 -translate-x-1/2 text-xs font-bold">
                    N
                  </span>
                  <span className="text-muted-foreground absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-bold">
                    S
                  </span>
                  <span className="text-muted-foreground absolute left-1 top-1/2 -translate-y-1/2 text-xs font-bold">
                    W
                  </span>
                  <span className="text-muted-foreground absolute right-1 top-1/2 -translate-y-1/2 text-xs font-bold">
                    E
                  </span>
                  {/* Direction indicator */}
                  <div
                    className="absolute bottom-1/2 left-1/2 h-12 w-1 origin-bottom"
                    style={{
                      transform: `translateX(-50%) rotate(${liveState.yRot + 180}deg)`,
                    }}
                  >
                    <div className="bg-primary h-full w-full rounded-full" />
                    <div
                      className="border-primary absolute -top-1 left-1/2 size-0 -translate-x-1/2 border-4 border-transparent border-b-4"
                      style={{ borderBottomColor: "hsl(var(--primary))" }}
                    />
                  </div>
                  {/* Center dot */}
                  <div className="bg-primary absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">
                    {getCompassDirection(liveState.yRot)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {liveState.yRot.toFixed(1)}°
                  </p>
                </div>
              </div>

              {/* Look direction (pitch) */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-muted-foreground text-xs font-medium uppercase">
                  {t("bots.visualPanel.lookDirection")}
                </p>
                <div className="flex items-center gap-4">
                  <div className="bg-muted/30 relative h-24 w-4 overflow-hidden rounded-full">
                    {/* Pitch indicator */}
                    <div
                      className="bg-primary absolute left-0 right-0 h-2 rounded-full transition-all"
                      style={{
                        // Pitch ranges from -90 (up) to 90 (down)
                        // Map to percentage: -90 -> 0%, 0 -> 50%, 90 -> 100%
                        top: `${((liveState.xRot + 90) / 180) * 100}%`,
                        transform: "translateY(-50%)",
                      }}
                    />
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      {liveState.xRot < -30
                        ? t("bots.visualPanel.lookingUp")
                        : liveState.xRot > 30
                          ? t("bots.visualPanel.lookingDown")
                          : t("bots.visualPanel.lookingStraight")}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {liveState.xRot.toFixed(1)}°
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* World info */}
            <div className="border-border bg-muted/20 rounded-lg border p-3">
              <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                {t("bots.visualPanel.worldInfo")}
              </p>
              <div className="text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {t("bots.visualPanel.dimension")}:
                  </span>{" "}
                  <span className="font-mono">
                    {formatDimension(liveState.dimension)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 flex aspect-video items-center justify-center rounded-lg">
            <div className="text-center">
              <MonitorIcon className="text-muted-foreground mx-auto size-12" />
              <p className="text-muted-foreground mt-2 text-sm">
                {t("bots.visualPanel.offline")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
