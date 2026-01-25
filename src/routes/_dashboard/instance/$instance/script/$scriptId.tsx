import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { GripHorizontalIcon } from "lucide-react";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Separator } from "react-resizable-panels";
import { toast } from "sonner";
import { TransportContext } from "@/components/providers/transport-context.tsx";
import { ExecutionLogs } from "@/components/script-editor/ExecutionLogs.tsx";
import { NodeInspector } from "@/components/script-editor/NodeInspector.tsx";
import { NodePalette } from "@/components/script-editor/NodePalette.tsx";
import { getNodeDefinition } from "@/components/script-editor/nodes";
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
  ScriptScope,
  scriptDataToStore,
  scriptQueryOptions,
} from "@/lib/script-service.ts";
import { useScriptEditorStore } from "@/stores/script-editor-store.ts";

import "@xyflow/react/dist/style.css";

// Custom horizontal handle for vertical panel groups
function HorizontalResizableHandle() {
  return (
    <Separator className="relative flex h-px w-full items-center justify-center bg-border after:absolute after:left-0 after:h-1 after:w-full after:-translate-y-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1">
      <div className="z-10 flex h-3 w-4 items-center justify-center rounded-sm border bg-border">
        <GripHorizontalIcon className="size-2.5" />
      </div>
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

interface ScriptNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export const Route = createFileRoute(
  "/_dashboard/instance/$instance/script/$scriptId",
)({
  component: ScriptEditorPage,
});

function ScriptEditorPage() {
  return (
    <ReactFlowProvider>
      <ScriptEditorContent />
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
  const setRunning = useScriptEditorStore((state) => state.setRunning);
  const setActiveNode = useScriptEditorStore((state) => state.setActiveNode);
  const addNode = useScriptEditorStore((state) => state.addNode);
  const selectedNodeId = useScriptEditorStore((state) => state.selectedNodeId);
  const updateNodeData = useScriptEditorStore((state) => state.updateNodeData);
  const getScriptData = useScriptEditorStore((state) => state.getScriptData);

  // Local state
  const [isSaving, setIsSaving] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const executionAbortRef = useRef<AbortController | null>(null);

  // Get selected node for inspector
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return null;
    return {
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data as Record<string, unknown>,
    } as ScriptNode;
  }, [nodes, selectedNodeId]);

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
        name: scriptData.name || "Untitled Script",
        description: scriptData.description,
        scope: ScriptScope.INSTANCE,
        nodes: nodesToProto(nodes),
        edges: edgesToProto(edges),
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

  // Handle script execution start
  const handleStart = useCallback(async () => {
    if (!transport || scriptId === "new") {
      toast.error("Save the script first before running");
      return;
    }

    // Abort any existing execution
    if (executionAbortRef.current) {
      executionAbortRef.current.abort();
    }

    const abortController = new AbortController();
    executionAbortRef.current = abortController;

    setRunning(true);
    setActiveNode(null);
    setLogs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        level: "info",
        nodeId: null,
        message: "Starting script execution...",
      },
    ]);

    try {
      const client = new ScriptServiceClient(transport);
      const { responses } = client.startScript(
        { instanceId, scriptId, inputs: {} },
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
              message: "Script started",
            },
          ]);
          toast.success(tInstance("scripts.startSuccess"));
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
              message: `Node started: ${nodeId}`,
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
              message: `Node completed: ${nodeId}`,
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
              message: `Node error: ${errorMessage}`,
            },
          ]);
        } else if (event.event.oneofKind === "scriptCompleted") {
          const success = event.event.scriptCompleted.success;
          setRunning(false);
          setActiveNode(null);
          setLogs((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              timestamp: new Date(),
              level: success ? "info" : "warn",
              nodeId: null,
              message: success
                ? "Script completed successfully"
                : "Script stopped",
            },
          ]);
          if (success) {
            toast.success("Script completed");
          }
        }
      });

      responses.onError((error) => {
        if (abortController.signal.aborted) return;
        console.error("Script execution error:", error);
        setRunning(false);
        setActiveNode(null);
        setLogs((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            level: "error",
            nodeId: null,
            message: `Execution error: ${error.message}`,
          },
        ]);
        toast.error("Script execution failed");
      });

      responses.onComplete(() => {
        if (abortController.signal.aborted) return;
        setRunning(false);
        setActiveNode(null);
      });
    } catch (error) {
      if (abortController.signal.aborted) return;
      console.error("Failed to start script:", error);
      setRunning(false);
      toast.error("Failed to start script");
    }
  }, [transport, instanceId, scriptId, setRunning, setActiveNode, tInstance]);

  // Handle script execution stop
  const handleStop = useCallback(async () => {
    // Abort the streaming connection
    if (executionAbortRef.current) {
      executionAbortRef.current.abort();
      executionAbortRef.current = null;
    }

    if (!transport || scriptId === "new") return;

    try {
      const client = new ScriptServiceClient(transport);
      await client.stopScript({ instanceId, scriptId });
      setRunning(false);
      setActiveNode(null);
      setLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          level: "info",
          nodeId: null,
          message: "Script stopped by user",
        },
      ]);
      toast.success(tInstance("scripts.stopSuccess"));
    } catch (error) {
      console.error("Failed to stop script:", error);
      // Even if the RPC fails, mark as stopped locally
      setRunning(false);
      setActiveNode(null);
    }
  }, [transport, instanceId, scriptId, setRunning, setActiveNode, tInstance]);

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

  // Handle node data change from inspector
  const handleNodeDataChange = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      updateNodeData(nodeId, data);
    },
    [updateNodeData],
  );

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
      if (!nodeType || !reactFlowWrapper.current) return;

      const definition = getNodeDefinition(nodeType);
      if (!definition) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      addNode(nodeType, position, definition.defaultData);
    },
    [reactFlowInstance, addNode],
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

        {/* Center - Script Editor */}
        <ResizablePanel defaultSize={55} minSize="18.75rem">
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

        <ResizableHandle withHandle />

        {/* Right sidebar - Node Inspector */}
        <ResizablePanel defaultSize={25} minSize="15.625rem" maxSize="31.25rem">
          <NodeInspector
            selectedNode={selectedNode}
            onNodeDataChange={handleNodeDataChange}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
