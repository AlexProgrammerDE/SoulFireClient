import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { Suspense, use, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Separator } from "react-resizable-panels";
import { toast } from "sonner";
import { LoadingComponent } from "@/components/loading-component.tsx";
import { TransportContext } from "@/components/providers/transport-context.tsx";
import { ExecutionLogs } from "@/components/script-editor/ExecutionLogs.tsx";
import { NodePalette } from "@/components/script-editor/NodePalette.tsx";
import {
  NodeTypesProvider,
  useNodeTypes,
} from "@/components/script-editor/NodeTypesContext.tsx";
import { ScriptEditor } from "@/components/script-editor/ScriptEditor.tsx";
import { ScriptToolbar } from "@/components/script-editor/ScriptToolbar.tsx";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable.tsx";
import { ScriptServiceClient } from "@/generated/soulfire/script.client";
import {
  edgesToProto,
  nodesToProto,
  scriptDataToStore,
  scriptQueryOptions,
} from "@/lib/script-service.ts";
import { useScriptEditorStore } from "@/stores/script-editor-store.ts";

import "@xyflow/react/dist/style.css";

// Default node dimensions for centering on drop (matches min-w-[160px] in BaseNode)
const DEFAULT_NODE_WIDTH = 160;
const DEFAULT_NODE_HEIGHT = 80;

// Custom horizontal handle for vertical panel groups
function HorizontalResizableHandle() {
  return (
    <Separator className="relative flex h-px w-full items-center justify-center bg-border after:absolute after:left-0 after:h-1 after:w-full after:-translate-y-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1">
      <div className="bg-border h-6 w-1 rounded-lg z-10 flex shrink-0 rotate-90" />
    </Separator>
  );
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: "debug" | "info" | "warn" | "error";
  nodeId: string | null;
  message: string;
}

export const Route = createFileRoute(
  "/_dashboard/instance/$instance/script/$scriptId",
)({
  component: ScriptEditorPage,
});

function ScriptEditorPage() {
  return (
    <ReactFlowProvider>
      <NodeTypesProvider>
        <Suspense fallback={<LoadingComponent />}>
          <ScriptEditorContent />
        </Suspense>
      </NodeTypesProvider>
    </ReactFlowProvider>
  );
}

