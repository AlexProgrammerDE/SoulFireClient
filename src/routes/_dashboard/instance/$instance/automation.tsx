import { create } from "@bufbuild/protobuf";
import { createClient } from "@connectrpc/connect";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BotMessageSquareIcon,
  BrainCircuitIcon,
  CrosshairIcon,
  PackageIcon,
  PauseIcon,
  PlayIcon,
  RefreshCcwIcon,
  RotateCcwIcon,
  RouteIcon,
  Settings2Icon,
  ShieldAlertIcon,
  StopCircleIcon,
  SwordsIcon,
  WaypointsIcon,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import InstancePageLayout from "@/components/nav/instance/instance-page-layout.tsx";
import { SFTimeAgo } from "@/components/sf-timeago.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Input } from "@/components/ui/input.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { TimestampSchema } from "@/generated/google/protobuf/timestamp_pb.ts";
import {
  type AutomationBotSettings,
  AutomationBotSettingsSchema,
  type AutomationBotState,
  type AutomationCoordinationState,
  AutomationCoordinationStateSchema,
  AutomationGoalMode,
  type AutomationInstanceSettings,
  AutomationInstanceSettingsSchema,
  type AutomationMemoryState,
  AutomationMemoryStateSchema,
  AutomationPreset,
  AutomationRolePolicy,
  AutomationService,
  AutomationTeamObjective,
  AutomationTeamRole,
  type AutomationTeamState,
  AutomationTeamStateSchema,
} from "@/generated/soulfire/automation_pb.ts";
import { cn, timestampToDate } from "@/lib/utils.tsx";
import { createTransport } from "@/lib/web-rpc.ts";

const presetOptions = [
  { value: AutomationPreset.BALANCED_TEAM, label: "Balanced Team" },
  { value: AutomationPreset.INDEPENDENT_RUNNERS, label: "Independent Runners" },
  { value: AutomationPreset.CAUTIOUS_TEAM, label: "Cautious Team" },
] as const;

const rolePolicyOptions = [
  { value: AutomationRolePolicy.STATIC_TEAM, label: "Static Team" },
  { value: AutomationRolePolicy.INDEPENDENT, label: "Independent" },
] as const;

const objectiveOptions = [
  { value: AutomationTeamObjective.UNSPECIFIED, label: "Auto" },
  { value: AutomationTeamObjective.BOOTSTRAP, label: "Bootstrap" },
  { value: AutomationTeamObjective.NETHER_PROGRESS, label: "Nether Progress" },
  { value: AutomationTeamObjective.STRONGHOLD_HUNT, label: "Stronghold Hunt" },
  { value: AutomationTeamObjective.END_ASSAULT, label: "End Assault" },
  { value: AutomationTeamObjective.COMPLETE, label: "Complete" },
] as const;

const roleOverrideOptions = [
  { value: AutomationTeamRole.UNSPECIFIED, label: "Auto" },
  { value: AutomationTeamRole.LEAD, label: "Lead" },
  { value: AutomationTeamRole.PORTAL_ENGINEER, label: "Portal Engineer" },
  { value: AutomationTeamRole.NETHER_RUNNER, label: "Nether Runner" },
  { value: AutomationTeamRole.STRONGHOLD_SCOUT, label: "Stronghold Scout" },
  { value: AutomationTeamRole.END_SUPPORT, label: "End Support" },
] as const;

const quotaOverrideConfigs = [
  {
    requirementKey: "item:minecraft:blaze_rod",
    alias: "blaze_rod",
    label: "Blaze Rod",
    min: 0,
    max: 64,
    readSetting: (settings: AutomationInstanceSettings) =>
      settings.targetBlazeRods,
  },
  {
    requirementKey: "item:minecraft:ender_pearl",
    alias: "ender_pearl",
    label: "Ender Pearl",
    min: 0,
    max: 64,
    readSetting: (settings: AutomationInstanceSettings) =>
      settings.targetEnderPearls,
  },
  {
    requirementKey: "item:minecraft:ender_eye",
    alias: "ender_eye",
    label: "Ender Eye",
    min: 0,
    max: 64,
    readSetting: (settings: AutomationInstanceSettings) =>
      settings.targetEnderEyes,
  },
  {
    requirementKey: "item:minecraft:arrow",
    alias: "arrow",
    label: "Arrow",
    min: 0,
    max: 512,
    readSetting: (settings: AutomationInstanceSettings) =>
      settings.targetArrows,
  },
  {
    requirementKey: "group:any_bed",
    alias: "bed",
    label: "Any Bed",
    min: 0,
    max: 64,
    readSetting: (settings: AutomationInstanceSettings) => settings.targetBeds,
  },
] as const;

const botTuningNumberConfigs = [
  {
    key: "memoryScanRadius",
    label: "Memory Scan Radius",
    description:
      "Default 48, range 8-96. Larger scans discover more blocks but cost more work.",
    min: 8,
    max: 96,
  },
  {
    key: "memoryScanIntervalTicks",
    label: "Memory Scan Interval",
    description:
      "Default 20 ticks, range 1-200. Lower values rescan more aggressively.",
    min: 1,
    max: 200,
  },
  {
    key: "retreatHealthThreshold",
    label: "Retreat Health",
    description:
      "Default 8, range 1-20. Automation disengages at or below this health.",
    min: 1,
    max: 20,
  },
  {
    key: "retreatFoodThreshold",
    label: "Eat Food Threshold",
    description:
      "Default 12, range 1-20. Automation interrupts to eat at or below this food level.",
    min: 1,
    max: 20,
  },
] as const;

type BotSettingsDraft = {
  enabled: boolean;
  allowDeathRecovery: boolean;
  roleOverride: AutomationTeamRole;
  memoryScanRadius: string;
  memoryScanIntervalTicks: string;
  retreatHealthThreshold: string;
  retreatFoodThreshold: string;
};

type BotSettingsPatch = {
  enabled?: boolean;
  allowDeathRecovery?: boolean;
  roleOverride?: AutomationTeamRole;
  memoryScanRadius?: number;
  memoryScanIntervalTicks?: number;
  retreatHealthThreshold?: number;
  retreatFoodThreshold?: number;
};

type BotAttentionSeverity = "ok" | "warning" | "critical";

type BotAttentionStatus = {
  severity: BotAttentionSeverity;
  label: string;
  summary: string;
  reasons: string[];
  operatorHint: string;
};

type BotAttentionEntry = {
  bot: AutomationBotState;
  attention: BotAttentionStatus;
};

const NO_CHANGE = "__no_change__";

export const Route = createFileRoute(
  "/_dashboard/instance/$instance/automation",
)({
  beforeLoad: (props) => {
    const { instance } = props.params;
    const automationTeamStateQueryOptions = queryOptions({
      queryKey: ["automation-team-state", instance],
      queryFn: async (queryProps): Promise<AutomationTeamState> => {
        const transport = createTransport();
        if (transport === null) {
          return createDemoAutomationTeamState(instance);
        }

        const automationService = createClient(AutomationService, transport);
        const result = await automationService.getAutomationTeamState(
          { instanceId: instance },
          { signal: queryProps.signal },
        );
        return (
          result.state ??
          create(AutomationTeamStateSchema, {
            instanceId: instance,
          })
        );
      },
      refetchInterval: 2_000,
    });
    const automationCoordinationStateQueryOptions = queryOptions({
      queryKey: ["automation-coordination-state", instance],
      queryFn: async (queryProps): Promise<AutomationCoordinationState> => {
        const transport = createTransport();
        if (transport === null) {
          return createDemoAutomationCoordinationState(instance);
        }

        const automationService = createClient(AutomationService, transport);
        const result = await automationService.getAutomationCoordinationState(
          { instanceId: instance, maxEntries: 12 },
          { signal: queryProps.signal },
        );
        return (
          result.state ??
          create(AutomationCoordinationStateSchema, {
            instanceId: instance,
          })
        );
      },
      refetchInterval: 2_000,
    });
    return {
      automationTeamStateQueryOptions,
      automationCoordinationStateQueryOptions,
    };
  },
  loader: (props) => {
    void props.context.queryClient.prefetchQuery(
      props.context.automationTeamStateQueryOptions,
    );
    void props.context.queryClient.prefetchQuery(
      props.context.automationCoordinationStateQueryOptions,
    );
  },
  component: AutomationDashboard,
});

function AutomationDashboardSkeleton() {
  return (
    <div className="container flex h-full w-full grow flex-col gap-4 py-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <Skeleton key={index} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function AutomationDashboard() {
  const { t } = useTranslation("common");

  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: "controls",
          content: t("breadcrumbs.controls"),
        },
      ]}
      pageName={t("pageName.automation")}
      loadingSkeleton={<AutomationDashboardSkeleton />}
    >
      <Content />
    </InstancePageLayout>
  );
}

