import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  KeyRoundIcon,
  MapPinIcon,
  MonitorSmartphoneIcon,
  RotateCcwKeyIcon,
  SearchIcon,
  WifiOffIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import InstancePageLayout from "@/components/nav/instance/instance-page-layout.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { BotServiceClient } from "@/generated/soulfire/bot.client.ts";
import type {
  BotListEntry,
  BotListResponse,
} from "@/generated/soulfire/bot.ts";
import { MinecraftAccountProto_AccountTypeProto } from "@/generated/soulfire/common.ts";
import {
  getEnumKeyByValue,
  mapUnionToValue,
  type ProfileAccount,
} from "@/lib/types.ts";
import { createTransport } from "@/lib/web-rpc.ts";

export const Route = createFileRoute("/_dashboard/instance/$instance/bots")({
  beforeLoad: (props) => {
    const { instance } = props.params;
    const botListQueryOptions = queryOptions({
      queryKey: ["bot-list", instance],
      queryFn: async (queryProps): Promise<BotListResponse> => {
        const transport = createTransport();
        if (transport === null) {
          // Demo mode - return empty bot list
          return { bots: [] };
        }
        const botService = new BotServiceClient(transport);
        const result = await botService.getBotList(
          { instanceId: instance },
          { abort: queryProps.signal },
        );
        return result.response;
      },
      refetchInterval: 3_000,
    });
    return { botListQueryOptions };
  },
  loader: (props) => {
    void props.context.queryClient.prefetchQuery(
      props.context.botListQueryOptions,
    );
  },
  component: Bots,
});

type BotWithStatus = ProfileAccount & {
  isOnline: boolean;
  liveState?: BotListEntry["liveState"];
};

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

const accountTypeLabel = (
  type: keyof typeof MinecraftAccountProto_AccountTypeProto,
) =>
  mapUnionToValue(type, (key) => {
    switch (key) {
      case "OFFLINE":
        return "Offline";
      case "MICROSOFT_JAVA_CREDENTIALS":
        return "Java";
      case "MICROSOFT_JAVA_DEVICE_CODE":
        return "Java";
      case "MICROSOFT_JAVA_REFRESH_TOKEN":
        return "Java";
      case "MICROSOFT_BEDROCK_CREDENTIALS":
        return "Bedrock";
      case "MICROSOFT_BEDROCK_DEVICE_CODE":
        return "Bedrock";
    }
  });

function Bots() {
  const { t } = useTranslation("common");

  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: "controls",
          content: t("breadcrumbs.controls"),
        },
      ]}
      pageName={t("pageName.bots")}
    >
      <Content />
    </InstancePageLayout>
  );
}

function Content() {
  const { t } = useTranslation("instance");
  const { instanceInfoQueryOptions, botListQueryOptions } =
    Route.useRouteContext();
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const { data: botList } = useSuspenseQuery(botListQueryOptions);
  const [search, setSearch] = useState("");

  // Merge account data with online status
  const botsWithStatus = useMemo(() => {
    const statusMap = new Map<string, BotListEntry>();
    for (const entry of botList.bots) {
      statusMap.set(entry.profileId, entry);
    }

    return instanceInfo.profile.accounts.map((account): BotWithStatus => {
      const status = statusMap.get(account.profileId);
      return {
        ...account,
        isOnline: status?.isOnline ?? false,
        liveState: status?.liveState,
      };
    });
  }, [instanceInfo.profile.accounts, botList.bots]);

  // Filter by search
  const filteredBots = useMemo(() => {
    if (!search.trim()) return botsWithStatus;
    const searchLower = search.toLowerCase();
    return botsWithStatus.filter((bot) =>
      bot.lastKnownName.toLowerCase().includes(searchLower),
    );
  }, [botsWithStatus, search]);

  // Count online bots
  const onlineCount = useMemo(
    () => botsWithStatus.filter((bot) => bot.isOnline).length,
    [botsWithStatus],
  );

  return (
    <div className="container flex h-full w-full grow flex-col gap-4 py-4">
      {/* Search and stats */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder={t("bots.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline" className="w-fit">
          {t("bots.onlineCount", {
            online: onlineCount,
            total: botsWithStatus.length,
          })}
        </Badge>
      </div>

      {/* Bot grid */}
      {filteredBots.length === 0 ? (
        <div className="text-muted-foreground flex flex-1 items-center justify-center">
          {botsWithStatus.length === 0
            ? t("bots.noBots")
            : t("bots.noBotsFound")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBots.map((bot) => (
            <BotCard
              key={bot.profileId}
              bot={bot}
              instanceId={instanceInfo.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper to get the avatar URL based on skin texture hash
function getHeadUrl(skinTextureHash?: string): string {
  if (skinTextureHash) {
    // Use the skin texture hash for online bots with skins
    return `https://mc-heads.net/head/${skinTextureHash}/48`;
  }
  // Default to Steve for offline bots or bots without skin data
  return "https://mc-heads.net/head/MHF_Steve/48";
}

function BotCard({
  bot,
  instanceId,
}: {
  bot: BotWithStatus;
  instanceId: string;
}) {
  const typeKey = getEnumKeyByValue(
    MinecraftAccountProto_AccountTypeProto,
    bot.type,
  );
  const Icon = accountTypeToIcon(typeKey);
  const typeLabel = accountTypeLabel(typeKey);

  return (
    <Link
      to="/instance/$instance/bot/$botId"
      params={{ instance: instanceId, botId: bot.profileId }}
    >
      <Card className="hover:bg-muted/50 h-full cursor-pointer transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            {/* Minecraft avatar */}
            <img
              src={getHeadUrl(bot.liveState?.skinTextureHash)}
              alt={bot.lastKnownName}
              className="size-12 rounded"
              loading="lazy"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <CardTitle className="truncate text-base">
                {bot.lastKnownName}
              </CardTitle>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  <Icon className="mr-1 size-3" />
                  {typeLabel}
                </Badge>
                <Badge
                  variant={bot.isOnline ? "default" : "secondary"}
                  className="text-xs"
                >
                  {bot.isOnline ? "Online" : "Not Joined"}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        {bot.isOnline && bot.liveState && (
          <CardContent className="pt-0">
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <MapPinIcon className="size-3" />
              <span>
                {bot.liveState.x.toFixed(1)}, {bot.liveState.y.toFixed(1)},{" "}
                {bot.liveState.z.toFixed(1)}
              </span>
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
