import { create } from "@bufbuild/protobuf";
import { createClient } from "@connectrpc/connect";
import {
  queryOptions,
  useMutation,
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
import { useEffect, useMemo, useState } from "react";
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
  AutomationBotSettingsSchema,
  type AutomationBotState,
  type AutomationCoordinationState,
  AutomationCoordinationStateSchema,
  AutomationGoalMode,
  type AutomationInstanceSettings,
  AutomationInstanceSettingsSchema,
  AutomationPreset,
  AutomationRolePolicy,
  AutomationService,
  AutomationTeamObjective,
  AutomationTeamRole,
  type AutomationTeamState,
  AutomationTeamStateSchema,
} from "@/generated/soulfire/automation_pb.ts";
import { timestampToDate } from "@/lib/utils.tsx";
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

  const invalidateAutomation = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: automationTeamStateQueryOptions.queryKey,
      }),
      queryClient.invalidateQueries({
        queryKey: automationCoordinationStateQueryOptions.queryKey,
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
        | { kind: "pause"; botId: string; accountName: string }
        | { kind: "resume"; botId: string; accountName: string }
        | { kind: "stop"; botId: string; accountName: string }
        | { kind: "reset-memory"; botId: string; accountName: string }
        | { kind: "release-claims"; botId: string; accountName: string },
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
            botIds: [action.botId],
          });
        case "resume":
          return automationService.resumeAutomation({
            instanceId: instanceInfo.id,
            botIds: [action.botId],
          });
        case "stop":
          return automationService.stopAutomation({
            instanceId: instanceInfo.id,
            botIds: [action.botId],
          });
        case "reset-memory":
          return automationService.resetAutomationMemory({
            instanceId: instanceInfo.id,
            botIds: [action.botId],
          });
        case "release-claims":
          return automationService.releaseAutomationBotClaims({
            instanceId: instanceInfo.id,
            botIds: [action.botId],
          });
      }
    },
    onSuccess: async (_, action) => {
      await invalidateAutomation();
      toast.success(`${action.accountName}: ${action.kind.replace("-", " ")}.`);
    },
    onError: (error) => {
      toast.error("Bot automation action failed.", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  const botRoleMutation = useMutation({
    mutationFn: async (action: {
      botId: string;
      accountName: string;
      role: AutomationTeamRole;
    }) => {
      const activeTransport = createTransport();
      if (activeTransport === null) {
        return;
      }

      const automationService = createClient(
        AutomationService,
        activeTransport,
      );
      return automationService.setAutomationRoleOverride({
        instanceId: instanceInfo.id,
        botIds: [action.botId],
        role: action.role,
      });
    },
    onSuccess: async (_, action) => {
      await invalidateAutomation();
      toast.success(
        `${action.accountName}: role override set to ${roleLabel(action.role)}.`,
      );
    },
    onError: (error) => {
      toast.error("Failed to update role override.", {
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

  return (
    <div className="container flex h-full w-full grow flex-col gap-4 py-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          <CardHeader>
            <CardTitle>Bot Runtime</CardTitle>
            <CardDescription>
              Per-bot status, queue visibility, and quick interventions.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {teamState.bots.map((bot) => (
              <BotRuntimeCard
                key={bot.botId}
                bot={bot}
                disabled={isReadOnlyDemo}
                pending={
                  botActionMutation.isPending || botRoleMutation.isPending
                }
                onPauseResume={() =>
                  botActionMutation.mutate({
                    kind: bot.paused ? "resume" : "pause",
                    botId: bot.botId,
                    accountName: bot.accountName,
                  })
                }
                onStop={() =>
                  botActionMutation.mutate({
                    kind: "stop",
                    botId: bot.botId,
                    accountName: bot.accountName,
                  })
                }
                onResetMemory={() =>
                  botActionMutation.mutate({
                    kind: "reset-memory",
                    botId: bot.botId,
                    accountName: bot.accountName,
                  })
                }
                onReleaseClaims={() =>
                  botActionMutation.mutate({
                    kind: "release-claims",
                    botId: bot.botId,
                    accountName: bot.accountName,
                  })
                }
                onRoleOverrideChange={(role) =>
                  botRoleMutation.mutate({
                    botId: bot.botId,
                    accountName: bot.accountName,
                    role,
                  })
                }
              />
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4">
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
  disabled: boolean;
  pending: boolean;
  onPauseResume: () => void;
  onStop: () => void;
  onResetMemory: () => void;
  onReleaseClaims: () => void;
  onRoleOverrideChange: (role: AutomationTeamRole) => void;
}) {
  const botSettings =
    props.bot.settings ?? create(AutomationBotSettingsSchema, {});

  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-lg">
              {props.bot.accountName}
            </CardTitle>
            <CardDescription className="truncate">
              {props.bot.statusSummary}
            </CardDescription>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Badge variant="outline">{goalModeLabel(props.bot.goalMode)}</Badge>
            <Badge variant={props.bot.paused ? "secondary" : "outline"}>
              {props.bot.paused ? "Paused" : "Live"}
            </Badge>
          </div>
        </div>
        <SettingSelect
          label="Role Override"
          value={String(botSettings.roleOverride)}
          options={roleOverrideOptions.map((option) => ({
            value: String(option.value),
            label: option.label,
          }))}
          disabled={props.disabled || props.pending}
          onValueChange={(value) =>
            props.onRoleOverrideChange(Number(value) as AutomationTeamRole)
          }
        />
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
        statusSummary: "probing fortress perimeter",
        goalMode: AutomationGoalMode.BEAT,
        teamRole: AutomationTeamRole.NETHER_RUNNER,
        teamObjective: AutomationTeamObjective.STRONGHOLD_HUNT,
        beatPhase: 3,
        currentAction: "approaching fortress",
        dimension: "minecraft:the_nether",
        position: { x: -132, y: 68, z: 244 },
        deathCount: 1,
        timeoutCount: 2,
        recoveryCount: 2,
        lastRecoveryReason: "recovering death drops",
        lastProgressAt: create(TimestampSchema, {
          seconds: BigInt(Math.floor(now.getTime() / 1000) - 45),
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
