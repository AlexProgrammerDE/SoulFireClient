import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ExecutionLogs } from "@/components/script-editor/ExecutionLogs.tsx";
import { NodeInspector } from "@/components/script-editor/NodeInspector.tsx";
import { NodePalette } from "@/components/script-editor/NodePalette.tsx";
import { ScriptEditor } from "@/components/script-editor/ScriptEditor.tsx";
import { ScriptToolbar } from "@/components/script-editor/ScriptToolbar.tsx";
import {
  getNodeDefinition,
  type LogEntry,
  type ScriptNode,
} from "@/components/script-editor/types.ts";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable.tsx";
import { useScriptEditorStore } from "@/stores/script-editor-store.ts";

import "@xyflow/react/dist/style.css";

export const Route = createFileRoute(
  "/_dashboard/instance/$instance/scripts/$scriptId",
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
  // Required for route context validation
  useSuspenseQuery(instanceInfoQueryOptions);

  const reactFlowInstance = useReactFlow();

  // Script editor store
  const nodes = useScriptEditorStore((state) => state.nodes);
  const loadScript = useScriptEditorStore((state) => state.loadScript);
  const resetEditor = useScriptEditorStore((state) => state.resetEditor);
  const setDirty = useScriptEditorStore((state) => state.setDirty);
  const setRunning = useScriptEditorStore((state) => state.setRunning);
  const addNode = useScriptEditorStore((state) => state.addNode);
  const _setSelectedNode = useScriptEditorStore(
    (state) => state.setSelectedNode,
  );
  const selectedNodeId = useScriptEditorStore((state) => state.selectedNodeId);
  const updateNodeData = useScriptEditorStore((state) => state.updateNodeData);

  // Local state
  const [isSaving, setIsSaving] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

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

  // Load script on mount
  useEffect(() => {
    // In production, this would fetch from gRPC
    // For now, we'll check if it's a new script or load demo data
    if (scriptId === "new") {
      resetEditor();
    } else {
      // Load demo script data
      loadScript({
        id: scriptId,
        name: "Demo Script",
        description: "A demo script for testing the editor",
        nodes: [],
        edges: [],
      });
    }

    return () => {
      // Clean up on unmount
      resetEditor();
    };
  }, [scriptId, loadScript, resetEditor]);

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // In production, this would call gRPC to save
      await new Promise((resolve) => setTimeout(resolve, 500));
      setDirty(false);
      toast.success(tInstance("scripts.saveSuccess"));
    } catch (_error) {
      toast.error(tInstance("scripts.saveError"));
    } finally {
      setIsSaving(false);
    }
  }, [setDirty, tInstance]);

  // Handle start/stop
  const handleStart = useCallback(() => {
    setRunning(true);
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
  }, [setRunning, tInstance]);

  const handleStop = useCallback(() => {
    setRunning(false);
    setLogs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        level: "info",
        nodeId: null,
        message: "Script stopped",
      },
    ]);
    toast.success(tInstance("scripts.stopSuccess"));
  }, [setRunning, tInstance]);

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
    <div className="flex h-dvh w-full flex-col">
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
        <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
          <NodePalette />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center - Script Editor */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <ResizablePanelGroup orientation="vertical">
            {/* Canvas */}
            <ResizablePanel defaultSize={75} minSize={50}>
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

            <ResizableHandle withHandle />

            {/* Bottom - Execution Logs */}
            <ResizablePanel defaultSize={25} minSize={15} maxSize={50}>
              <ExecutionLogs logs={logs} onClearLogs={handleClearLogs} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right sidebar - Node Inspector */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <NodeInspector
            selectedNode={selectedNode}
            onNodeDataChange={handleNodeDataChange}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