function ScriptEditorContent() {
  const { t: tInstance } = useTranslation("instance");
  const { instance: instanceId, scriptId } = Route.useParams();
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const transport = use(TransportContext);
  const { getDefinition } = useNodeTypes();

  // Required for route context validation
  useSuspenseQuery(instanceInfoQueryOptions);

  // Fetch script data from server (skip for new scripts)
  const { data: serverScriptData } = useSuspenseQuery({
    ...scriptQueryOptions(transport, instanceId, scriptId),
    // For new scripts, return null without making a request
    queryFn:
      scriptId === "new"
        ? () => Promise.resolve(null)
        : scriptQueryOptions(transport, instanceId, scriptId).queryFn,
  });

  const reactFlowInstance = useReactFlow();

  // Script editor store
  const nodes = useScriptEditorStore((state) => state.nodes);
  const edges = useScriptEditorStore((state) => state.edges);
  const loadScript = useScriptEditorStore((state) => state.loadScript);
  const resetEditor = useScriptEditorStore((state) => state.resetEditor);
  const setDirty = useScriptEditorStore((state) => state.setDirty);
  const setActive = useScriptEditorStore((state) => state.setActive);
  const setActiveNode = useScriptEditorStore((state) => state.setActiveNode);
  const addNode = useScriptEditorStore((state) => state.addNode);
  const getScriptData = useScriptEditorStore((state) => state.getScriptData);

  // Local state
  const [isSaving, setIsSaving] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const executionAbortRef = useRef<AbortController | null>(null);

  // Load script into store when data changes
  useEffect(() => {
    if (scriptId === "new") {
      resetEditor();
    } else if (serverScriptData) {
      loadScript(scriptDataToStore(serverScriptData));
    }
  }, [scriptId, serverScriptData, loadScript, resetEditor]);

  // Create script mutation
  const createMutation = useMutation({
    mutationKey: ["script", "create", instanceId],
    mutationFn: async () => {
      if (!transport) throw new Error("No transport available");
      const scriptData = getScriptData();
      const client = new ScriptServiceClient(transport);
      const result = await client.createScript({
        instanceId,
        name: scriptData.name || tInstance("scripts.untitledScript"),
        description: scriptData.description,
        nodes: nodesToProto(nodes),
        edges: edgesToProto(edges),
        autoStart: scriptData.autoStart,
      });
      return result.response;
    },
    onSuccess: (response) => {
      setDirty(false);
      toast.success(tInstance("scripts.saveSuccess"));
      // Navigate to the real script ID
      if (response.script) {
        void navigate({
          to: "/instance/$instance/script/$scriptId",
          params: { instance: instanceId, scriptId: response.script.id },
          replace: true,
        });
      }
    },
    onError: (error) => {
      console.error("Failed to create script:", error);
      toast.error(tInstance("scripts.saveError"));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["scripts", instanceId] });
    },
  });

  // Update script mutation
  const updateMutation = useMutation({
    mutationKey: ["script", "update", instanceId, scriptId],
    mutationFn: async () => {
      if (!transport) throw new Error("No transport available");
      const scriptData = getScriptData();
      const client = new ScriptServiceClient(transport);
      const result = await client.updateScript({
        instanceId,
        scriptId,
        name: scriptData.name,
        description: scriptData.description,
        nodes: nodesToProto(nodes),
        edges: edgesToProto(edges),
        updateNodes: true,
        updateEdges: true,
        autoStart: scriptData.autoStart,
      });
      return result.response;
    },
    onSuccess: () => {
      setDirty(false);
      toast.success(tInstance("scripts.saveSuccess"));
    },
    onError: (error) => {
      console.error("Failed to update script:", error);
      toast.error(tInstance("scripts.saveError"));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ["script", instanceId, scriptId],
      });
    },
  });

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      if (scriptId === "new") {
        await createMutation.mutateAsync();
      } else {
        await updateMutation.mutateAsync();
      }
    } finally {
      setIsSaving(false);
    }
  }, [scriptId, createMutation, updateMutation]);

  // Handle script activation
  const handleStart = useCallback(async () => {
    if (!transport || scriptId === "new") {
      toast.error(tInstance("scripts.saveFirstBeforeActivating"));
      return;
    }

    // Abort any existing execution
    if (executionAbortRef.current) {
      executionAbortRef.current.abort();
    }

    const abortController = new AbortController();
    executionAbortRef.current = abortController;

    setActive(true);
    setActiveNode(null);
    setLogs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        level: "info",
        nodeId: null,
        message: tInstance("scripts.activating"),
      },
    ]);

    try {
      const client = new ScriptServiceClient(transport);
      const { responses } = client.activateScript(
        { instanceId, scriptId },
        { abort: abortController.signal },
      );

      responses.onMessage((event) => {
        if (event.event.oneofKind === "scriptStarted") {
          setLogs((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              timestamp: new Date(),
              level: "info",
              nodeId: null,
              message: tInstance("scripts.activated"),
            },
          ]);
          toast.success(tInstance("scripts.activateSuccess"));
        } else if (event.event.oneofKind === "nodeStarted") {
          const nodeId = event.event.nodeStarted.nodeId;
          setActiveNode(nodeId);
          setLogs((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              timestamp: new Date(),
              level: "debug",
              nodeId,
              message: tInstance("scripts.nodeStarted", { nodeId }),
            },
          ]);
        } else if (event.event.oneofKind === "nodeCompleted") {
          const nodeId = event.event.nodeCompleted.nodeId;
          setLogs((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              timestamp: new Date(),
              level: "debug",
              nodeId,
              message: tInstance("scripts.nodeCompleted", { nodeId }),
            },
          ]);
        } else if (event.event.oneofKind === "nodeError") {
          const { nodeId, errorMessage } = event.event.nodeError;
          setLogs((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              timestamp: new Date(),
              level: "error",
              nodeId,
              message: tInstance("scripts.nodeError", { error: errorMessage }),
            },
          ]);
        } else if (event.event.oneofKind === "scriptCompleted") {
          const success = event.event.scriptCompleted.success;
          setActive(false);
          setActiveNode(null);
          setLogs((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              timestamp: new Date(),
              level: success ? "info" : "warn",
              nodeId: null,
              message: success
                ? tInstance("scripts.executionCompletedSuccess")
                : tInstance("scripts.deactivated"),
            },
          ]);
          if (success) {
            toast.success(tInstance("scripts.executionCompleted"));
          }
        }
      });

      responses.onError((error) => {
        if (abortController.signal.aborted) return;
        console.error("Script execution error:", error);
        setActive(false);
        setActiveNode(null);
        setLogs((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            level: "error",
            nodeId: null,
            message: tInstance("scripts.executionError", {
              error: error.message,
            }),
          },
        ]);
        toast.error(tInstance("scripts.executionFailed"));
      });

      responses.onComplete(() => {
        if (abortController.signal.aborted) return;
        setActive(false);
        setActiveNode(null);
      });
    } catch (error) {
      if (abortController.signal.aborted) return;
      console.error("Failed to activate script:", error);
      setActive(false);
      toast.error(tInstance("scripts.activateError"));
    }
  }, [transport, instanceId, scriptId, setActive, setActiveNode, tInstance]);

  // Handle script deactivation
  const handleStop = useCallback(async () => {
    // Abort the streaming connection
    if (executionAbortRef.current) {
      executionAbortRef.current.abort();
      executionAbortRef.current = null;
    }

    if (!transport || scriptId === "new") return;

    try {
      const client = new ScriptServiceClient(transport);
      await client.deactivateScript({ instanceId, scriptId });
      setActive(false);
      setActiveNode(null);
      setLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          level: "info",
          nodeId: null,
          message: tInstance("scripts.deactivatedByUser"),
        },
      ]);
      toast.success(tInstance("scripts.deactivateSuccess"));
    } catch (error) {
      console.error("Failed to deactivate script:", error);
      // Even if the RPC fails, mark as deactivated locally
      setActive(false);
      setActiveNode(null);
    }
  }, [transport, instanceId, scriptId, setActive, setActiveNode, tInstance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (executionAbortRef.current) {
        executionAbortRef.current.abort();
      }
    };
  }, []);

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    reactFlowInstance.zoomIn();
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.zoomOut();
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2 });
  }, [reactFlowInstance]);

  // Handle clear logs
  const handleClearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Handle drag & drop from palette
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData(
        "application/script-node-type",
      );
      if (!nodeType) return;

      const definition = getDefinition(nodeType);
      if (!definition) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Center the node under the cursor
      const centeredPosition = {
        x: position.x - DEFAULT_NODE_WIDTH / 2,
        y: position.y - DEFAULT_NODE_HEIGHT / 2,
      };

      addNode(nodeType, centeredPosition, definition.defaultData);
    },
    [reactFlowInstance, addNode, getDefinition],
  );

  return (
    <div className="flex h-full w-full flex-col">
      {/* Toolbar */}
      <ScriptToolbar
        instanceId={instanceId}
        onSave={handleSave}
        onStart={handleStart}
        onStop={handleStop}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        isSaving={isSaving}
      />

      {/* Main content area */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        {/* Left sidebar - Node Palette */}
        <ResizablePanel defaultSize={20} minSize="12.5rem" maxSize="25rem">
          <NodePalette />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center - Script Editor & Logs */}
        <ResizablePanel defaultSize={80} minSize="18.75rem">
          <ResizablePanelGroup orientation="vertical">
            {/* Canvas */}
            <ResizablePanel defaultSize={75} minSize="12.5rem">
              <div
                role="application"
                ref={reactFlowWrapper}
                className="h-full w-full"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <ScriptEditor />
              </div>
            </ResizablePanel>

            <HorizontalResizableHandle />

            {/* Bottom - Execution Logs */}
            <ResizablePanel defaultSize={25} minSize="6.25rem" maxSize="25rem">
              <ExecutionLogs logs={logs} onClearLogs={handleClearLogs} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
