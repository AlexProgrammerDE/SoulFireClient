import {
  Background,
  BackgroundVariant,
  type ColorMode,
  Controls,
  MiniMap,
  ReactFlow,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useTheme } from "next-themes";
import { useCallback, useState } from "react";
import { useScriptEditorStore } from "@/stores/script-editor-store.ts";
import { edgeTypes, isValidConnection } from "./edges";
import { nodeTypes } from "./nodes";

export function ScriptEditor() {
  const { resolvedTheme } = useTheme();
  const [_reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  const nodes = useScriptEditorStore((state) => state.nodes);
  const edges = useScriptEditorStore((state) => state.edges);
  const onNodesChange = useScriptEditorStore((state) => state.onNodesChange);
  const onEdgesChange = useScriptEditorStore((state) => state.onEdgesChange);
  const onConnect = useScriptEditorStore((state) => state.onConnect);
  const setSelectedNode = useScriptEditorStore(
    (state) => state.setSelectedNode,
  );
  const deleteSelected = useScriptEditorStore((state) => state.deleteSelected);

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Array<{ id: string }> }) => {
      if (selectedNodes.length === 1) {
        setSelectedNode(selectedNodes[0].id);
      } else {
        setSelectedNode(null);
      }
    },
    [setSelectedNode],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        deleteSelected();
      }
    },
    [deleteSelected],
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: ReactFlow canvas wrapper requires keyboard handling for delete operations
    <div className="h-full w-full" onKeyDown={handleKeyDown}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={handleInit}
        onSelectionChange={handleSelectionChange}
        isValidConnection={isValidConnection}
        colorMode={(resolvedTheme as ColorMode) ?? "dark"}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="var(--muted-foreground)"
        />
        <Controls />
        <MiniMap zoomable pannable />
      </ReactFlow>
    </div>
  );
}
