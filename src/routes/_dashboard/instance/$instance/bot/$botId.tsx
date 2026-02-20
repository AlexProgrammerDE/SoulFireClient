import {
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BookOpenIcon,
  CameraIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClipboardCopyIcon,
  CompassIcon,
  EyeIcon,
  GamepadIcon,
  HandIcon,
  HeartIcon,
  KeyRoundIcon,
  LoaderIcon,
  MonitorIcon,
  MonitorSmartphoneIcon,
  MousePointerClickIcon,
  PackageIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  RefreshCwIcon,
  RotateCcwKeyIcon,
  ShieldIcon,
  SparklesIcon,
  SquareIcon,
  TerminalIcon,
  Trash2Icon,
  UtensilsIcon,
  WifiOffIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import CommandInput from "@/components/command-input.tsx";
import { ContextMenuPortal } from "@/components/context-menu-portal.tsx";
import { MenuItem } from "@/components/context-menu-primitives.tsx";
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
import { Input } from "@/components/ui/input.tsx";
import { BotServiceClient } from "@/generated/soulfire/bot.client.ts";
import type {
  BookPage,
  BotContainerButtonClickRequest,
  BotInfoResponse,
  BotInventoryClickRequest,
  BotInventoryStateResponse,
  BotLiveState,
  BotMouseClickRequest,
  BotSetContainerTextRequest,
  ContainerButton,
  ContainerTextInput,
  InventorySlot,
  SlotRegion,
} from "@/generated/soulfire/bot.ts";
import {
  ClickType,
  GameMode,
  MouseButton,
  SlotRegionType,
} from "@/generated/soulfire/bot.ts";
import type { CommandScope } from "@/generated/soulfire/command.ts";
import {
  InstancePermission,
  MinecraftAccountProto_AccountTypeProto,
} from "@/generated/soulfire/common.ts";
import type { LogScope } from "@/generated/soulfire/logs.ts";
import { useContextMenu } from "@/hooks/use-context-menu.ts";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard.ts";
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
          return {};
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

          {/* Movement control panel */}
          <BotMovementPanel
            isOnline={isOnline}
            instanceId={instanceId}
            botId={account.profileId}
            liveState={botInfo.liveState}
          />

          {/* Dialog panel */}
          <BotDialogPanel
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
  const { t: tCommon } = useTranslation("common");
  const { contextMenu, handleContextMenu, dismiss, menuRef } =
    useContextMenu<null>();
  const copyToClipboard = useCopyToClipboard();

  return (
    <>
      <Card onContextMenu={(e) => handleContextMenu(e, null)}>
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
              <CardTitle className="text-2xl">
                {account.lastKnownName}
              </CardTitle>
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
              <CardDescription className="select-text font-mono text-xs">
                UUID: {account.profileId}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
      {contextMenu && (
        <ContextMenuPortal
          x={contextMenu.position.x}
          y={contextMenu.position.y}
          menuRef={menuRef}
        >
          <MenuItem
            onClick={() => {
              copyToClipboard(account.lastKnownName);
              dismiss();
            }}
          >
            <ClipboardCopyIcon />
            {tCommon("contextMenu.bot.copyUsername")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              copyToClipboard(account.profileId);
              dismiss();
            }}
          >
            <ClipboardCopyIcon />
            {tCommon("contextMenu.bot.copyUuid")}
          </MenuItem>
        </ContextMenuPortal>
      )}
    </>
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
  const { t: tCommon } = useTranslation("common");
  const { contextMenu, handleContextMenu, dismiss, menuRef } =
    useContextMenu<null>();
  const copyToClipboard = useCopyToClipboard();

  return (
    <>
      <Card onContextMenu={(e) => handleContextMenu(e, null)}>
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
                  <div className="mt-1 grid select-text grid-cols-3 gap-2 font-mono text-sm">
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
                  <div className="mt-1 grid select-text grid-cols-2 gap-2 font-mono text-sm">
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
      {contextMenu && isOnline && liveState && (
        <ContextMenuPortal
          x={contextMenu.position.x}
          y={contextMenu.position.y}
          menuRef={menuRef}
        >
          <MenuItem
            onClick={() => {
              copyToClipboard(
                `${liveState.x.toFixed(2)}, ${liveState.y.toFixed(2)}, ${liveState.z.toFixed(2)}`,
              );
              dismiss();
            }}
          >
            <ClipboardCopyIcon />
            {tCommon("contextMenu.bot.copyCoordinates")}
          </MenuItem>
        </ContextMenuPortal>
      )}
    </>
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
                <span className="select-text font-mono text-sm">
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
                <span className="select-text font-mono text-sm">
                  {liveState.foodLevel} / 20
                </span>
              </div>
              <div className="bg-muted h-3 overflow-hidden rounded-full">
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${(liveState.foodLevel / 20) * 100}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-0.5 select-text text-xs">
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
                <span className="select-text font-mono text-sm">
                  {t("bots.statsPanel.level")} {liveState.experienceLevel}
                </span>
              </div>
              <div className="bg-muted h-3 overflow-hidden rounded-full">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${liveState.experienceProgress * 100}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-0.5 select-text text-xs">
                {(liveState.experienceProgress * 100).toFixed(0)}%{" "}
                {t("bots.statsPanel.toNextLevel")}
              </p>
            </div>

            {/* Game Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GamepadIcon className="size-4 text-purple-500" />
                <span className="text-sm font-medium">
                  {t("bots.statsPanel.gameMode")}
                </span>
              </div>
              <Badge variant="outline">
                {liveState.gameMode === GameMode.SURVIVAL
                  ? t("bots.statsPanel.survival")
                  : liveState.gameMode === GameMode.CREATIVE
                    ? t("bots.statsPanel.creative")
                    : liveState.gameMode === GameMode.ADVENTURE
                      ? t("bots.statsPanel.adventure")
                      : liveState.gameMode === GameMode.SPECTATOR
                        ? t("bots.statsPanel.spectator")
                        : t("bots.statsPanel.unknown")}
              </Badge>
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
  onMiddleClick,
  isClickable,
  containerType,
  regionId,
  hotbarIndex,
  slotIndex,
}: {
  item?: InventorySlot;
  isSelected?: boolean;
  slotNumber?: number;
  onClick?: () => void;
  onRightClick?: () => void;
  onShiftClick?: () => void;
  onMiddleClick?: () => void;
  isClickable?: boolean;
  containerType?: string;
  regionId?: string;
  hotbarIndex?: number;
  slotIndex?: number;
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

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click (button 1)
    if (e.button === 1 && onMiddleClick) {
      e.preventDefault();
      onMiddleClick();
    }
  };

  const baseClasses = `flex size-8 items-center justify-center rounded border text-xs transition-colors ${
    isSelected ? "ring-primary ring-2" : ""
  } ${isClickable ? "cursor-pointer hover:border-primary/50" : ""}`;

  const devInfoParts: string[] = [];
  if (slotIndex !== undefined) devInfoParts.push(`Slot: ${slotIndex}`);
  if (item) devInfoParts.push(`Item: ${item.itemId}`);
  if (regionId !== undefined) devInfoParts.push(`Region: ${regionId}`);
  if (containerType !== undefined)
    devInfoParts.push(`Container: ${containerType}`);
  if (hotbarIndex !== undefined) devInfoParts.push(`Hotbar: ${hotbarIndex}`);

  if (!item) {
    return (
      <button
        type="button"
        className={`bg-muted/50 border-border ${baseClasses}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        disabled={!isClickable}
        title={devInfoParts.length > 0 ? devInfoParts.join("\n") : undefined}
      >
        {slotNumber !== undefined && (
          <span className="text-muted-foreground/30">{slotNumber}</span>
        )}
      </button>
    );
  }

  const titleParts = [
    `${item.displayName || formatItemId(item.itemId)} x${item.count}`,
  ];
  if (devInfoParts.length > 0) {
    titleParts.push("", ...devInfoParts);
  }
  if (isClickable) {
    titleParts.push("", "Left click: Pick up/place");
    titleParts.push("Right click: Pick up half/place one");
    titleParts.push("Shift+click: Quick move");
  }
  if (onMiddleClick) {
    titleParts.push("Middle click: Select as active slot");
  }

  return (
    <button
      type="button"
      className={`bg-muted border-border relative ${baseClasses}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      title={titleParts.join("\n")}
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
  onHotbarSlotSelect,
  containerType,
}: {
  region: SlotRegion;
  slots: InventorySlot[];
  selectedHotbarSlot: number;
  onSlotClick: (slotIndex: number, clickType: ClickType) => void;
  onHotbarSlotSelect?: (slot: number) => void;
  containerType?: string;
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
              onMiddleClick={
                isHotbar && onHotbarSlotSelect
                  ? () => onHotbarSlotSelect(i)
                  : undefined
              }
              containerType={containerType}
              regionId={region.id}
              hotbarIndex={isHotbar ? i : undefined}
              slotIndex={slotIndex}
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
    mutationKey: ["bot", "inventory", "click", instanceId, botId],
    scope: { id: `bot-container-${instanceId}-${botId}` },
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
    mutationKey: ["bot", "container", "close", instanceId, botId],
    scope: { id: `bot-container-${instanceId}-${botId}` },
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

  // Mutation for clicking container buttons (stonecutter recipes, etc.)
  const buttonClickMutation = useMutation({
    mutationKey: ["bot", "container", "button", instanceId, botId],
    scope: { id: `bot-container-${instanceId}-${botId}` },
    mutationFn: async (request: BotContainerButtonClickRequest) => {
      const transport = createTransport();
      if (transport === null) {
        throw new Error("Not connected");
      }
      const botService = new BotServiceClient(transport);
      return botService.clickContainerButton(request);
    },
    onSuccess: () => {
      void refetch();
    },
  });

  // Mutation for setting container text (anvil rename, etc.)
  const setTextMutation = useMutation({
    mutationKey: ["bot", "container", "text", instanceId, botId],
    scope: { id: `bot-container-${instanceId}-${botId}` },
    mutationFn: async (request: BotSetContainerTextRequest) => {
      const transport = createTransport();
      if (transport === null) {
        throw new Error("Not connected");
      }
      const botService = new BotServiceClient(transport);
      return botService.setContainerText(request);
    },
    onSuccess: () => {
      void refetch();
    },
  });

  // Mutation for setting hotbar slot
  const setHotbarSlotMutation = useMutation({
    mutationKey: ["bot", "hotbar", "slot", instanceId, botId],
    scope: { id: `bot-container-${instanceId}-${botId}` },
    mutationFn: async (slot: number) => {
      const transport = createTransport();
      if (transport === null) {
        throw new Error("Not connected");
      }
      const botService = new BotServiceClient(transport);
      return botService.setHotbarSlot({ instanceId, botId, slot });
    },
    onSuccess: () => {
      void refetch();
    },
  });

  const handleSetText = useCallback(
    (fieldId: string, text: string) => {
      setTextMutation.mutate({
        instanceId,
        botId,
        fieldId,
        text,
      });
    },
    [setTextMutation, instanceId, botId],
  );

  const handleButtonClick = useCallback(
    (buttonId: number) => {
      buttonClickMutation.mutate({
        instanceId,
        botId,
        buttonId,
      });
    },
    [buttonClickMutation, instanceId, botId],
  );

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

  const handleHotbarSlotSelect = useCallback(
    (slot: number) => {
      setHotbarSlotMutation.mutate(slot);
    },
    [setHotbarSlotMutation],
  );

  const layout = inventoryState?.layout;
  const slots = inventoryState?.slots ?? [];
  const carriedItem = inventoryState?.carriedItem;
  const selectedHotbarSlot = inventoryState?.selectedHotbarSlot ?? 0;
  const isPlayerInventory = layout?.title === "Inventory";
  const buttons = layout?.buttons ?? [];
  const textInputs = layout?.textInputs ?? [];
  const bookPages = layout?.bookPages ?? [];
  const currentBookPage = layout?.currentBookPage ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageIcon className="size-5" />
          {layout?.title || t("bots.inventoryPanel.title")}
          <div className="ml-auto flex items-center gap-2">
            {carriedItem && (
              <Badge variant="default" className="gap-1">
                <HandIcon className="size-3" />
                {formatItemId(carriedItem.itemId)} x{carriedItem.count}
              </Badge>
            )}
            {slots.length > 0 && (
              <Badge variant="outline">
                {slots.length} {t("bots.inventoryPanel.items")}
              </Badge>
            )}
          </div>
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

            {/* Render all slot regions from layout */}
            {layout.regions.map((region) => (
              <SlotRegionGrid
                key={region.id}
                region={region}
                slots={slots}
                selectedHotbarSlot={selectedHotbarSlot}
                onSlotClick={handleSlotClick}
                onHotbarSlotSelect={handleHotbarSlotSelect}
                containerType={layout.containerType}
              />
            ))}

            {/* Container action buttons (stonecutter recipes, trades, etc.) */}
            {buttons.length > 0 && (
              <ContainerButtonsPanel
                buttons={buttons}
                containerType={layout.containerType}
                onButtonClick={handleButtonClick}
                isPending={buttonClickMutation.isPending}
              />
            )}

            {/* Text inputs (anvil rename, etc.) */}
            {textInputs.length > 0 && (
              <ContainerTextInputPanel
                textInputs={textInputs}
                containerType={layout.containerType}
                onSetText={handleSetText}
                isPending={setTextMutation.isPending}
              />
            )}

            {/* Book pages (lectern) */}
            {bookPages.length > 0 && (
              <BookPagesPanel
                pages={bookPages}
                currentPage={currentBookPage}
                onPageChange={handleButtonClick}
              />
            )}

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

function ContainerButtonsPanel({
  buttons,
  containerType,
  onButtonClick,
  isPending,
}: {
  buttons: ContainerButton[];
  containerType: string;
  onButtonClick: (buttonId: number) => void;
  isPending: boolean;
}) {
  const { t } = useTranslation("instance");

  // Get title based on container type
  const title = (() => {
    switch (containerType) {
      case "stonecutter":
        return t("bots.inventoryPanel.buttons.stonecutterRecipes");
      case "enchanting":
        return t("bots.inventoryPanel.buttons.enchantments");
      case "loom":
        return t("bots.inventoryPanel.buttons.patterns");
      case "merchant":
        return t("bots.inventoryPanel.buttons.trades");
      case "beacon":
        return t("bots.inventoryPanel.buttons.beaconEffects");
      case "crafter":
        return t("bots.inventoryPanel.buttons.crafterSlots");
      case "lectern":
        return t("bots.inventoryPanel.buttons.lecternControls");
      default:
        return t("bots.inventoryPanel.buttons.actions");
    }
  })();

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground text-sm font-medium">{title}</div>
      <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-lg border p-2">
        {buttons.map((button) => (
          <Button
            key={button.buttonId}
            variant={button.selected ? "default" : "outline"}
            size="sm"
            className="h-auto min-w-0 flex-shrink-0 px-2 py-1 text-xs"
            onClick={() => onButtonClick(button.buttonId)}
            disabled={isPending || button.disabled}
            title={button.description || undefined}
          >
            {button.iconItemId && (
              <span className="mr-1 font-mono text-[10px] opacity-60">
                {formatItemId(button.iconItemId)}
              </span>
            )}
            {button.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ContainerTextInputPanel({
  textInputs,
  containerType,
  onSetText,
  isPending,
}: {
  textInputs: ContainerTextInput[];
  containerType: string;
  onSetText: (fieldId: string, text: string) => void;
  isPending: boolean;
}) {
  const { t } = useTranslation("instance");
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  // Initialize local values from textInputs
  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const input of textInputs) {
      if (!(input.id in localValues)) {
        initial[input.id] = input.currentValue;
      }
    }
    if (Object.keys(initial).length > 0) {
      setLocalValues((prev) => ({ ...prev, ...initial }));
    }
  }, [textInputs, localValues]);

  const handleSubmit = (fieldId: string) => {
    const value = localValues[fieldId] ?? "";
    onSetText(fieldId, value);
  };

  // Get title based on container type
  const title =
    containerType === "anvil"
      ? t("bots.inventoryPanel.textInput.anvilRename")
      : t("bots.inventoryPanel.textInput.title");

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground text-sm font-medium">{title}</div>
      <div className="space-y-2 rounded-lg border p-2">
        {textInputs.map((input) => (
          <div key={input.id} className="flex items-center gap-2">
            <Input
              placeholder={input.placeholder || input.label}
              value={localValues[input.id] ?? input.currentValue}
              onChange={(e) =>
                setLocalValues((prev) => ({
                  ...prev,
                  [input.id]: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit(input.id);
                }
              }}
              maxLength={input.maxLength > 0 ? input.maxLength : undefined}
              className="h-8 text-sm"
              disabled={isPending}
            />
            <Button
              size="sm"
              onClick={() => handleSubmit(input.id)}
              disabled={isPending}
              className="h-8"
            >
              <PencilIcon className="size-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookPagesPanel({
  pages,
  currentPage,
  onPageChange,
}: {
  pages: BookPage[];
  currentPage: number;
  onPageChange: (buttonId: number) => void;
}) {
  const { t } = useTranslation("instance");
  const [displayPage, setDisplayPage] = useState(currentPage);

  // Sync displayPage with currentPage from server
  useEffect(() => {
    setDisplayPage(currentPage);
  }, [currentPage]);

  const currentPageContent = pages.find((p) => p.pageNumber === displayPage);
  const totalPages = pages.length;

  const handlePrevPage = () => {
    if (displayPage > 0) {
      onPageChange(1); // Button ID 1 = previous page in lectern
    }
  };

  const handleNextPage = () => {
    if (displayPage < totalPages - 1) {
      onPageChange(2); // Button ID 2 = next page in lectern
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        <BookOpenIcon className="size-4" />
        {t("bots.inventoryPanel.bookPages.title")}
      </div>
      <div className="rounded-lg border p-3">
        {/* Page content */}
        <div className="bg-muted/30 mb-2 min-h-[100px] select-text whitespace-pre-wrap rounded p-2 font-mono text-xs">
          {currentPageContent?.content ||
            t("bots.inventoryPanel.bookPages.emptyPage")}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={displayPage <= 0}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="text-muted-foreground text-xs">
            {t("bots.inventoryPanel.bookPages.pageIndicator", {
              current: displayPage + 1,
              total: totalPages,
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={displayPage >= totalPages - 1}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
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
    mutationKey: ["bot", "mouse", "click", instanceId, botId],
    scope: { id: `bot-mouse-${instanceId}-${botId}` },
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

function BotMovementPanel({
  isOnline,
  instanceId,
  botId,
  liveState,
}: {
  isOnline: boolean;
  instanceId: string;
  botId: string;
  liveState?: BotLiveState;
}) {
  const { t } = useTranslation("instance");
  const [movementState, setMovementState] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sneak: false,
    sprint: false,
  });

  // Mutation for setting movement state
  const movementMutation = useMutation({
    mutationKey: ["bot", "movement", "state", instanceId, botId],
    scope: { id: `bot-movement-${instanceId}-${botId}` },
    mutationFn: async (state: Partial<typeof movementState>) => {
      const transport = createTransport();
      if (transport === null) {
        throw new Error("Not connected");
      }
      const botService = new BotServiceClient(transport);
      return botService.setMovementState({
        instanceId,
        botId,
        ...state,
      });
    },
  });

  // Mutation for resetting movement
  const resetMutation = useMutation({
    mutationKey: ["bot", "movement", "reset", instanceId, botId],
    scope: { id: `bot-movement-${instanceId}-${botId}` },
    mutationFn: async () => {
      const transport = createTransport();
      if (transport === null) {
        throw new Error("Not connected");
      }
      const botService = new BotServiceClient(transport);
      return botService.resetMovement({ instanceId, botId });
    },
    onSuccess: () => {
      setMovementState({
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
        sneak: false,
        sprint: false,
      });
    },
  });

  // Mutation for setting rotation
  const rotationMutation = useMutation({
    mutationKey: ["bot", "rotation", instanceId, botId],
    scope: { id: `bot-movement-${instanceId}-${botId}` },
    mutationFn: async (rotation: { yaw: number; pitch: number }) => {
      const transport = createTransport();
      if (transport === null) {
        throw new Error("Not connected");
      }
      const botService = new BotServiceClient(transport);
      return botService.setRotation({
        instanceId,
        botId,
        ...rotation,
      });
    },
  });

  const toggleMovement = useCallback(
    (key: keyof typeof movementState) => {
      const newValue = !movementState[key];
      setMovementState((prev) => ({ ...prev, [key]: newValue }));
      movementMutation.mutate({ [key]: newValue });
    },
    [movementState, movementMutation],
  );

  const handleRotationChange = useCallback(
    (deltaYaw: number, deltaPitch: number) => {
      const currentYaw = liveState?.yRot ?? 0;
      const currentPitch = liveState?.xRot ?? 0;
      rotationMutation.mutate({
        yaw: currentYaw + deltaYaw,
        pitch: Math.max(-90, Math.min(90, currentPitch + deltaPitch)),
      });
    },
    [liveState, rotationMutation],
  );

  const isPending =
    movementMutation.isPending ||
    resetMutation.isPending ||
    rotationMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GamepadIcon className="size-5" />
          {t("bots.movementPanel.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isOnline ? (
          <div className="space-y-4">
            {/* WASD Controls */}
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium">
                {t("bots.movementPanel.movement")}
              </p>
              <div className="flex flex-col items-center gap-1">
                {/* Forward */}
                <Button
                  variant={movementState.forward ? "default" : "outline"}
                  size="sm"
                  className="size-10"
                  onClick={() => toggleMovement("forward")}
                  disabled={isPending}
                  title={t("bots.movementPanel.forward")}
                >
                  <ArrowUpIcon className="size-4" />
                </Button>
                {/* Left, Backward, Right */}
                <div className="flex gap-1">
                  <Button
                    variant={movementState.left ? "default" : "outline"}
                    size="sm"
                    className="size-10"
                    onClick={() => toggleMovement("left")}
                    disabled={isPending}
                    title={t("bots.movementPanel.left")}
                  >
                    <ArrowLeftIcon className="size-4" />
                  </Button>
                  <Button
                    variant={movementState.backward ? "default" : "outline"}
                    size="sm"
                    className="size-10"
                    onClick={() => toggleMovement("backward")}
                    disabled={isPending}
                    title={t("bots.movementPanel.backward")}
                  >
                    <ArrowDownIcon className="size-4" />
                  </Button>
                  <Button
                    variant={movementState.right ? "default" : "outline"}
                    size="sm"
                    className="size-10"
                    onClick={() => toggleMovement("right")}
                    disabled={isPending}
                    title={t("bots.movementPanel.right")}
                  >
                    <ArrowRightIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={movementState.jump ? "default" : "outline"}
                size="sm"
                onClick={() => toggleMovement("jump")}
                disabled={isPending}
              >
                {t("bots.movementPanel.jump")}
              </Button>
              <Button
                variant={movementState.sneak ? "default" : "outline"}
                size="sm"
                onClick={() => toggleMovement("sneak")}
                disabled={isPending}
              >
                {t("bots.movementPanel.sneak")}
              </Button>
              <Button
                variant={movementState.sprint ? "default" : "outline"}
                size="sm"
                onClick={() => toggleMovement("sprint")}
                disabled={isPending}
              >
                {t("bots.movementPanel.sprint")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => resetMutation.mutate()}
                disabled={isPending}
              >
                <SquareIcon className="mr-1 size-3" />
                {t("bots.movementPanel.stop")}
              </Button>
            </div>

            {/* Rotation controls */}
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium">
                {t("bots.movementPanel.rotation")}
              </p>
              <div className="flex flex-col items-center gap-1">
                {/* Look up */}
                <Button
                  variant="outline"
                  size="sm"
                  className="size-10"
                  onClick={() => handleRotationChange(0, -15)}
                  disabled={isPending}
                  title={t("bots.movementPanel.lookUp")}
                >
                  <ChevronUpIcon className="size-4" />
                </Button>
                {/* Look left, down, right */}
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-10"
                    onClick={() => handleRotationChange(-15, 0)}
                    disabled={isPending}
                    title={t("bots.movementPanel.lookLeft")}
                  >
                    <ChevronLeftIcon className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-10"
                    onClick={() => handleRotationChange(0, 15)}
                    disabled={isPending}
                    title={t("bots.movementPanel.lookDown")}
                  >
                    <ChevronDownIcon className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-10"
                    onClick={() => handleRotationChange(15, 0)}
                    disabled={isPending}
                    title={t("bots.movementPanel.lookRight")}
                  >
                    <ChevronRightIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 flex items-center justify-center rounded-lg p-6">
            <p className="text-muted-foreground">
              {t("bots.movementPanel.offline")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BotDialogPanel({
  isOnline,
  instanceId,
  botId,
}: {
  isOnline: boolean;
  instanceId: string;
  botId: string;
}) {
  const { t } = useTranslation("instance");
  const queryClient = Route.useRouteContext().queryClient;

  // Query for dialog state
  const dialogQueryOptions = queryOptions({
    queryKey: ["bot-dialog", instanceId, botId],
    queryFn: async (queryProps) => {
      const transport = createTransport();
      if (transport === null) {
        return { dialog: undefined };
      }
      const botService = new BotServiceClient(transport);
      const result = await botService.getDialog(
        { instanceId, botId },
        { abort: queryProps.signal },
      );
      return result.response;
    },
    refetchInterval: 2_000, // Poll for dialog updates
    enabled: isOnline,
  });

  const { data: dialogData } = useSuspenseQuery(dialogQueryOptions);
  const dialog = dialogData?.dialog;

  // Mutation for dismissing dialog
  const dismissMutation = useMutation({
    mutationKey: ["bot", "dialog", "dismiss", instanceId, botId],
    mutationFn: async () => {
      const transport = createTransport();
      if (transport === null) {
        throw new Error("Not connected");
      }
      const botService = new BotServiceClient(transport);
      return botService.closeDialog({ instanceId, botId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bot-dialog", instanceId, botId],
      });
    },
  });

  const getDialogTypeName = (type: number) => {
    switch (type) {
      case 1:
        return t("bots.dialogPanel.notice");
      case 2:
        return t("bots.dialogPanel.confirmation");
      case 3:
        return t("bots.dialogPanel.multiAction");
      case 4:
        return t("bots.dialogPanel.serverLinks");
      case 5:
        return t("bots.dialogPanel.dialogList");
      default:
        return t("bots.dialogPanel.unknownType");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MonitorIcon className="size-5" />
          {t("bots.dialogPanel.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isOnline ? (
          <div className="bg-muted/30 flex items-center justify-center rounded-lg p-6">
            <p className="text-muted-foreground">
              {t("bots.dialogPanel.offline")}
            </p>
          </div>
        ) : dialog ? (
          <div className="space-y-4">
            {/* Dialog info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  {t("bots.dialogPanel.dialogType")}:
                </span>
                <Badge variant="outline">
                  {getDialogTypeName(dialog.type)}
                </Badge>
              </div>
              {dialog.id && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    {t("bots.dialogPanel.dialogId")}:
                  </span>
                  <code className="bg-muted select-text rounded px-2 py-1 text-xs">
                    {dialog.id}
                  </code>
                </div>
              )}
              {dialog.title && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="font-medium">{dialog.title}</p>
                </div>
              )}
            </div>

            {/* Dismiss button */}
            <Button
              variant="outline"
              onClick={() => dismissMutation.mutate()}
              disabled={dismissMutation.isPending}
              className="w-full"
            >
              {dismissMutation.isPending ? (
                <LoaderIcon className="mr-2 size-4 animate-spin" />
              ) : (
                <XIcon className="mr-2 size-4" />
              )}
              {t("bots.dialogPanel.dismiss")}
            </Button>
          </div>
        ) : (
          <div className="bg-muted/30 flex items-center justify-center rounded-lg p-6">
            <p className="text-muted-foreground">
              {t("bots.dialogPanel.noDialog")}
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
                  <p className="select-text text-lg font-bold">
                    {getCompassDirection(liveState.yRot)}
                  </p>
                  <p className="text-muted-foreground select-text text-xs">
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
                    <p className="text-muted-foreground select-text text-xs">
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
                  <span className="select-text font-mono">
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