function Content() {
  const queryClient = useQueryClient();
  const {
    instanceInfoQueryOptions,
    automationTeamStateQueryOptions,
    automationCoordinationStateQueryOptions,
  } = Route.useRouteContext();
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const { data: teamState } = useSuspenseQuery(automationTeamStateQueryOptions);
  const { data: coordinationState } = useSuspenseQuery(
    automationCoordinationStateQueryOptions,
  );
  const teamSettings =
    teamState.settings ?? create(AutomationInstanceSettingsSchema, {});
  const [acquireTarget, setAcquireTarget] = useState("ender_pearl");
  const [acquireCount, setAcquireCount] = useState("4");
  const [maxEndBotsInput, setMaxEndBotsInput] = useState(
    String(teamSettings.maxEndBots),
  );
  const [quotaInputs, setQuotaInputs] = useState<Record<string, string>>(() =>
    createQuotaInputState(teamSettings),
  );
  const [botSearch, setBotSearch] = useState("");
  const deferredBotSearch = useDeferredValue(botSearch);
  const [botRoleFilter, setBotRoleFilter] = useState("all");
  const [botStatusFilter, setBotStatusFilter] = useState("all");
  const [botDimensionFilter, setBotDimensionFilter] = useState("all");
  const [botAttentionFilter, setBotAttentionFilter] = useState("all");
  const [selectedBots, setSelectedBots] = useState<Record<string, boolean>>({});
  const [bulkEnabledInput, setBulkEnabledInput] = useState(NO_CHANGE);
  const [bulkDeathRecoveryInput, setBulkDeathRecoveryInput] =
    useState(NO_CHANGE);
  const [bulkRoleOverrideInput, setBulkRoleOverrideInput] = useState(NO_CHANGE);
  const [memoryBotId, setMemoryBotId] = useState("");
  const [memoryMaxEntriesInput, setMemoryMaxEntriesInput] = useState("8");
  const transport = createTransport();
  const isReadOnlyDemo = transport === null;
  const hasAutomationSettingsPage = instanceInfo.instanceSettings.some(
    (page) => page.id === "automation",
  );

  useEffect(() => {
    setMaxEndBotsInput(String(teamSettings.maxEndBots));
  }, [teamSettings.maxEndBots]);

  useEffect(() => {
    setQuotaInputs(createQuotaInputState(teamSettings));
  }, [
    teamSettings.targetArrows,
    teamSettings.targetBeds,
    teamSettings.targetBlazeRods,
    teamSettings.targetEnderEyes,
    teamSettings.targetEnderPearls,
    teamSettings,
  ]);

  useEffect(() => {
    setSelectedBots((current) => {
      const visibleBotIds = new Set(teamState.bots.map((bot) => bot.botId));
      return Object.fromEntries(
        Object.entries(current).filter(
          ([botId, selected]) => selected && visibleBotIds.has(botId),
        ),
      );
    });
  }, [teamState.bots]);

  useEffect(() => {
    if (teamState.bots.length === 0) {
      if (memoryBotId.length > 0) {
        setMemoryBotId("");
      }
      return;
    }

    const hasSelectedMemoryBot = teamState.bots.some(
      (bot) => bot.botId === memoryBotId,
    );
    if (!hasSelectedMemoryBot) {
      const firstBot = teamState.bots[0];
      if (firstBot) {
        setMemoryBotId(firstBot.botId);
      }
    }
  }, [memoryBotId, teamState.bots]);

  const invalidateAutomation = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: automationTeamStateQueryOptions.queryKey,
      }),
      queryClient.invalidateQueries({
        queryKey: automationCoordinationStateQueryOptions.queryKey,
      }),
      queryClient.invalidateQueries({
        queryKey: ["automation-memory-state", instanceInfo.id],
      }),
    ]);
  };

  const teamActionMutation = useMutation({
    mutationFn: async (
      action:
        | { kind: "beat" }
        | { kind: "pause" }
        | { kind: "resume" }
        | { kind: "stop" }
        | { kind: "reset-coordination" }
        | { kind: "acquire"; target: string; count: number },
    ) => {
      const activeTransport = createTransport();
      if (activeTransport === null) {
        return;
      }

      const automationService = createClient(
        AutomationService,
        activeTransport,
      );
      switch (action.kind) {
        case "beat":
          return automationService.startAutomationBeat({
            instanceId: instanceInfo.id,
          });
        case "pause":
          return automationService.pauseAutomation({
            instanceId: instanceInfo.id,
          });
        case "resume":
          return automationService.resumeAutomation({
            instanceId: instanceInfo.id,
          });
        case "stop":
          return automationService.stopAutomation({
            instanceId: instanceInfo.id,
          });
        case "reset-coordination":
          return automationService.resetAutomationCoordinationState({
            instanceId: instanceInfo.id,
          });
        case "acquire":
          return automationService.startAutomationAcquire({
            instanceId: instanceInfo.id,
            target: action.target,
            count: action.count,
          });
      }
    },
    onSuccess: async (_, action) => {
      await invalidateAutomation();
      toast.success(
        action.kind === "acquire"
          ? `Started acquire goal for ${action.target} x${action.count}.`
          : action.kind === "reset-coordination"
            ? "Automation coordination state reset."
            : `Automation ${action.kind} request sent.`,
      );
    },
    onError: (error) => {
      toast.error("Automation action failed.", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  const teamSettingMutation = useMutation({
    mutationFn: async (
      action:
        | { kind: "preset"; preset: AutomationPreset }
        | { kind: "collaboration"; enabled: boolean }
        | { kind: "role-policy"; rolePolicy: AutomationRolePolicy }
        | { kind: "shared-structures"; enabled: boolean }
        | { kind: "shared-claims"; enabled: boolean }
        | { kind: "shared-end-entry"; enabled: boolean }
        | { kind: "max-end-bots"; maxEndBots: number }
        | {
            kind: "quota-override";
            requirementKey: string;
            targetCount: number;
          }
        | { kind: "objective"; objective: AutomationTeamObjective },
    ) => {
      const activeTransport = createTransport();
      if (activeTransport === null) {
        return;
      }

      const automationService = createClient(
        AutomationService,
        activeTransport,
      );
      switch (action.kind) {
        case "preset":
          return automationService.applyAutomationPreset({
            instanceId: instanceInfo.id,
            preset: action.preset,
          });
        case "collaboration":
          return automationService.setAutomationCollaboration({
            instanceId: instanceInfo.id,
            enabled: action.enabled,
          });
        case "role-policy":
          return automationService.setAutomationRolePolicy({
            instanceId: instanceInfo.id,
            rolePolicy: action.rolePolicy,
          });
        case "shared-structures":
          return automationService.setAutomationSharedStructures({
            instanceId: instanceInfo.id,
            enabled: action.enabled,
          });
        case "shared-claims":
          return automationService.setAutomationSharedClaims({
            instanceId: instanceInfo.id,
            enabled: action.enabled,
          });
        case "shared-end-entry":
          return automationService.setAutomationSharedEndEntry({
            instanceId: instanceInfo.id,
            enabled: action.enabled,
          });
        case "max-end-bots":
          return automationService.setAutomationMaxEndBots({
            instanceId: instanceInfo.id,
            maxEndBots: action.maxEndBots,
          });
        case "quota-override":
          return automationService.setAutomationQuotaOverride({
            instanceId: instanceInfo.id,
            requirementKey: action.requirementKey,
            targetCount: action.targetCount,
          });
        case "objective":
          return automationService.setAutomationObjectiveOverride({
            instanceId: instanceInfo.id,
            objective: action.objective,
          });
      }
    },
    onSuccess: async (_, action) => {
      await invalidateAutomation();
      if (action.kind === "preset") {
        toast.success(`Applied ${presetLabel(action.preset)} preset.`);
        return;
      }
      if (action.kind === "quota-override") {
        const quotaConfig = quotaOverrideConfig(action.requirementKey);
        toast.success(
          action.targetCount === 0
            ? `Restored ${quotaConfig.label} quota to auto.`
            : `Set ${quotaConfig.label} quota to ${action.targetCount}.`,
        );
      }
    },
    onError: (error) => {
      toast.error("Automation settings update failed.", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  const botActionMutation = useMutation({
    mutationFn: async (
      action:
        | { kind: "pause"; botIds: string[]; label: string }
        | { kind: "resume"; botIds: string[]; label: string }
        | { kind: "stop"; botIds: string[]; label: string }
        | { kind: "reset-memory"; botIds: string[]; label: string }
        | { kind: "release-claims"; botIds: string[]; label: string },
    ) => {
      const activeTransport = createTransport();
      if (activeTransport === null) {
        return;
      }

      const automationService = createClient(
        AutomationService,
        activeTransport,
      );
      switch (action.kind) {
        case "pause":
          return automationService.pauseAutomation({
            instanceId: instanceInfo.id,
            botIds: action.botIds,
          });
        case "resume":
          return automationService.resumeAutomation({
            instanceId: instanceInfo.id,
            botIds: action.botIds,
          });
        case "stop":
          return automationService.stopAutomation({
            instanceId: instanceInfo.id,
            botIds: action.botIds,
          });
        case "reset-memory":
          return automationService.resetAutomationMemory({
            instanceId: instanceInfo.id,
            botIds: action.botIds,
          });
        case "release-claims":
          return automationService.releaseAutomationBotClaims({
            instanceId: instanceInfo.id,
            botIds: action.botIds,
          });
      }
    },
    onSuccess: async (_, action) => {
      await invalidateAutomation();
      toast.success(`${action.label}: ${action.kind.replace("-", " ")}.`);
    },
    onError: (error) => {
      toast.error("Bot automation action failed.", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  const botSettingsMutation = useMutation({
    mutationFn: async (action: {
      botIds: string[];
      label: string;
      patch: BotSettingsPatch;
    }) => {
      const activeTransport = createTransport();
      if (activeTransport === null) {
        return;
      }

      const automationService = createClient(
        AutomationService,
        activeTransport,
      );
      return automationService.updateAutomationBotSettings({
        instanceId: instanceInfo.id,
        botIds: action.botIds,
        ...action.patch,
      });
    },
    onSuccess: async (_, action) => {
      await invalidateAutomation();
      toast.success(`${action.label}: automation settings updated.`);
    },
    onError: (error) => {
      toast.error("Failed to update automation settings.", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  const claimMutation = useMutation({
    mutationFn: async (claimKey: string) => {
      const activeTransport = createTransport();
      if (activeTransport === null) {
        return;
      }

      const automationService = createClient(
        AutomationService,
        activeTransport,
      );
      return automationService.releaseAutomationClaim({
        instanceId: instanceInfo.id,
        key: claimKey,
      });
    },
    onSuccess: async (_, claimKey) => {
      await invalidateAutomation();
      toast.success(`Released claim ${claimKey}.`);
    },
    onError: (error) => {
      toast.error("Failed to release claim.", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  const quotaCards = useMemo(
    () =>
      quotaOverrideConfigs.map((config) => {
        const liveQuota = teamState.quotas.find(
          (quota) => quota.requirementKey === config.requirementKey,
        );
        return {
          key: config.requirementKey,
          alias: config.alias,
          label: config.label,
          min: config.min,
          max: config.max,
          current: liveQuota?.currentCount ?? 0,
          target: liveQuota?.targetCount ?? 0,
          configuredTarget: config.readSetting(teamSettings),
        };
      }),
    [teamSettings, teamState.quotas],
  );

  const botDimensionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          teamState.bots.map((bot) =>
            normalizeBotDimension(bot.dimension || "unknown"),
          ),
        ),
      ).sort(),
    [teamState.bots],
  );
  const botAttentionEntries = useMemo(() => {
    const nowMs = Date.now();
    return teamState.bots
      .map((bot) => ({
        bot,
        attention: describeBotAttention(bot, nowMs),
      }))
      .sort(compareBotAttentionEntries);
  }, [teamState.bots]);
  const botAttentionById = useMemo(
    () =>
      new Map(
        botAttentionEntries.map((entry) => [entry.bot.botId, entry.attention]),
      ),
    [botAttentionEntries],
  );
  const attentionCounts = useMemo(
    () =>
      botAttentionEntries.reduce(
        (counts, entry) => {
          if (entry.attention.severity === "critical") {
            counts.critical += 1;
          } else if (entry.attention.severity === "warning") {
            counts.warning += 1;
          } else {
            counts.healthy += 1;
          }
          return counts;
        },
        { critical: 0, warning: 0, healthy: 0 },
      ),
    [botAttentionEntries],
  );

  const filteredBots = useMemo(() => {
    const normalizedSearch = deferredBotSearch.trim().toLowerCase();
    return teamState.bots.filter((bot) => {
      const attention =
        botAttentionById.get(bot.botId) ?? createHealthyBotAttention();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        bot.accountName.toLowerCase().includes(normalizedSearch) ||
        bot.statusSummary.toLowerCase().includes(normalizedSearch) ||
        (bot.currentAction ?? "").toLowerCase().includes(normalizedSearch) ||
        (bot.dimension ?? "").toLowerCase().includes(normalizedSearch);
      const matchesRole =
        botRoleFilter === "all" || String(bot.teamRole) === botRoleFilter;
      const matchesStatus =
        botStatusFilter === "all" ||
        (botStatusFilter === "paused" ? bot.paused : !bot.paused);
      const matchesDimension =
        botDimensionFilter === "all" ||
        normalizeBotDimension(bot.dimension || "unknown") ===
          botDimensionFilter;
      const matchesAttention =
        botAttentionFilter === "all" ||
        matchesBotAttentionFilter(attention, botAttentionFilter);
      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus &&
        matchesDimension &&
        matchesAttention
      );
    });
  }, [
    botAttentionById,
    botAttentionFilter,
    botDimensionFilter,
    botRoleFilter,
    botStatusFilter,
    deferredBotSearch,
    teamState.bots,
  ]);

  const filteredBotIds = useMemo(
    () => filteredBots.map((bot) => bot.botId),
    [filteredBots],
  );
  const inspectedMemoryBot = useMemo(
    () =>
      teamState.bots.find((bot) => bot.botId === memoryBotId) ??
      teamState.bots[0],
    [memoryBotId, teamState.bots],
  );
  const memoryMaxEntries = useMemo(
    () =>
      isValidQuotaInput(memoryMaxEntriesInput, 1, 32)
        ? Number(memoryMaxEntriesInput)
        : 8,
    [memoryMaxEntriesInput],
  );
  const selectedBotIds = useMemo(
    () =>
      teamState.bots
        .filter((bot) => selectedBots[bot.botId] === true)
        .map((bot) => bot.botId),
    [selectedBots, teamState.bots],
  );
  const bulkSettingsPatch = useMemo(() => {
    const patch: BotSettingsPatch = {};
    if (bulkEnabledInput !== NO_CHANGE) {
      patch.enabled = bulkEnabledInput === "enabled";
    }
    if (bulkDeathRecoveryInput !== NO_CHANGE) {
      patch.allowDeathRecovery = bulkDeathRecoveryInput === "enabled";
    }
    if (bulkRoleOverrideInput !== NO_CHANGE) {
      patch.roleOverride = Number(bulkRoleOverrideInput) as AutomationTeamRole;
    }
    return patch;
  }, [bulkDeathRecoveryInput, bulkEnabledInput, bulkRoleOverrideInput]);
  const hasBulkSettingsPatch = Object.keys(bulkSettingsPatch).length > 0;
  const memoryStateQuery = useQuery({
    queryKey: [
      "automation-memory-state",
      instanceInfo.id,
      inspectedMemoryBot?.botId ?? "none",
      memoryMaxEntries,
    ],
    enabled: inspectedMemoryBot !== undefined,
    queryFn: async (queryProps): Promise<AutomationMemoryState> => {
      if (inspectedMemoryBot === undefined) {
        return create(AutomationMemoryStateSchema, {
          instanceId: instanceInfo.id,
        });
      }

      const activeTransport = createTransport();
      if (activeTransport === null) {
        return createDemoAutomationMemoryState(
          instanceInfo.id,
          inspectedMemoryBot.botId,
          inspectedMemoryBot.accountName,
          memoryMaxEntries,
        );
      }

      const automationService = createClient(
        AutomationService,
        activeTransport,
      );
      const result = await automationService.getAutomationMemoryState(
        {
          instanceId: instanceInfo.id,
          botId: inspectedMemoryBot.botId,
          maxEntries: memoryMaxEntries,
        },
        { signal: queryProps.signal },
      );
      return (
        result.state ??
        create(AutomationMemoryStateSchema, {
          instanceId: instanceInfo.id,
          botId: inspectedMemoryBot.botId,
          accountName: inspectedMemoryBot.accountName,
        })
      );
    },
    refetchInterval: inspectedMemoryBot ? 2_000 : false,
  });

  return (
    <div className="container flex h-full w-full grow flex-col gap-4 py-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Objective"
          value={objectiveLabel(teamState.objective)}
          description={`Preset ${presetLabel(teamSettings.preset)}`}
          icon={CrosshairIcon}
        />
        <StatCard
          title="Active Bots"
          value={String(teamState.activeBots)}
          description={`${teamState.bots.length} runtime snapshots`}
          icon={BotMessageSquareIcon}
        />
        <StatCard
          title="Shared Claims"
          value={String(coordinationState.claimCount)}
          description={`${coordinationState.sharedBlockCount} shared blocks tracked`}
          icon={WaypointsIcon}
        />
        <StatCard
          title="End Entry"
          value={teamSettings.sharedEndEntry ? "Throttled" : "Open"}
          description={`Max ${teamSettings.maxEndBots} bot${teamSettings.maxEndBots === 1 ? "" : "s"} in End`}
          icon={RouteIcon}
        />
        <StatCard
          title="Needs Attention"
          value={String(attentionCounts.critical + attentionCounts.warning)}
          description={`${attentionCounts.critical} critical / ${attentionCounts.warning} warning`}
          icon={ShieldAlertIcon}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quick Controls</CardTitle>
            <CardDescription>
              Direct operator controls for the current automation run.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={isReadOnlyDemo || teamActionMutation.isPending}
                onClick={() => teamActionMutation.mutate({ kind: "beat" })}
              >
                <PlayIcon className="size-4" />
                Start Beat
              </Button>
              <Button
                variant="outline"
                disabled={isReadOnlyDemo || teamActionMutation.isPending}
                onClick={() => teamActionMutation.mutate({ kind: "pause" })}
              >
                <PauseIcon className="size-4" />
                Pause All
              </Button>
              <Button
                variant="outline"
                disabled={isReadOnlyDemo || teamActionMutation.isPending}
                onClick={() => teamActionMutation.mutate({ kind: "resume" })}
              >
                <PlayIcon className="size-4" />
                Resume All
              </Button>
              <Button
                variant="outline"
                disabled={isReadOnlyDemo || teamActionMutation.isPending}
                onClick={() => teamActionMutation.mutate({ kind: "stop" })}
              >
                <StopCircleIcon className="size-4" />
                Stop All
              </Button>
              <Button
                variant="outline"
                disabled={isReadOnlyDemo || teamActionMutation.isPending}
                onClick={() =>
                  teamActionMutation.mutate({ kind: "reset-coordination" })
                }
              >
                <RotateCcwIcon className="size-4" />
                Reset Coordination
              </Button>
              {hasAutomationSettingsPage && (
                <Button asChild variant="ghost">
                  <Link
                    to="/instance/$instance/settings/$pageId"
                    params={{
                      instance: instanceInfo.id,
                      pageId: "automation",
                    }}
                  >
                    <Settings2Icon className="size-4" />
                    Open Settings
                  </Link>
                </Button>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
              <Card className="bg-muted/35">
                <CardHeader>
                  <CardTitle className="text-base">Acquire Target</CardTitle>
                  <CardDescription>
                    Start a focused resource run without leaving the dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                  <Input
                    value={acquireTarget}
                    onChange={(event) => setAcquireTarget(event.target.value)}
                    placeholder="ender_pearl"
                    disabled={isReadOnlyDemo || teamActionMutation.isPending}
                  />
                  <Input
                    type="number"
                    min={1}
                    value={acquireCount}
                    onChange={(event) => setAcquireCount(event.target.value)}
                    disabled={isReadOnlyDemo || teamActionMutation.isPending}
                  />
                  <Button
                    disabled={
                      isReadOnlyDemo ||
                      teamActionMutation.isPending ||
                      acquireTarget.trim().length === 0 ||
                      !Number.isFinite(Number(acquireCount)) ||
                      Number(acquireCount) < 1
                    }
                    onClick={() =>
                      teamActionMutation.mutate({
                        kind: "acquire",
                        target: acquireTarget.trim(),
                        count: Number(acquireCount),
                      })
                    }
                  >
                    <PackageIcon className="size-4" />
                    Start
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-muted/35">
                <CardHeader>
                  <CardTitle className="text-base">Team Quotas</CardTitle>
                  <CardDescription>
                    Live shared progression counts plus direct override
                    controls. Use `0` to restore automatic team-size-based
                    targets.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {quotaCards.map((quota) => (
                    <div
                      key={quota.key}
                      className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {quota.label}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {quota.alias}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Badge variant="outline">
                          {quota.current}/{quota.target}
                        </Badge>
                        <Badge variant="secondary">
                          {quota.configuredTarget === 0
                            ? "Auto"
                            : `Override ${quota.configuredTarget}`}
                        </Badge>
                        <Input
                          className="w-20"
                          type="number"
                          min={quota.min}
                          max={quota.max}
                          value={
                            quotaInputs[quota.key] ??
                            String(quota.configuredTarget)
                          }
                          disabled={
                            isReadOnlyDemo || teamSettingMutation.isPending
                          }
                          onChange={(event) =>
                            setQuotaInputs((current) => ({
                              ...current,
                              [quota.key]: event.target.value,
                            }))
                          }
                        />
                        <Button
                          variant="outline"
                          disabled={
                            isReadOnlyDemo ||
                            teamSettingMutation.isPending ||
                            !isValidQuotaInput(
                              quotaInputs[quota.key] ??
                                String(quota.configuredTarget),
                              quota.min,
                              quota.max,
                            ) ||
                            Number(
                              quotaInputs[quota.key] ??
                                String(quota.configuredTarget),
                            ) === quota.configuredTarget
                          }
                          onClick={() =>
                            teamSettingMutation.mutate({
                              kind: "quota-override",
                              requirementKey: quota.key,
                              targetCount: Number(
                                quotaInputs[quota.key] ??
                                  String(quota.configuredTarget),
                              ),
                            })
                          }
                        >
                          Apply
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={
                            isReadOnlyDemo ||
                            teamSettingMutation.isPending ||
                            quota.configuredTarget === 0
                          }
                          onClick={() =>
                            teamSettingMutation.mutate({
                              kind: "quota-override",
                              requirementKey: quota.key,
                              targetCount: 0,
                            })
                          }
                        >
                          Auto
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Settings</CardTitle>
            <CardDescription>
              Dedicated automation controls layered on top of the generic
              settings page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <SettingSelect
              label="Preset"
              value={String(teamSettings.preset)}
              options={presetOptions.map((option) => ({
                value: String(option.value),
                label: option.label,
              }))}
              disabled={isReadOnlyDemo || teamSettingMutation.isPending}
              onValueChange={(value) =>
                teamSettingMutation.mutate({
                  kind: "preset",
                  preset: Number(value) as AutomationPreset,
                })
              }
            />
            <SettingSelect
              label="Role Policy"
              value={String(teamSettings.rolePolicy)}
              options={rolePolicyOptions.map((option) => ({
                value: String(option.value),
                label: option.label,
              }))}
              disabled={isReadOnlyDemo || teamSettingMutation.isPending}
              onValueChange={(value) =>
                teamSettingMutation.mutate({
                  kind: "role-policy",
                  rolePolicy: Number(value) as AutomationRolePolicy,
                })
              }
            />
            <SettingSelect
              label="Objective Override"
              value={String(teamSettings.objectiveOverride)}
              options={objectiveOptions.map((option) => ({
                value: String(option.value),
                label: option.label,
              }))}
              disabled={isReadOnlyDemo || teamSettingMutation.isPending}
              onValueChange={(value) =>
                teamSettingMutation.mutate({
                  kind: "objective",
                  objective: Number(value) as AutomationTeamObjective,
                })
              }
            />
            <SettingToggle
              label="Team Collaboration"
              description="Share roles, claims, and team-wide progression."
              checked={teamSettings.teamCollaboration}
              disabled={isReadOnlyDemo || teamSettingMutation.isPending}
              onCheckedChange={(checked) =>
                teamSettingMutation.mutate({
                  kind: "collaboration",
                  enabled: checked,
                })
              }
            />
            <SettingToggle
              label="Shared Structures"
              description="Reuse fortress, portal, and stronghold intelligence."
              checked={teamSettings.sharedStructureIntel}
              disabled={isReadOnlyDemo || teamSettingMutation.isPending}
              onCheckedChange={(checked) =>
                teamSettingMutation.mutate({
                  kind: "shared-structures",
                  enabled: checked,
                })
              }
            />
            <SettingToggle
              label="Shared Claims"
              description="Reserve targets so bots avoid duplicated work."
              checked={teamSettings.sharedTargetClaims}
              disabled={isReadOnlyDemo || teamSettingMutation.isPending}
              onCheckedChange={(checked) =>
                teamSettingMutation.mutate({
                  kind: "shared-claims",
                  enabled: checked,
                })
              }
            />
            <SettingToggle
              label="Shared End Entry"
              description="Throttle how many bots enter the End at once."
              checked={teamSettings.sharedEndEntry}
              disabled={isReadOnlyDemo || teamSettingMutation.isPending}
              onCheckedChange={(checked) =>
                teamSettingMutation.mutate({
                  kind: "shared-end-entry",
                  enabled: checked,
                })
              }
            />
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Max End Bots</p>
                  <p className="text-muted-foreground text-xs">
                    Applies when shared End entry is enabled.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    className="w-20"
                    type="number"
                    min={1}
                    max={32}
                    value={maxEndBotsInput}
                    disabled={isReadOnlyDemo || teamSettingMutation.isPending}
                    onChange={(event) => setMaxEndBotsInput(event.target.value)}
                  />
                  <Button
                    variant="outline"
                    disabled={
                      isReadOnlyDemo ||
                      teamSettingMutation.isPending ||
                      !Number.isFinite(Number(maxEndBotsInput)) ||
                      Number(maxEndBotsInput) < 1 ||
                      Number(maxEndBotsInput) > 32 ||
                      Number(maxEndBotsInput) === teamSettings.maxEndBots
                    }
                    onClick={() =>
                      teamSettingMutation.mutate({
                        kind: "max-end-bots",
                        maxEndBots: Number(maxEndBotsInput),
                      })
                    }
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Bot Runtime</CardTitle>
            <CardDescription>
              Per-bot status, queue visibility, filtered team views, and bulk
              interventions.
            </CardDescription>
            <div className="grid gap-3 lg:grid-cols-5">
              <div className="grid gap-2 lg:col-span-2">
                <p className="text-sm font-medium">Search Bots</p>
                <Input
                  value={botSearch}
                  onChange={(event) => setBotSearch(event.target.value)}
                  placeholder="Search by name, action, status, or dimension"
                />
              </div>
              <SettingSelect
                label="Role Filter"
                value={botRoleFilter}
                options={[
                  { value: "all", label: "All Roles" },
                  ...roleOverrideOptions
                    .filter(
                      (option) =>
                        option.value !== AutomationTeamRole.UNSPECIFIED,
                    )
                    .map((option) => ({
                      value: String(option.value),
                      label: option.label,
                    })),
                ]}
                disabled={false}
                onValueChange={setBotRoleFilter}
              />
              <SettingSelect
                label="Status Filter"
                value={botStatusFilter}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "live", label: "Live" },
                  { value: "paused", label: "Paused" },
                ]}
                disabled={false}
                onValueChange={setBotStatusFilter}
              />
              <SettingSelect
                label="Attention Filter"
                value={botAttentionFilter}
                options={[
                  { value: "all", label: "All Health" },
                  { value: "attention", label: "Needs Attention" },
                  { value: "critical", label: "Critical" },
                  { value: "healthy", label: "Healthy" },
                ]}
                disabled={false}
                onValueChange={setBotAttentionFilter}
              />
            </div>
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <SettingSelect
                label="Dimension Filter"
                value={botDimensionFilter}
                options={[
                  { value: "all", label: "All Dimensions" },
                  ...botDimensionOptions.map((dimension) => ({
                    value: dimension,
                    label: dimensionLabel(dimension),
                  })),
                ]}
                disabled={false}
                onValueChange={setBotDimensionFilter}
              />
              <div className="flex flex-wrap items-end gap-2">
                <Badge variant="outline">{filteredBots.length} visible</Badge>
                <Badge variant="secondary">
                  {selectedBotIds.length} selected
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filteredBotIds.length === 0}
                  onClick={() =>
                    setSelectedBots((current) => ({
                      ...current,
                      ...Object.fromEntries(
                        filteredBotIds.map((botId) => [botId, true]),
                      ),
                    }))
                  }
                >
                  Select Visible
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={selectedBotIds.length === 0}
                  onClick={() => setSelectedBots({})}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
            {selectedBotIds.length > 0 && (
              <div className="grid gap-4 rounded-lg border bg-muted/35 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">Bulk Controls</p>
                    <p className="text-muted-foreground text-xs">
                      Apply interventions or a light settings patch to the
                      current selection.
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {selectedBotIds.length} bot
                    {selectedBotIds.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isReadOnlyDemo || botActionMutation.isPending}
                    onClick={() =>
                      botActionMutation.mutate({
                        kind: "pause",
                        botIds: selectedBotIds,
                        label: formatBotSelectionLabel(selectedBotIds.length),
                      })
                    }
                  >
                    <PauseIcon className="size-4" />
                    Pause Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isReadOnlyDemo || botActionMutation.isPending}
                    onClick={() =>
                      botActionMutation.mutate({
                        kind: "resume",
                        botIds: selectedBotIds,
                        label: formatBotSelectionLabel(selectedBotIds.length),
                      })
                    }
                  >
                    <PlayIcon className="size-4" />
                    Resume Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isReadOnlyDemo || botActionMutation.isPending}
                    onClick={() =>
                      botActionMutation.mutate({
                        kind: "stop",
                        botIds: selectedBotIds,
                        label: formatBotSelectionLabel(selectedBotIds.length),
                      })
                    }
                  >
                    <StopCircleIcon className="size-4" />
                    Stop Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isReadOnlyDemo || botActionMutation.isPending}
                    onClick={() =>
                      botActionMutation.mutate({
                        kind: "reset-memory",
                        botIds: selectedBotIds,
                        label: formatBotSelectionLabel(selectedBotIds.length),
                      })
                    }
                  >
                    <RotateCcwIcon className="size-4" />
                    Reset Memory
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isReadOnlyDemo || botActionMutation.isPending}
                    onClick={() =>
                      botActionMutation.mutate({
                        kind: "release-claims",
                        botIds: selectedBotIds,
                        label: formatBotSelectionLabel(selectedBotIds.length),
                      })
                    }
                  >
                    <WaypointsIcon className="size-4" />
                    Release Claims
                  </Button>
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  <SettingSelect
                    label="Automation Enabled"
                    value={bulkEnabledInput}
                    options={[
                      { value: NO_CHANGE, label: "No Change" },
                      { value: "enabled", label: "Enable" },
                      { value: "disabled", label: "Disable" },
                    ]}
                    disabled={isReadOnlyDemo || botSettingsMutation.isPending}
                    onValueChange={setBulkEnabledInput}
                  />
                  <SettingSelect
                    label="Death Recovery"
                    value={bulkDeathRecoveryInput}
                    options={[
                      { value: NO_CHANGE, label: "No Change" },
                      { value: "enabled", label: "Enable" },
                      { value: "disabled", label: "Disable" },
                    ]}
                    disabled={isReadOnlyDemo || botSettingsMutation.isPending}
                    onValueChange={setBulkDeathRecoveryInput}
                  />
                  <SettingSelect
                    label="Role Override"
                    value={bulkRoleOverrideInput}
                    options={[
                      { value: NO_CHANGE, label: "No Change" },
                      ...roleOverrideOptions.map((option) => ({
                        value: String(option.value),
                        label: option.label,
                      })),
                    ]}
                    disabled={isReadOnlyDemo || botSettingsMutation.isPending}
                    onValueChange={setBulkRoleOverrideInput}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      isReadOnlyDemo ||
                      botSettingsMutation.isPending ||
                      !hasBulkSettingsPatch
                    }
                    onClick={() =>
                      botSettingsMutation.mutate({
                        botIds: selectedBotIds,
                        label: formatBotSelectionLabel(selectedBotIds.length),
                        patch: bulkSettingsPatch,
                      })
                    }
                  >
                    Apply To Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={
                      bulkEnabledInput === NO_CHANGE &&
                      bulkDeathRecoveryInput === NO_CHANGE &&
                      bulkRoleOverrideInput === NO_CHANGE
                    }
                    onClick={() => {
                      setBulkEnabledInput(NO_CHANGE);
                      setBulkDeathRecoveryInput(NO_CHANGE);
                      setBulkRoleOverrideInput(NO_CHANGE);
                    }}
                  >
                    Reset Bulk Draft
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {filteredBots.length === 0 ? (
              <div className="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-sm md:col-span-2">
                No bots match the current filters.
              </div>
            ) : (
              filteredBots.map((bot) => (
                <BotRuntimeCard
                  key={bot.botId}
                  bot={bot}
                  attention={
                    botAttentionById.get(bot.botId) ??
                    createHealthyBotAttention()
                  }
                  selected={selectedBots[bot.botId] === true}
                  disabled={isReadOnlyDemo}
                  pending={
                    botActionMutation.isPending || botSettingsMutation.isPending
                  }
                  onSelectedChange={(checked) =>
                    setSelectedBots((current) => {
                      if (!checked) {
                        const next = { ...current };
                        delete next[bot.botId];
                        return next;
                      }
                      return {
                        ...current,
                        [bot.botId]: true,
                      };
                    })
                  }
                  onPauseResume={() =>
                    botActionMutation.mutate({
                      kind: bot.paused ? "resume" : "pause",
                      botIds: [bot.botId],
                      label: bot.accountName,
                    })
                  }
                  onStop={() =>
                    botActionMutation.mutate({
                      kind: "stop",
                      botIds: [bot.botId],
                      label: bot.accountName,
                    })
                  }
                  onResetMemory={() =>
                    botActionMutation.mutate({
                      kind: "reset-memory",
                      botIds: [bot.botId],
                      label: bot.accountName,
                    })
                  }
                  onReleaseClaims={() =>
                    botActionMutation.mutate({
                      kind: "release-claims",
                      botIds: [bot.botId],
                      label: bot.accountName,
                    })
                  }
                  onInspectMemory={() => setMemoryBotId(bot.botId)}
                  onUpdateSettings={(patch) =>
                    botSettingsMutation.mutate({
                      botIds: [bot.botId],
                      label: bot.accountName,
                      patch,
                    })
                  }
                />
              ))
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <RunHealthCard
            entries={botAttentionEntries}
            criticalCount={attentionCounts.critical}
            warningCount={attentionCounts.warning}
            healthyCount={attentionCounts.healthy}
            onInspectMemory={setMemoryBotId}
            onSelectBot={(botId) =>
              setSelectedBots((current) => ({
                ...current,
                [botId]: true,
              }))
            }
          />

          <MemoryInspectorCard
            bots={teamState.bots}
            selectedBotId={memoryBotId}
            maxEntriesInput={memoryMaxEntriesInput}
            onBotIdChange={setMemoryBotId}
            onMaxEntriesInputChange={setMemoryMaxEntriesInput}
            memoryState={memoryStateQuery.data}
            isLoading={memoryStateQuery.isPending}
            isRefreshing={memoryStateQuery.isFetching}
            errorMessage={
              memoryStateQuery.error instanceof Error
                ? memoryStateQuery.error.message
                : memoryStateQuery.error
                  ? String(memoryStateQuery.error)
                  : null
            }
            resetDisabled={
              isReadOnlyDemo ||
              botActionMutation.isPending ||
              inspectedMemoryBot === undefined
            }
            onResetMemory={() => {
              if (inspectedMemoryBot === undefined) {
                return;
              }

              botActionMutation.mutate({
                kind: "reset-memory",
                botIds: [inspectedMemoryBot.botId],
                label: inspectedMemoryBot.accountName,
              });
            }}
          />

          <CoordinationCard
            title="Shared Claims"
            description="Exact team reservations that can be released from the dashboard."
            emptyState="No active claims."
          >
            {coordinationState.claims.map((claim) => (
              <div
                key={claim.key}
                className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">{claim.key}</p>
                  <p className="text-muted-foreground text-xs">
                    Owner {claim.ownerAccountName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Target {formatPosition(claim.target)}
                  </p>
                  {claim.expiresAt && (
                    <p className="text-muted-foreground text-xs">
                      Expires{" "}
                      <SFTimeAgo date={timestampToDate(claim.expiresAt)} />
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isReadOnlyDemo || claimMutation.isPending}
                  onClick={() => claimMutation.mutate(claim.key)}
                >
                  Release
                </Button>
              </div>
            ))}
          </CoordinationCard>

          <CoordinationCard
            title="Shared Structure Intel"
            description="Recent shared blocks that the coordinator can reuse."
            emptyState="No shared block hints yet."
          >
            {coordinationState.sharedBlocks.map((block) => (
              <div
                key={`${block.dimension}:${block.x}:${block.y}:${block.z}:${block.blockId}`}
                className="space-y-1 rounded-lg border px-3 py-2"
              >
                <p className="truncate text-sm font-medium">{block.blockId}</p>
                <p className="text-muted-foreground text-xs">
                  {block.dimension} @ {block.x}, {block.y}, {block.z}
                </p>
                <p className="text-muted-foreground text-xs">
                  Seen by {block.observerAccountName}
                </p>
              </div>
            ))}
          </CoordinationCard>

          <CoordinationCard
            title="Eye Samples"
            description="Stronghold triangulation samples shared across the team."
            emptyState="No eye samples recorded."
          >
            {coordinationState.eyeSamples.map((sample) => (
              <div
                key={`${sample.botId}:${sample.recordedAt?.seconds ?? "0"}`}
                className="space-y-1 rounded-lg border px-3 py-2"
              >
                <p className="truncate text-sm font-medium">
                  {sample.accountName}
                </p>
                <p className="text-muted-foreground text-xs">
                  Origin {formatPosition(sample.origin)}
                </p>
                <p className="text-muted-foreground text-xs">
                  Direction {formatPosition(sample.direction)}
                </p>
              </div>
            ))}
          </CoordinationCard>
        </div>
      </div>
    </div>
  );
}

function StatCard(props: {
  title: string;
  value: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardDescription>{props.title}</CardDescription>
          <CardTitle className="text-2xl">{props.value}</CardTitle>
        </div>
        <props.icon className="text-muted-foreground size-5" />
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{props.description}</p>
      </CardContent>
    </Card>
  );
}

function SettingToggle(props: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border px-3 py-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">{props.label}</p>
        <p className="text-muted-foreground text-xs">{props.description}</p>
      </div>
      <Switch
        checked={props.checked}
        disabled={props.disabled}
        onCheckedChange={props.onCheckedChange}
      />
    </div>
  );
}

function SettingSelect(props: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  disabled: boolean;
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">{props.label}</p>
      <Select
        value={props.value}
        disabled={props.disabled}
        onValueChange={props.onValueChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {props.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function BotRuntimeCard(props: {
  bot: AutomationBotState;
  attention: BotAttentionStatus;
  selected: boolean;
  disabled: boolean;
  pending: boolean;
  onSelectedChange: (checked: boolean) => void;
  onPauseResume: () => void;
  onStop: () => void;
  onResetMemory: () => void;
  onReleaseClaims: () => void;
  onInspectMemory: () => void;
  onUpdateSettings: (patch: BotSettingsPatch) => void;
}) {
  const botSettings =
    props.bot.settings ?? create(AutomationBotSettingsSchema, {});
  const [draft, setDraft] = useState(() => createBotSettingsDraft(botSettings));
  const botSettingsPatch = useMemo(
    () => buildBotSettingsPatch(botSettings, draft),
    [botSettings, draft],
  );
  const hasSettingsChanges = Object.keys(botSettingsPatch).length > 0;
  const hasValidTuningInputs = botTuningNumberConfigs.every((config) =>
    isValidBotSettingInput(draft[config.key], config.min, config.max),
  );

  useEffect(() => {
    setDraft(createBotSettingsDraft(botSettings));
  }, [
    botSettings.allowDeathRecovery,
    botSettings.enabled,
    botSettings.memoryScanIntervalTicks,
    botSettings.memoryScanRadius,
    botSettings.retreatFoodThreshold,
    botSettings.retreatHealthThreshold,
    botSettings.roleOverride,
    botSettings,
  ]);

  return (
    <Card
      className={cn(
        "h-full",
        props.selected && "border-primary/50 ring-primary/20 ring-1",
      )}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Checkbox
              checked={props.selected}
              disabled={props.pending}
              onCheckedChange={(checked) =>
                props.onSelectedChange(checked === true)
              }
            />
            <div className="min-w-0">
              <CardTitle className="truncate text-lg">
                {props.bot.accountName}
              </CardTitle>
              <CardDescription className="truncate">
                {props.bot.statusSummary}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Badge variant="outline">{goalModeLabel(props.bot.goalMode)}</Badge>
            <Badge variant={props.bot.paused ? "secondary" : "outline"}>
              {props.bot.paused ? "Paused" : "Live"}
            </Badge>
            <Badge
              variant="outline"
              className={attentionBadgeClassName(props.attention.severity)}
            >
              {props.attention.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <InfoRow
            label="Team Role"
            value={roleLabel(props.bot.teamRole)}
            icon={SwordsIcon}
          />
          <InfoRow
            label="Objective"
            value={objectiveLabel(props.bot.teamObjective)}
            icon={CrosshairIcon}
          />
          <InfoRow
            label="Phase"
            value={
              props.bot.beatPhase ? beatPhaseLabel(props.bot.beatPhase) : "None"
            }
            icon={BrainCircuitIcon}
          />
          <InfoRow
            label="Position"
            value={formatPosition(props.bot.position)}
            icon={WaypointsIcon}
          />
          <InfoRow
            label="Dimension"
            value={props.bot.dimension || "Unknown"}
            icon={RouteIcon}
          />
          <InfoRow
            label="Current Action"
            value={props.bot.currentAction || "None"}
            icon={PackageIcon}
          />
          <InfoRow
            label="Deaths / Timeouts"
            value={`${props.bot.deathCount} / ${props.bot.timeoutCount}`}
            icon={ShieldAlertIcon}
          />
          <InfoRow
            label="Recoveries"
            value={String(props.bot.recoveryCount)}
            icon={RefreshCcwIcon}
          />
        </div>

        {props.bot.target && (
          <div className="rounded-lg border px-3 py-2">
            <p className="text-muted-foreground text-xs">Current Target</p>
            <p className="text-sm font-medium">
              {props.bot.target.displayName} x{props.bot.target.count}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Queued Requirements</p>
          {props.bot.queuedTargets.length === 0 ? (
            <p className="text-muted-foreground text-sm">Queue empty.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {props.bot.queuedTargets.map((target) => (
                <Badge
                  key={`${target.requirementKey}:${target.count}`}
                  variant="secondary"
                >
                  {target.displayName} x{target.count}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-lg border px-3 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Run Health</p>
              <p className="text-muted-foreground text-xs">
                Derived diagnostics from progress age, timeouts, deaths,
                recoveries, and queued work.
              </p>
            </div>
            <Badge
              variant="outline"
              className={attentionBadgeClassName(props.attention.severity)}
            >
              {props.attention.label}
            </Badge>
          </div>
          <p className="text-sm font-medium">{props.attention.summary}</p>
          <div className="flex flex-wrap gap-2">
            {props.attention.reasons.map((reason) => (
              <Badge key={reason} variant="secondary" className="text-left">
                {reason}
              </Badge>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            Operator hint: {props.attention.operatorHint}
          </p>
        </div>

        <div className="space-y-3 rounded-lg border px-3 py-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Automation Tuning</p>
            <p className="text-muted-foreground text-xs">
              Persisted bot-level settings with inline defaults, ranges, and
              role control.
            </p>
          </div>
          <SettingToggle
            label="Automation Enabled"
            description="Master switch. Turning this off also stops the current run on connected bots."
            checked={draft.enabled}
            disabled={props.disabled || props.pending}
            onCheckedChange={(checked) =>
              setDraft((current) => ({ ...current, enabled: checked }))
            }
          />
          <SettingToggle
            label="Allow Death Recovery"
            description="Default on. Recover dropped items after deaths before resuming progression."
            checked={draft.allowDeathRecovery}
            disabled={props.disabled || props.pending}
            onCheckedChange={(checked) =>
              setDraft((current) => ({
                ...current,
                allowDeathRecovery: checked,
              }))
            }
          />
          <SettingSelect
            label="Role Override"
            value={String(draft.roleOverride)}
            options={roleOverrideOptions.map((option) => ({
              value: String(option.value),
              label: option.label,
            }))}
            disabled={props.disabled || props.pending}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                roleOverride: Number(value) as AutomationTeamRole,
              }))
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {botTuningNumberConfigs.map((config) => (
              <div key={config.key} className="grid gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{config.label}</p>
                  <p className="text-muted-foreground text-xs">
                    {config.description}
                  </p>
                </div>
                <Input
                  type="number"
                  min={config.min}
                  max={config.max}
                  value={draft[config.key]}
                  disabled={props.disabled || props.pending}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      [config.key]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={
                props.disabled ||
                props.pending ||
                !hasValidTuningInputs ||
                !hasSettingsChanges
              }
              onClick={() => props.onUpdateSettings(botSettingsPatch)}
            >
              Apply Tuning
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={props.disabled || props.pending || !hasSettingsChanges}
              onClick={() => setDraft(createBotSettingsDraft(botSettings))}
            >
              Reset Draft
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={props.disabled || props.pending}
            onClick={props.onPauseResume}
          >
            {props.bot.paused ? (
              <>
                <PlayIcon className="size-4" />
                Resume
              </>
            ) : (
              <>
                <PauseIcon className="size-4" />
                Pause
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={props.disabled || props.pending}
            onClick={props.onStop}
          >
            <StopCircleIcon className="size-4" />
            Stop
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={props.disabled || props.pending}
            onClick={props.onInspectMemory}
          >
            <BrainCircuitIcon className="size-4" />
            Inspect Memory
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={props.disabled || props.pending}
            onClick={props.onResetMemory}
          >
            <RotateCcwIcon className="size-4" />
            Reset Memory
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={props.disabled || props.pending}
            onClick={props.onReleaseClaims}
          >
            <WaypointsIcon className="size-4" />
            Release Claims
          </Button>
        </div>

        <div className="text-muted-foreground text-xs">
          Last progress{" "}
          {props.bot.lastProgressAt ? (
            <SFTimeAgo date={timestampToDate(props.bot.lastProgressAt)} />
          ) : (
            "unknown"
          )}
          {props.bot.lastRecoveryReason
            ? `, last recovery: ${props.bot.lastRecoveryReason}`
            : ""}
        </div>
      </CardContent>
    </Card>
  );
}

function CoordinationCard(props: {
  title: string;
  description: string;
  emptyState: string;
  children: ReactNode;
}) {
  const hasItems = Array.isArray(props.children)
    ? props.children.length > 0
    : props.children !== null && props.children !== undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription>{props.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasItems ? (
          <ScrollArea className="h-72 pr-3">
            <div className="space-y-3">{props.children}</div>
          </ScrollArea>
        ) : (
          <p className="text-muted-foreground text-sm">{props.emptyState}</p>
        )}
      </CardContent>
    </Card>
  );
}

function RunHealthCard(props: {
  entries: BotAttentionEntry[];
  criticalCount: number;
  warningCount: number;
  healthyCount: number;
  onInspectMemory: (botId: string) => void;
  onSelectBot: (botId: string) => void;
}) {
  const attentionEntries = props.entries.filter(
    (entry) => entry.attention.severity !== "ok",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Health</CardTitle>
        <CardDescription>
          First operator-facing stuck-bot diagnostics derived from current
          runtime snapshots.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoRow
            label="Critical Bots"
            value={String(props.criticalCount)}
            icon={ShieldAlertIcon}
          />
          <InfoRow
            label="Warning Bots"
            value={String(props.warningCount)}
            icon={RefreshCcwIcon}
          />
          <InfoRow
            label="Healthy Bots"
            value={String(props.healthyCount)}
            icon={PlayIcon}
          />
        </div>
        {attentionEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No bots currently look stalled or degraded from the available
            runtime signals.
          </p>
        ) : (
          <ScrollArea className="h-72 pr-3">
            <div className="space-y-3">
              {attentionEntries.map((entry) => (
                <div
                  key={entry.bot.botId}
                  className="space-y-2 rounded-lg border px-3 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {entry.bot.accountName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {entry.attention.summary}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={attentionBadgeClassName(
                        entry.attention.severity,
                      )}
                    >
                      {entry.attention.label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.attention.reasons.map((reason) => (
                      <Badge key={reason} variant="secondary">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Operator hint: {entry.attention.operatorHint}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => props.onInspectMemory(entry.bot.botId)}
                    >
                      <BrainCircuitIcon className="size-4" />
                      Inspect Memory
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => props.onSelectBot(entry.bot.botId)}
                    >
                      Select Bot
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function MemoryInspectorCard(props: {
  bots: AutomationBotState[];
  selectedBotId: string;
  maxEntriesInput: string;
  onBotIdChange: (botId: string) => void;
  onMaxEntriesInputChange: (value: string) => void;
  memoryState: AutomationMemoryState | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  resetDisabled: boolean;
  onResetMemory: () => void;
}) {
  const selectedBot = props.bots.find(
    (bot) => bot.botId === props.selectedBotId,
  );
  const selectedBotId = selectedBot?.botId ?? props.bots[0]?.botId ?? "";
  const memoryState = props.memoryState;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>Memory Browser</CardTitle>
          <CardDescription>
            Inspect remembered blocks, containers, entities, dropped items, and
            unreachable spots for one automation bot.
          </CardDescription>
        </div>
        {props.bots.length === 0 ? null : (
          <div className="grid gap-3">
            <SettingSelect
              label="Inspect Bot"
              value={selectedBotId}
              options={props.bots.map((bot) => ({
                value: bot.botId,
                label: bot.accountName,
              }))}
              disabled={false}
              onValueChange={props.onBotIdChange}
            />
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Snapshot Depth</p>
                  <p className="text-muted-foreground text-xs">
                    Returned per category. Valid range 1-32.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    className="w-20"
                    type="number"
                    min={1}
                    max={32}
                    value={props.maxEntriesInput}
                    onChange={(event) =>
                      props.onMaxEntriesInputChange(event.target.value)
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={props.resetDisabled}
                    onClick={props.onResetMemory}
                  >
                    <RotateCcwIcon className="size-4" />
                    Reset
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedBot && (
                  <>
                    <Badge variant="outline">
                      {roleLabel(selectedBot.teamRole)}
                    </Badge>
                    <Badge variant="outline">
                      {selectedBot.dimension || "Unknown"}
                    </Badge>
                    <Badge
                      variant={selectedBot.paused ? "secondary" : "outline"}
                    >
                      {selectedBot.paused ? "Paused" : "Live"}
                    </Badge>
                  </>
                )}
                {memoryState && (
                  <Badge variant="secondary">
                    Tick {String(memoryState.tick)}
                  </Badge>
                )}
                {props.isRefreshing && (
                  <Badge variant="secondary">Refreshing</Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {props.bots.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No automation bots are available for memory inspection.
          </p>
        ) : props.errorMessage ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm">
            <p className="font-medium">Memory snapshot failed.</p>
            <p className="text-muted-foreground mt-1">{props.errorMessage}</p>
          </div>
        ) : props.isLoading || memoryState === undefined ? (
          <div className="grid gap-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow
                label="Remembered Blocks"
                value={String(memoryState.rememberedBlockCount)}
                icon={WaypointsIcon}
              />
              <InfoRow
                label="Containers"
                value={String(memoryState.rememberedContainerCount)}
                icon={PackageIcon}
              />
              <InfoRow
                label="Entities"
                value={String(memoryState.rememberedEntityCount)}
                icon={SwordsIcon}
              />
              <InfoRow
                label="Dropped Items"
                value={String(memoryState.rememberedDroppedItemCount)}
                icon={RefreshCcwIcon}
              />
              <InfoRow
                label="Unreachable Spots"
                value={String(memoryState.unreachablePositionCount)}
                icon={ShieldAlertIcon}
              />
              <InfoRow
                label="Snapshot Owner"
                value={
                  memoryState.accountName ||
                  selectedBot?.accountName ||
                  "Unknown"
                }
                icon={BotMessageSquareIcon}
              />
            </div>

            <ScrollArea className="h-[30rem] pr-3">
              <div className="space-y-4">
                <MemorySection
                  title="Blocks"
                  description="Recent remembered block locations."
                  count={memoryState.blocks.length}
                  emptyState="No remembered blocks in this snapshot."
                >
                  {memoryState.blocks.map((block) => (
                    <div
                      key={`${block.x}:${block.y}:${block.z}:${block.blockId}`}
                      className="space-y-1 rounded-lg border px-3 py-2"
                    >
                      <p className="truncate text-sm font-medium">
                        {formatNamespacedId(block.blockId)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {block.x}, {block.y}, {block.z}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Seen{" "}
                        {formatSeenTick(memoryState.tick, block.lastSeenTick)}
                      </p>
                    </div>
                  ))}
                </MemorySection>

                <MemorySection
                  title="Containers"
                  description="Tracked storage blocks and whether they were inspected."
                  count={memoryState.containers.length}
                  emptyState="No remembered containers in this snapshot."
                >
                  {memoryState.containers.map((container) => (
                    <div
                      key={`${container.x}:${container.y}:${container.z}:${container.blockId}`}
                      className="space-y-1 rounded-lg border px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {formatNamespacedId(container.blockId)}
                        </p>
                        <Badge variant="outline">
                          {container.inspected ? "Inspected" : "Unopened"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {container.x}, {container.y}, {container.z}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {container.distinctItemKinds} item kinds,{" "}
                        {container.totalItemCount} total items
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Seen{" "}
                        {formatSeenTick(
                          memoryState.tick,
                          container.lastSeenTick,
                        )}
                      </p>
                    </div>
                  ))}
                </MemorySection>

                <MemorySection
                  title="Entities"
                  description="Recent live entities still remembered by automation."
                  count={memoryState.entities.length}
                  emptyState="No remembered entities in this snapshot."
                >
                  {memoryState.entities.map((entity) => (
                    <div
                      key={entity.entityId}
                      className="space-y-1 rounded-lg border px-3 py-2"
                    >
                      <p className="truncate text-sm font-medium">
                        {formatNamespacedId(entity.entityType)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatPosition(entity.position)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Entity {shortId(entity.entityId)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Seen{" "}
                        {formatSeenTick(memoryState.tick, entity.lastSeenTick)}
                      </p>
                    </div>
                  ))}
                </MemorySection>

                <MemorySection
                  title="Dropped Items"
                  description="Loot or grave items that may still be recoverable."
                  count={memoryState.droppedItems.length}
                  emptyState="No remembered dropped items in this snapshot."
                >
                  {memoryState.droppedItems.map((item) => (
                    <div
                      key={item.entityId}
                      className="space-y-1 rounded-lg border px-3 py-2"
                    >
                      <p className="truncate text-sm font-medium">
                        {formatNamespacedId(item.itemId)} x{item.count}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatPosition(item.position)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Entity {shortId(item.entityId)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Seen{" "}
                        {formatSeenTick(memoryState.tick, item.lastSeenTick)}
                      </p>
                    </div>
                  ))}
                </MemorySection>

                <MemorySection
                  title="Unreachable Positions"
                  description="Known bad positions that automation is temporarily avoiding."
                  count={memoryState.unreachablePositions.length}
                  emptyState="No unreachable positions in this snapshot."
                >
                  {memoryState.unreachablePositions.map((position) => (
                    <div
                      key={`${position.x}:${position.y}:${position.z}:${position.untilTick}`}
                      className="space-y-1 rounded-lg border px-3 py-2"
                    >
                      <p className="truncate text-sm font-medium">
                        {position.x}, {position.y}, {position.z}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatUntilTick(memoryState.tick, position.untilTick)}
                      </p>
                    </div>
                  ))}
                </MemorySection>
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MemorySection(props: {
  title: string;
  description: string;
  count: number;
  emptyState: string;
  children: ReactNode;
}) {
  const hasItems = Array.isArray(props.children)
    ? props.children.length > 0
    : props.children !== null && props.children !== undefined;

  return (
    <section className="space-y-2 rounded-lg border px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{props.title}</p>
          <p className="text-muted-foreground text-xs">{props.description}</p>
        </div>
        <Badge variant="outline">{props.count}</Badge>
      </div>
      {hasItems ? (
        <div className="space-y-2">{props.children}</div>
      ) : (
        <p className="text-muted-foreground text-sm">{props.emptyState}</p>
      )}
    </section>
  );
}

function InfoRow(props: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border px-3 py-2">
      <props.icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{props.label}</p>
        <p className="truncate font-medium">{props.value}</p>
      </div>
    </div>
  );
}

function createQuotaInputState(
  settings: AutomationInstanceSettings,
): Record<string, string> {
  return Object.fromEntries(
    quotaOverrideConfigs.map((config) => [
      config.requirementKey,
      String(config.readSetting(settings)),
    ]),
  );
}

function quotaOverrideConfig(requirementKey: string) {
  const config = quotaOverrideConfigs.find(
    (entry) => entry.requirementKey === requirementKey,
  );
  if (config === undefined) {
    throw new Error(`Unknown quota override target: ${requirementKey}`);
  }
  return config;
}

function isValidQuotaInput(value: string, min: number, max: number): boolean {
  if (value.trim().length === 0) {
    return false;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max;
}

function createBotSettingsDraft(
  settings: AutomationBotSettings,
): BotSettingsDraft {
  return {
    enabled: settings.enabled,
    allowDeathRecovery: settings.allowDeathRecovery,
    roleOverride: settings.roleOverride,
    memoryScanRadius: String(settings.memoryScanRadius),
    memoryScanIntervalTicks: String(settings.memoryScanIntervalTicks),
    retreatHealthThreshold: String(settings.retreatHealthThreshold),
    retreatFoodThreshold: String(settings.retreatFoodThreshold),
  };
}

function buildBotSettingsPatch(
  settings: AutomationBotSettings,
  draft: BotSettingsDraft,
): BotSettingsPatch {
  const patch: BotSettingsPatch = {};

  if (draft.enabled !== settings.enabled) {
    patch.enabled = draft.enabled;
  }
  if (draft.allowDeathRecovery !== settings.allowDeathRecovery) {
    patch.allowDeathRecovery = draft.allowDeathRecovery;
  }
  if (draft.roleOverride !== settings.roleOverride) {
    patch.roleOverride = draft.roleOverride;
  }
  if (Number(draft.memoryScanRadius) !== settings.memoryScanRadius) {
    patch.memoryScanRadius = Number(draft.memoryScanRadius);
  }
  if (
    Number(draft.memoryScanIntervalTicks) !== settings.memoryScanIntervalTicks
  ) {
    patch.memoryScanIntervalTicks = Number(draft.memoryScanIntervalTicks);
  }
  if (
    Number(draft.retreatHealthThreshold) !== settings.retreatHealthThreshold
  ) {
    patch.retreatHealthThreshold = Number(draft.retreatHealthThreshold);
  }
  if (Number(draft.retreatFoodThreshold) !== settings.retreatFoodThreshold) {
    patch.retreatFoodThreshold = Number(draft.retreatFoodThreshold);
  }

  return patch;
}

function isValidBotSettingInput(
  value: string,
  min: number,
  max: number,
): boolean {
  return isValidQuotaInput(value, min, max);
}

function normalizeBotDimension(dimension: string): string {
  return dimension.replace("minecraft:", "");
}

function dimensionLabel(dimension: string): string {
  return dimension
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatBotSelectionLabel(count: number): string {
  return `${count} selected bot${count === 1 ? "" : "s"}`;
}

function createHealthyBotAttention(): BotAttentionStatus {
  return {
    severity: "ok",
    label: "Healthy",
    summary: "Recent progress looks healthy.",
    reasons: ["Recent progress is within expected bounds."],
    operatorHint: "No intervention is suggested right now.",
  };
}

function describeBotAttention(
  bot: AutomationBotState,
  nowMs: number,
): BotAttentionStatus {
  const reasons: string[] = [];
  let severity: BotAttentionSeverity = "ok";
  const lastProgressAtMs = bot.lastProgressAt
    ? timestampToDate(bot.lastProgressAt).getTime()
    : null;
  const staleSeconds =
    lastProgressAtMs === null
      ? null
      : Math.max(0, Math.floor((nowMs - lastProgressAtMs) / 1000));

  const promote = (next: BotAttentionSeverity, reason: string) => {
    if (severityRank(next) > severityRank(severity)) {
      severity = next;
    }
    reasons.push(reason);
  };

  if (bot.paused) {
    promote("warning", "Paused by operator.");
  }
  if (bot.goalMode === AutomationGoalMode.IDLE && !bot.paused) {
    promote("warning", "No active automation goal.");
  }
  if (staleSeconds !== null && staleSeconds >= 180) {
    promote(
      "critical",
      `No progress for ${formatDurationSeconds(staleSeconds)}.`,
    );
  } else if (staleSeconds !== null && staleSeconds >= 75) {
    promote(
      "warning",
      `No progress for ${formatDurationSeconds(staleSeconds)}.`,
    );
  }
  if (bot.timeoutCount >= 3) {
    promote("critical", `${bot.timeoutCount} timeouts recorded.`);
  } else if (bot.timeoutCount >= 2) {
    promote("warning", `${bot.timeoutCount} timeouts recorded.`);
  }
  if (bot.deathCount >= 3) {
    promote("critical", `${bot.deathCount} deaths recorded.`);
  } else if (bot.deathCount >= 2) {
    promote("warning", `${bot.deathCount} deaths recorded.`);
  }
  if (!bot.currentAction && bot.queuedTargets.length > 0) {
    promote(
      "warning",
      `Queue has ${bot.queuedTargets.length} pending target${bot.queuedTargets.length === 1 ? "" : "s"} but no active action.`,
    );
  }
  if (
    bot.recoveryCount >= 3 &&
    severityRank(severity) < severityRank("critical")
  ) {
    promote("warning", `${bot.recoveryCount} recoveries attempted.`);
  }
  if (bot.lastRecoveryReason && (severity !== "ok" || bot.recoveryCount >= 3)) {
    reasons.push(`Last recovery: ${bot.lastRecoveryReason}.`);
  }

  if (reasons.length === 0) {
    return createHealthyBotAttention();
  }

  return {
    severity,
    label: attentionLabel(bot, severity, staleSeconds),
    summary: reasons[0] ?? "Needs attention.",
    reasons,
    operatorHint: attentionOperatorHint(bot, severity, staleSeconds),
  };
}

function severityRank(severity: BotAttentionSeverity): number {
  switch (severity) {
    case "critical":
      return 2;
    case "warning":
      return 1;
    default:
      return 0;
  }
}

function compareBotAttentionEntries(
  left: BotAttentionEntry,
  right: BotAttentionEntry,
): number {
  const severityDelta =
    severityRank(right.attention.severity) -
    severityRank(left.attention.severity);
  if (severityDelta !== 0) {
    return severityDelta;
  }
  return left.bot.accountName.localeCompare(right.bot.accountName);
}

function matchesBotAttentionFilter(
  attention: BotAttentionStatus,
  filter: string,
): boolean {
  switch (filter) {
    case "attention":
      return attention.severity !== "ok";
    case "critical":
      return attention.severity === "critical";
    case "healthy":
      return attention.severity === "ok";
    default:
      return true;
  }
}

function attentionBadgeClassName(severity: BotAttentionSeverity): string {
  switch (severity) {
    case "critical":
      return "border-red-300 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200";
    case "warning":
      return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200";
    default:
      return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200";
  }
}

function attentionLabel(
  bot: AutomationBotState,
  severity: BotAttentionSeverity,
  staleSeconds: number | null,
): string {
  switch (severity) {
    case "critical":
      return "Critical";
    case "warning":
      if (bot.paused) {
        return "Paused";
      }
      if (staleSeconds !== null && staleSeconds >= 75) {
        return "Stalled";
      }
      return "Warning";
    default:
      return "Healthy";
  }
}

function attentionOperatorHint(
  bot: AutomationBotState,
  severity: BotAttentionSeverity,
  staleSeconds: number | null,
): string {
  if (bot.paused) {
    return "Resume only if the pause was intentional and the team is ready for this bot again.";
  }
  if (bot.goalMode === AutomationGoalMode.IDLE) {
    return "Start beat or acquire automation before expecting further progress.";
  }
  if (severity === "critical" && (staleSeconds ?? 0) >= 180) {
    return "Inspect memory, release claims, or reset memory if the bot is looping on stale world state.";
  }
  if (severity === "critical" && bot.timeoutCount >= 3) {
    return "This bot is repeatedly timing out; inspect memory first and consider pausing it if the team is thrashing.";
  }
  if (severity === "critical" && bot.deathCount >= 3) {
    return "Repeated deaths suggest bad local conditions; pause or retune this bot before it burns more shared resources.";
  }
  if (!bot.currentAction && bot.queuedTargets.length > 0) {
    return "Queued work exists without an active action; inspect memory and claim state for missing context.";
  }
  return "Inspect the bot memory snapshot before forcing broader team-wide interventions.";
}

function formatDurationSeconds(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${seconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function goalModeLabel(mode: AutomationGoalMode): string {
  switch (mode) {
    case AutomationGoalMode.ACQUIRE:
      return "Acquire";
    case AutomationGoalMode.BEAT:
      return "Beat";
    default:
      return "Idle";
  }
}

function beatPhaseLabel(phase: number): string {
  switch (phase) {
    case 1:
      return "Prepare Overworld";
    case 2:
      return "Enter Nether";
    case 3:
      return "Nether Collection";
    case 4:
      return "Return to Overworld";
    case 5:
      return "Stronghold Search";
    case 6:
      return "Activate Portal";
    case 7:
      return "End Fight";
    case 8:
      return "Complete";
    default:
      return "Unknown";
  }
}

function presetLabel(preset: AutomationPreset): string {
  return (
    presetOptions.find((option) => option.value === preset)?.label ?? "Unknown"
  );
}

function objectiveLabel(objective: AutomationTeamObjective): string {
  return (
    objectiveOptions.find((option) => option.value === objective)?.label ??
    "Unknown"
  );
}

function roleLabel(role: AutomationTeamRole): string {
  return (
    roleOverrideOptions.find((option) => option.value === role)?.label ??
    "Unknown"
  );
}

function formatPosition(
  position: { x?: number; y?: number; z?: number } | undefined,
): string {
  if (
    position?.x === undefined ||
    position?.y === undefined ||
    position?.z === undefined
  ) {
    return "Unknown";
  }

  return `${Math.floor(position.x)}, ${Math.floor(position.y)}, ${Math.floor(position.z)}`;
}

function formatNamespacedId(value: string): string {
  return value.startsWith("minecraft:")
    ? value.slice("minecraft:".length)
    : value;
}

function shortId(value: string): string {
  return value.length <= 8 ? value : value.slice(0, 8);
}

function formatSeenTick(
  currentTick: bigint | number,
  seenTick: bigint | number,
): string {
  const current = Number(currentTick);
  const seen = Number(seenTick);
  const delta = Math.max(0, current - seen);
  return delta === 0
    ? "this tick"
    : `${delta} tick${delta === 1 ? "" : "s"} ago`;
}

function formatUntilTick(
  currentTick: bigint | number,
  untilTick: bigint | number,
): string {
  const current = Number(currentTick);
  const until = Number(untilTick);
  if (until <= current) {
    return "Expired but still cached.";
  }

  const delta = until - current;
  return `Avoid for ${delta} more tick${delta === 1 ? "" : "s"}.`;
}

function createDemoAutomationTeamState(
  instanceId: string,
): AutomationTeamState {
  const now = new Date();
  return create(AutomationTeamStateSchema, {
    instanceId,
    friendlyName: "Demo Automation",
    settings: {
      preset: AutomationPreset.BALANCED_TEAM,
      teamCollaboration: true,
      rolePolicy: AutomationRolePolicy.STATIC_TEAM,
      sharedEndEntry: true,
      maxEndBots: 2,
      sharedStructureIntel: true,
      sharedTargetClaims: true,
      objectiveOverride: AutomationTeamObjective.UNSPECIFIED,
      targetBlazeRods: 0,
      targetEnderPearls: 0,
      targetEnderEyes: 0,
      targetArrows: 0,
      targetBeds: 0,
    },
    objective: AutomationTeamObjective.STRONGHOLD_HUNT,
    activeBots: 3,
    quotas: [
      {
        requirementKey: "blaze_rod",
        displayName: "Blaze Rod",
        currentCount: 6,
        targetCount: 8,
      },
      {
        requirementKey: "ender_pearl",
        displayName: "Ender Pearl",
        currentCount: 11,
        targetCount: 14,
      },
      {
        requirementKey: "ender_eye",
        displayName: "Ender Eye",
        currentCount: 9,
        targetCount: 12,
      },
      {
        requirementKey: "arrow",
        displayName: "Arrow",
        currentCount: 48,
        targetCount: 64,
      },
      {
        requirementKey: "any_bed",
        displayName: "Any Bed",
        currentCount: 2,
        targetCount: 2,
      },
    ],
    bots: [
      {
        instanceId,
        botId: "11111111-1111-1111-1111-111111111111",
        accountName: "PortalLead",
        statusSummary: "moving to stronghold estimate",
        goalMode: AutomationGoalMode.BEAT,
        teamRole: AutomationTeamRole.LEAD,
        teamObjective: AutomationTeamObjective.STRONGHOLD_HUNT,
        beatPhase: 5,
        currentAction: "following eye of ender",
        dimension: "minecraft:overworld",
        position: { x: 1412, y: 73, z: -288 },
        deathCount: 0,
        timeoutCount: 1,
        recoveryCount: 1,
        lastRecoveryReason: "resetting after death",
        lastProgressAt: create(TimestampSchema, {
          seconds: BigInt(Math.floor(now.getTime() / 1000) - 20),
          nanos: 0,
        }),
        settings: {
          enabled: true,
          allowDeathRecovery: true,
          memoryScanRadius: 48,
          memoryScanIntervalTicks: 20,
          retreatHealthThreshold: 8,
          retreatFoodThreshold: 12,
          roleOverride: AutomationTeamRole.UNSPECIFIED,
        },
        queuedTargets: [
          { requirementKey: "ender_eye", displayName: "Ender Eye", count: 3 },
        ],
      },
      {
        instanceId,
        botId: "22222222-2222-2222-2222-222222222222",
        accountName: "FortressScout",
        statusSummary: "stalled near fortress perimeter",
        goalMode: AutomationGoalMode.BEAT,
        teamRole: AutomationTeamRole.NETHER_RUNNER,
        teamObjective: AutomationTeamObjective.STRONGHOLD_HUNT,
        beatPhase: 3,
        currentAction: "approaching fortress",
        dimension: "minecraft:the_nether",
        position: { x: -132, y: 68, z: 244 },
        deathCount: 1,
        timeoutCount: 3,
        recoveryCount: 3,
        lastRecoveryReason: "recovering death drops",
        lastProgressAt: create(TimestampSchema, {
          seconds: BigInt(Math.floor(now.getTime() / 1000) - 205),
          nanos: 0,
        }),
        settings: {
          enabled: true,
          allowDeathRecovery: true,
          memoryScanRadius: 48,
          memoryScanIntervalTicks: 20,
          retreatHealthThreshold: 8,
          retreatFoodThreshold: 12,
          roleOverride: AutomationTeamRole.UNSPECIFIED,
        },
        queuedTargets: [
          { requirementKey: "blaze_rod", displayName: "Blaze Rod", count: 2 },
          {
            requirementKey: "ender_pearl",
            displayName: "Ender Pearl",
            count: 3,
          },
        ],
      },
      {
        instanceId,
        botId: "33333333-3333-3333-3333-333333333333",
        accountName: "EndSupport",
        statusSummary: "automation paused",
        goalMode: AutomationGoalMode.BEAT,
        paused: true,
        teamRole: AutomationTeamRole.END_SUPPORT,
        teamObjective: AutomationTeamObjective.STRONGHOLD_HUNT,
        beatPhase: 5,
        dimension: "minecraft:overworld",
        position: { x: 1398, y: 66, z: -254 },
        deathCount: 0,
        timeoutCount: 0,
        recoveryCount: 0,
        settings: {
          enabled: true,
          allowDeathRecovery: true,
          memoryScanRadius: 56,
          memoryScanIntervalTicks: 16,
          retreatHealthThreshold: 12,
          retreatFoodThreshold: 14,
          roleOverride: AutomationTeamRole.END_SUPPORT,
        },
        queuedTargets: [
          { requirementKey: "arrow", displayName: "Arrow", count: 16 },
        ],
      },
    ],
  });
}

function createDemoAutomationCoordinationState(
  instanceId: string,
): AutomationCoordinationState {
  const now = new Date();
  return create(AutomationCoordinationStateSchema, {
    instanceId,
    friendlyName: "Demo Automation",
    settings: {
      preset: AutomationPreset.BALANCED_TEAM,
      teamCollaboration: true,
      rolePolicy: AutomationRolePolicy.STATIC_TEAM,
      sharedEndEntry: true,
      maxEndBots: 2,
      sharedStructureIntel: true,
      sharedTargetClaims: true,
      objectiveOverride: AutomationTeamObjective.UNSPECIFIED,
      targetBlazeRods: 0,
      targetEnderPearls: 0,
      targetEnderEyes: 0,
      targetArrows: 0,
      targetBeds: 0,
    },
    objective: AutomationTeamObjective.STRONGHOLD_HUNT,
    activeBots: 3,
    sharedBlockCount: 7,
    claimCount: 2,
    eyeSampleCount: 2,
    sharedCounts: [
      {
        requirementKey: "blaze_rod",
        displayName: "Blaze Rod",
        currentCount: 6,
        targetCount: 8,
      },
      {
        requirementKey: "ender_pearl",
        displayName: "Ender Pearl",
        currentCount: 11,
        targetCount: 14,
      },
    ],
    sharedBlocks: [
      {
        observerBotId: "22222222-2222-2222-2222-222222222222",
        observerAccountName: "FortressScout",
        dimension: "minecraft:the_nether",
        x: -118,
        y: 70,
        z: 236,
        blockId: "minecraft:nether_bricks",
        lastSeenAt: create(TimestampSchema, {
          seconds: BigInt(Math.floor(now.getTime() / 1000) - 30),
          nanos: 0,
        }),
      },
      {
        observerBotId: "11111111-1111-1111-1111-111111111111",
        observerAccountName: "PortalLead",
        dimension: "minecraft:overworld",
        x: 1407,
        y: 34,
        z: -301,
        blockId: "minecraft:end_portal_frame",
        lastSeenAt: create(TimestampSchema, {
          seconds: BigInt(Math.floor(now.getTime() / 1000) - 15),
          nanos: 0,
        }),
      },
    ],
    claims: [
      {
        key: "block:portal-frame:minecraft:overworld:3829201281",
        ownerBotId: "11111111-1111-1111-1111-111111111111",
        ownerAccountName: "PortalLead",
        target: { x: 1407, y: 34, z: -301 },
        expiresAt: create(TimestampSchema, {
          seconds: BigInt(Math.floor(now.getTime() / 1000) + 20),
          nanos: 0,
        }),
      },
      {
        key: "explore3d:minecraft:the_nether:nether-fortress:-192:192:0:1:12",
        ownerBotId: "22222222-2222-2222-2222-222222222222",
        ownerAccountName: "FortressScout",
        target: { x: -191.5, y: 80, z: 288.5 },
        expiresAt: create(TimestampSchema, {
          seconds: BigInt(Math.floor(now.getTime() / 1000) + 40),
          nanos: 0,
        }),
      },
    ],
    eyeSamples: [
      {
        botId: "11111111-1111-1111-1111-111111111111",
        accountName: "PortalLead",
        origin: { x: 1200, y: 72, z: -420 },
        direction: { x: 0.84, y: 0, z: -0.54 },
        recordedAt: create(TimestampSchema, {
          seconds: BigInt(Math.floor(now.getTime() / 1000) - 90),
          nanos: 0,
        }),
      },
      {
        botId: "33333333-3333-3333-3333-333333333333",
        accountName: "EndSupport",
        origin: { x: 1324, y: 68, z: -310 },
        direction: { x: 0.62, y: 0, z: -0.78 },
        recordedAt: create(TimestampSchema, {
          seconds: BigInt(Math.floor(now.getTime() / 1000) - 75),
          nanos: 0,
        }),
      },
    ],
  });
}

function createDemoAutomationMemoryState(
  instanceId: string,
  botId: string,
  accountName: string,
  maxEntries: number,
): AutomationMemoryState {
  const baseTick = 214_580;

  switch (botId) {
    case "22222222-2222-2222-2222-222222222222":
      return create(AutomationMemoryStateSchema, {
        instanceId,
        botId,
        accountName,
        tick: BigInt(baseTick),
        rememberedBlockCount: 18,
        rememberedContainerCount: 2,
        rememberedEntityCount: 3,
        rememberedDroppedItemCount: 1,
        unreachablePositionCount: 2,
        blocks: [
          {
            x: -118,
            y: 70,
            z: 236,
            blockId: "minecraft:nether_bricks",
            lastSeenTick: BigInt(baseTick - 6),
          },
          {
            x: -104,
            y: 74,
            z: 219,
            blockId: "minecraft:blaze_spawner",
            lastSeenTick: BigInt(baseTick - 12),
          },
        ].slice(0, maxEntries),
        containers: [
          {
            x: -121,
            y: 68,
            z: 232,
            blockId: "minecraft:chest",
            inspected: true,
            distinctItemKinds: 3,
            totalItemCount: 9,
            lastSeenTick: BigInt(baseTick - 18),
          },
        ].slice(0, maxEntries),
        entities: [
          {
            entityId: "cafe0000-0000-0000-0000-000000000001",
            entityType: "minecraft:blaze",
            position: { x: -106, y: 74, z: 221 },
            lastSeenTick: BigInt(baseTick - 3),
          },
          {
            entityId: "cafe0000-0000-0000-0000-000000000002",
            entityType: "minecraft:wither_skeleton",
            position: { x: -130, y: 69, z: 244 },
            lastSeenTick: BigInt(baseTick - 14),
          },
        ].slice(0, maxEntries),
        droppedItems: [
          {
            entityId: "cafe0000-0000-0000-0000-000000000003",
            itemId: "minecraft:blaze_rod",
            count: 1,
            position: { x: -108, y: 74, z: 220 },
            lastSeenTick: BigInt(baseTick - 8),
          },
        ].slice(0, maxEntries),
        unreachablePositions: [
          {
            x: -140,
            y: 67,
            z: 252,
            untilTick: BigInt(baseTick + 40),
          },
        ].slice(0, maxEntries),
      });
    case "33333333-3333-3333-3333-333333333333":
      return create(AutomationMemoryStateSchema, {
        instanceId,
        botId,
        accountName,
        tick: BigInt(baseTick),
        rememberedBlockCount: 9,
        rememberedContainerCount: 1,
        rememberedEntityCount: 1,
        rememberedDroppedItemCount: 0,
        unreachablePositionCount: 1,
        blocks: [
          {
            x: 1394,
            y: 65,
            z: -252,
            blockId: "minecraft:oak_planks",
            lastSeenTick: BigInt(baseTick - 4),
          },
          {
            x: 1388,
            y: 65,
            z: -246,
            blockId: "minecraft:white_bed",
            lastSeenTick: BigInt(baseTick - 11),
          },
        ].slice(0, maxEntries),
        containers: [
          {
            x: 1392,
            y: 65,
            z: -250,
            blockId: "minecraft:chest",
            inspected: false,
            distinctItemKinds: 0,
            totalItemCount: 0,
            lastSeenTick: BigInt(baseTick - 11),
          },
        ].slice(0, maxEntries),
        entities: [
          {
            entityId: "cafe0000-0000-0000-0000-000000000004",
            entityType: "minecraft:villager",
            position: { x: 1389, y: 65, z: -248 },
            lastSeenTick: BigInt(baseTick - 13),
          },
        ].slice(0, maxEntries),
        unreachablePositions: [
          {
            x: 1406,
            y: 34,
            z: -301,
            untilTick: BigInt(baseTick + 12),
          },
        ].slice(0, maxEntries),
      });
    default:
      return create(AutomationMemoryStateSchema, {
        instanceId,
        botId,
        accountName,
        tick: BigInt(baseTick),
        rememberedBlockCount: 15,
        rememberedContainerCount: 2,
        rememberedEntityCount: 2,
        rememberedDroppedItemCount: 1,
        unreachablePositionCount: 1,
        blocks: [
          {
            x: 1407,
            y: 34,
            z: -301,
            blockId: "minecraft:end_portal_frame",
            lastSeenTick: BigInt(baseTick - 5),
          },
          {
            x: 1412,
            y: 73,
            z: -288,
            blockId: "minecraft:stone_bricks",
            lastSeenTick: BigInt(baseTick - 10),
          },
        ].slice(0, maxEntries),
        containers: [
          {
            x: 1415,
            y: 72,
            z: -285,
            blockId: "minecraft:chest",
            inspected: true,
            distinctItemKinds: 4,
            totalItemCount: 17,
            lastSeenTick: BigInt(baseTick - 14),
          },
        ].slice(0, maxEntries),
        entities: [
          {
            entityId: "cafe0000-0000-0000-0000-000000000005",
            entityType: "minecraft:enderman",
            position: { x: 1418, y: 72, z: -280 },
            lastSeenTick: BigInt(baseTick - 9),
          },
        ].slice(0, maxEntries),
        droppedItems: [
          {
            entityId: "cafe0000-0000-0000-0000-000000000006",
            itemId: "minecraft:ender_eye",
            count: 2,
            position: { x: 1410, y: 72, z: -287 },
            lastSeenTick: BigInt(baseTick - 16),
          },
        ].slice(0, maxEntries),
        unreachablePositions: [
          {
            x: 1411,
            y: 33,
            z: -297,
            untilTick: BigInt(baseTick + 20),
          },
        ].slice(0, maxEntries),
      });
  }
}
