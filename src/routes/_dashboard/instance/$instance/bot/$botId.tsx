import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  CompassIcon,
  EyeIcon,
  KeyRoundIcon,
  MessageSquareIcon,
  MonitorIcon,
  MonitorSmartphoneIcon,
  PackageIcon,
  RotateCcwKeyIcon,
  TerminalIcon,
  WifiOffIcon,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import InstancePageLayout from "@/components/nav/instance/instance-page-layout.tsx";
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
import type { BotInfoResponse } from "@/generated/soulfire/bot.ts";
import { MinecraftAccountProto_AccountTypeProto } from "@/generated/soulfire/common.ts";
import {
  getEnumKeyByValue,
  mapUnionToValue,
  type ProfileAccount,
} from "@/lib/types.ts";
import { createTransport } from "@/lib/web-rpc.ts";

// Static inventory slot keys for the mock inventory grid
const INVENTORY_SLOTS = Array.from({ length: 36 }, (_, i) => `slot-${i}`);

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
  const { botInfoQueryOptions } = Route.useRouteContext();
  const { data: botInfo } = useSuspenseQuery(botInfoQueryOptions);

  const isOnline = !!botInfo.liveState;
  const typeKey = getEnumKeyByValue(
    MinecraftAccountProto_AccountTypeProto,
    account.type,
  );
  const TypeIcon = accountTypeToIcon(typeKey);

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
            typeKey={typeKey}
            TypeIcon={TypeIcon}
          />

          {/* Chat panel (mock) */}
          <BotChatPanel />

          {/* Inventory panel (mock) */}
          <BotInventoryPanel />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Position panel */}
          <BotPositionPanel liveState={botInfo.liveState} isOnline={isOnline} />

          {/* Command panel (mock) */}
          <BotCommandPanel />

          {/* Visual placeholder (mock) */}
          <BotVisualPlaceholder />
        </div>
      </div>
    </div>
  );
}

function BotSkinPreview({
  account,
  isOnline,
  typeKey,
  TypeIcon,
}: {
  account: ProfileAccount;
  isOnline: boolean;
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
            src={`https://mc-heads.net/body/${account.profileId}`}
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
                {isOnline ? t("bots.online") : t("bots.offline")}
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
  liveState?: BotInfoResponse["liveState"];
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

function BotChatPanel() {
  const { t } = useTranslation("instance");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareIcon className="size-5" />
          {t("bots.chatPanel.title")}
          <Badge variant="secondary" className="ml-auto">
            {t("bots.comingSoon")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/30 flex items-center justify-center rounded-lg p-8">
          <p className="text-muted-foreground text-center text-sm">
            {t("bots.chatPanel.description")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function BotCommandPanel() {
  const { t } = useTranslation("instance");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TerminalIcon className="size-5" />
          {t("bots.commandPanel.title")}
          <Badge variant="secondary" className="ml-auto">
            {t("bots.comingSoon")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Input
          placeholder={t("bots.commandPanel.placeholder")}
          disabled
          className="font-mono"
        />
        <p className="text-muted-foreground text-xs">
          {t("bots.commandPanel.description")}
        </p>
      </CardContent>
    </Card>
  );
}

function BotInventoryPanel() {
  const { t } = useTranslation("instance");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageIcon className="size-5" />
          {t("bots.inventoryPanel.title")}
          <Badge variant="secondary" className="ml-auto">
            {t("bots.comingSoon")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 9x4 inventory grid placeholder */}
        <div className="grid grid-cols-9 gap-1">
          {INVENTORY_SLOTS.map((slot) => (
            <div
              key={slot}
              className="bg-muted/50 border-border aspect-square rounded border"
            />
          ))}
        </div>
        <p className="text-muted-foreground mt-2 text-center text-xs">
          {t("bots.inventoryPanel.description")}
        </p>
      </CardContent>
    </Card>
  );
}

function BotVisualPlaceholder() {
  const { t } = useTranslation("instance");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EyeIcon className="size-5" />
          {t("bots.visualPanel.title")}
          <Badge variant="secondary" className="ml-auto">
            {t("bots.comingSoon")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/30 flex aspect-video items-center justify-center rounded-lg">
          <div className="text-center">
            <MonitorIcon className="text-muted-foreground mx-auto size-12" />
            <p className="text-muted-foreground mt-2 text-sm">
              {t("bots.visualPanel.description")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
