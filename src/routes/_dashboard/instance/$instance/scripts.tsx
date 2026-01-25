import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  EditIcon,
  PlayIcon,
  PlusIcon,
  SquareIcon,
  Trash2Icon,
  WorkflowIcon,
} from "lucide-react";
import { use, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import InstancePageLayout from "@/components/nav/instance/instance-page-layout.tsx";
import { TransportContext } from "@/components/providers/transport-context.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import type { ScriptInfo } from "@/generated/soulfire/script";
import { ScriptServiceClient } from "@/generated/soulfire/script.client";
import { ScriptScope, scriptListQueryOptions } from "@/lib/script-service.ts";

export const Route = createFileRoute("/_dashboard/instance/$instance/scripts")({
  component: InstanceScripts,
});

function InstanceScripts() {
  const { t } = useTranslation("common");
  const { t: tInstance } = useTranslation("instance");
  const { instance: instanceId } = Route.useParams();
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const transport = use(TransportContext);

  // Fetch scripts from server
  const { data: scriptsData } = useSuspenseQuery(
    scriptListQueryOptions(transport, instanceId),
  );
  const scripts = scriptsData?.scripts ?? [];

  const formId = useId();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newScriptName, setNewScriptName] = useState("");
  const [newScriptDescription, setNewScriptDescription] = useState("");

  // Create script mutation
  const createMutation = useMutation({
    mutationKey: ["script", "create", instanceId],
    mutationFn: async () => {
      if (!transport) throw new Error("No transport available");
      const client = new ScriptServiceClient(transport);
      const result = await client.createScript({
        instanceId,
        name: newScriptName.trim() || tInstance("scripts.untitledScript"),
        description: newScriptDescription.trim(),
        scope: ScriptScope.INSTANCE,
        nodes: [],
        edges: [],
        autoStart: false,
      });
      return result.response;
    },
    onSuccess: (response) => {
      toast.success(tInstance("scripts.createSuccess"));
      setNewScriptName("");
      setNewScriptDescription("");
      setIsCreateDialogOpen(false);
      // Navigate to the new script editor
      if (response.script) {
        void navigate({
          to: "/instance/$instance/script/$scriptId",
          params: { instance: instanceId, scriptId: response.script.id },
        });
      }
    },
    onError: (error) => {
      console.error("Failed to create script:", error);
      toast.error(tInstance("scripts.createError"));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["scripts", instanceId] });
    },
  });

  // Delete script mutation
  const deleteMutation = useMutation({
    mutationKey: ["script", "delete", instanceId],
    mutationFn: async (scriptId: string) => {
      if (!transport) throw new Error("No transport available");
      const client = new ScriptServiceClient(transport);
      await client.deleteScript({ instanceId, scriptId });
    },
    onSuccess: () => {
      toast.success(tInstance("scripts.deleteSuccess"));
    },
    onError: (error) => {
      console.error("Failed to delete script:", error);
      toast.error(tInstance("scripts.deleteError"));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["scripts", instanceId] });
    },
  });

  // Start script mutation
  const startMutation = useMutation({
    mutationKey: ["script", "start", instanceId],
    mutationFn: async (scriptId: string) => {
      if (!transport) throw new Error("No transport available");
      const client = new ScriptServiceClient(transport);
      // Just start the script - we don't need to track the stream here
      // since that's handled in the editor view
      const { responses } = client.startScript({
        instanceId,
        scriptId,
        inputs: {},
      });
      // Consume the stream in the background
      responses.onMessage(() => {});
      responses.onComplete(() => {});
      responses.onError(() => {});
    },
    onSuccess: () => {
      toast.success(tInstance("scripts.startSuccess"));
    },
    onError: (error) => {
      console.error("Failed to start script:", error);
      toast.error(tInstance("scripts.startError"));
    },
  });

  // Stop script mutation
  const stopMutation = useMutation({
    mutationKey: ["script", "stop", instanceId],
    mutationFn: async (scriptId: string) => {
      if (!transport) throw new Error("No transport available");
      const client = new ScriptServiceClient(transport);
      await client.stopScript({ instanceId, scriptId });
    },
    onSuccess: () => {
      toast.success(tInstance("scripts.stopSuccess"));
    },
    onError: (error) => {
      console.error("Failed to stop script:", error);
      toast.error(tInstance("scripts.stopError"));
    },
  });

  const handleCreateScript = () => {
    createMutation.mutate();
  };

  const handleDeleteScript = (scriptId: string) => {
    deleteMutation.mutate(scriptId);
  };

  const handleToggleRunning = (scriptId: string, isRunning: boolean) => {
    if (isRunning) {
      stopMutation.mutate(scriptId);
    } else {
      startMutation.mutate(scriptId);
    }
  };

  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: "controls",
          content: t("breadcrumbs.controls"),
        },
      ]}
      pageName={t("pageName.instanceScripts")}
    >
      <div className="container flex h-full w-full grow flex-col gap-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">
              {tInstance("scripts.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tInstance("scripts.description")}
            </p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <PlusIcon className="size-4" />
                {tInstance("scripts.createScript")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {tInstance("scripts.createScriptTitle")}
                </DialogTitle>
                <DialogDescription>
                  {tInstance("scripts.createScriptDescription")}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${formId}-script-name`}>
                    {tInstance("scripts.scriptName")}
                  </Label>
                  <Input
                    id={`${formId}-script-name`}
                    value={newScriptName}
                    onChange={(e) => setNewScriptName(e.target.value)}
                    placeholder={tInstance("scripts.scriptNamePlaceholder")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${formId}-script-description`}>
                    {tInstance("scripts.scriptDescription")}
                  </Label>
                  <Textarea
                    id={`${formId}-script-description`}
                    value={newScriptDescription}
                    onChange={(e) => setNewScriptDescription(e.target.value)}
                    placeholder={tInstance(
                      "scripts.scriptDescriptionPlaceholder",
                    )}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={handleCreateScript}
                  disabled={createMutation.isPending}
                >
                  {tInstance("scripts.create")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Scripts Grid */}
        {scripts.length === 0 ? (
          <Card className="mx-auto mt-8 max-w-2xl">
            <CardHeader className="text-center">
              <div className="mb-4 flex justify-center">
                <WorkflowIcon className="size-16 text-muted-foreground" />
              </div>
              <CardTitle>{tInstance("scripts.noScripts")}</CardTitle>
              <CardDescription>
                {tInstance("scripts.noScriptsDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="gap-2"
              >
                <PlusIcon className="size-4" />
                {tInstance("scripts.createFirstScript")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scripts.map((script) => (
              <ScriptCard
                key={script.id}
                script={script}
                instanceId={instanceInfo.id}
                onDelete={() => handleDeleteScript(script.id)}
                onToggleRunning={(isRunning) =>
                  handleToggleRunning(script.id, isRunning)
                }
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </InstancePageLayout>
  );
}

interface ScriptCardProps {
  script: ScriptInfo;
  instanceId: string;
  onDelete: () => void;
  onToggleRunning: (isRunning: boolean) => void;
  isDeleting: boolean;
}

function ScriptCard({
  script,
  instanceId,
  onDelete,
  onToggleRunning,
  isDeleting,
}: ScriptCardProps) {
  const { t: tInstance } = useTranslation("instance");
  const transport = use(TransportContext);

  // Query for script status to check if running
  const { data: statusData } = useSuspenseQuery({
    queryKey: ["script-status", instanceId, script.id],
    queryFn: async () => {
      if (!transport) return null;
      try {
        const client = new ScriptServiceClient(transport);
        const result = await client.getScriptStatus({
          instanceId,
          scriptId: script.id,
        });
        return result.response.status;
      } catch {
        return null;
      }
    },
    refetchInterval: 3_000,
  });

  const isRunning = statusData?.isRunning ?? false;

  const formatLastModified = (
    timestamp: { seconds: string; nanos: number } | undefined,
  ) => {
    if (!timestamp) return "";
    const date = new Date(Number(timestamp.seconds) * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    return `${diffDays}d ago`;
  };

  return (
    <Card className="group relative transition-colors hover:bg-muted/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <WorkflowIcon className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">{script.name}</CardTitle>
          </div>
          {isRunning && (
            <Badge variant="default" className="gap-1.5 bg-green-600">
              <div className="size-2 animate-pulse rounded-full bg-white" />
              {tInstance("scripts.running")}
            </Badge>
          )}
        </div>
        <CardDescription className="line-clamp-2">
          {script.description || tInstance("scripts.noDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{script.scope === 0 ? "Instance" : "Bot"} scope</span>
          <span>{formatLastModified(script.updatedAt)}</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            asChild
          >
            <Link
              to="/instance/$instance/script/$scriptId"
              params={{ instance: instanceId, scriptId: script.id }}
            >
              <EditIcon className="size-3.5" />
              {tInstance("scripts.edit")}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onToggleRunning(isRunning)}
            title={
              isRunning ? tInstance("scripts.stop") : tInstance("scripts.start")
            }
          >
            {isRunning ? (
              <SquareIcon className="size-4" />
            ) : (
              <PlayIcon className="size-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onDelete}
            disabled={isDeleting}
            title={tInstance("scripts.delete")}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
