import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  EditIcon,
  PlayIcon,
  PlusIcon,
  SquareIcon,
  Trash2Icon,
  WorkflowIcon,
} from "lucide-react";
import { useId, useState } from "react";
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

export const Route = createFileRoute("/_dashboard/instance/$instance/scripts")({
  component: InstanceScripts,
});

// Demo script data - in production this would come from gRPC
interface Script {
  id: string;
  name: string;
  description: string;
  isRunning: boolean;
  lastModified: Date;
  nodeCount: number;
}

// Demo data for visual script editor preview
const DEMO_SCRIPTS: Script[] = [
  {
    id: "demo-1",
    name: "Auto Farm",
    description: "Automatically farms crops in a designated area",
    isRunning: false,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    nodeCount: 12,
  },
  {
    id: "demo-2",
    name: "Combat Bot",
    description: "Automatically attacks nearby hostile mobs",
    isRunning: true,
    lastModified: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    nodeCount: 8,
  },
  {
    id: "demo-3",
    name: "Chat Responder",
    description: "Responds to chat messages with predefined replies",
    isRunning: false,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    nodeCount: 5,
  },
];

function InstanceScripts() {
  const { t } = useTranslation("common");
  const { t: tInstance } = useTranslation("instance");
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);

  const formId = useId();
  const [scripts, setScripts] = useState<Script[]>(DEMO_SCRIPTS);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newScriptName, setNewScriptName] = useState("");
  const [newScriptDescription, setNewScriptDescription] = useState("");

  const handleCreateScript = () => {
    if (!newScriptName.trim()) return;

    const newScript: Script = {
      id: crypto.randomUUID(),
      name: newScriptName.trim(),
      description: newScriptDescription.trim(),
      isRunning: false,
      lastModified: new Date(),
      nodeCount: 0,
    };

    setScripts((prev) => [...prev, newScript]);
    setNewScriptName("");
    setNewScriptDescription("");
    setIsCreateDialogOpen(false);
  };

  const handleDeleteScript = (scriptId: string) => {
    setScripts((prev) => prev.filter((s) => s.id !== scriptId));
  };

  const handleToggleRunning = (scriptId: string) => {
    setScripts((prev) =>
      prev.map((s) =>
        s.id === scriptId ? { ...s, isRunning: !s.isRunning } : s,
      ),
    );
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
              {tInstance("scripts.wipTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tInstance("scripts.wipDescription")}
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
                  disabled={!newScriptName.trim()}
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
                onToggleRunning={() => handleToggleRunning(script.id)}
              />
            ))}
          </div>
        )}
      </div>
    </InstancePageLayout>
  );
}

interface ScriptCardProps {
  script: Script;
  instanceId: string;
  onDelete: () => void;
  onToggleRunning: () => void;
}

function ScriptCard({
  script,
  instanceId,
  onDelete,
  onToggleRunning,
}: ScriptCardProps) {
  const { t: tInstance } = useTranslation("instance");

  const formatLastModified = (date: Date) => {
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
          {script.isRunning && (
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
          <span>
            {script.nodeCount} {tInstance("scripts.nodes")}
          </span>
          <span>{formatLastModified(script.lastModified)}</span>
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
            onClick={onToggleRunning}
            title={
              script.isRunning
                ? tInstance("scripts.stop")
                : tInstance("scripts.start")
            }
          >
            {script.isRunning ? (
              <SquareIcon className="size-4" />
            ) : (
              <PlayIcon className="size-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onDelete}
            title={tInstance("scripts.delete")}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
