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
import { useCallback, useRef, useState } from "react";
import { useScriptEditorStore } from "@/stores/script-editor-store.ts";
import { edgeTypes, isValidConnection } from "./edges";
import { useNodeTypes } from "./NodeTypesContext";
import { QuickAddMenu } from "./QuickAddMenu";

export function ScriptEditor() {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const { nodeTypes } = useNodeTypes();

  const nodes = useScriptEditorStore((state) => state.nodes);
  const edges = useScriptEditorStore((state) => state.edges);
  const onNodesChange = useScriptEditorStore((state) => state.onNodesChange);
  const onEdgesChange = useScriptEditorStore((state) => state.onEdgesChange);
  const onConnect = useScriptEditorStore((state) => state.onConnect);
  const setSelectedNode = useScriptEditorStore(
    (state) => state.setSelectedNode,
  );
  const deleteSelected = useScriptEditorStore((state) => state.deleteSelected);

  // Blender-style actions
  const toggleMute = useScriptEditorStore((state) => state.toggleMute);
  const toggleCollapse = useScriptEditorStore((state) => state.toggleCollapse);
  const createFrame = useScriptEditorStore((state) => state.createFrame);
  const duplicateSelected = useScriptEditorStore(
    (state) => state.duplicateSelected,
  );
  const openQuickAddMenu = useScriptEditorStore(
    (state) => state.openQuickAddMenu,
  );
  const selectedNodeId = useScriptEditorStore((state) => state.selectedNodeId);

  // Link cutting
  const linkCutting = useScriptEditorStore((state) => state.linkCutting);
  const startLinkCutting = useScriptEditorStore(
    (state) => state.startLinkCutting,
  );
  const updateLinkCutting = useScriptEditorStore(
    (state) => state.updateLinkCutting,
  );
  const endLinkCutting = useScriptEditorStore((state) => state.endLinkCutting);

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
      // Ignore if typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const selectedNodes = nodes.filter((n) => n.selected);

      // Delete/Backspace - Delete selected
      if (event.key === "Delete" || event.key === "Backspace") {
        deleteSelected();
        return;
      }

      // Shift+A - Quick add menu
      if (
        event.key === "A" &&
        event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        if (reactFlowInstance && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          // Get mouse position relative to viewport, or center of canvas
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const flowPosition = reactFlowInstance.screenToFlowPosition({
            x: centerX,
            y: centerY,
          });
          openQuickAddMenu(flowPosition, {
            x: rect.left + centerX,
            y: rect.top + centerY,
          });
        }
        return;
      }

      // M - Toggle mute on selected node
      if (event.key === "m" || event.key === "M") {
        if (selectedNodeId) {
          toggleMute(selectedNodeId);
        }
        return;
      }

      // H - Toggle collapse on selected node
      if (event.key === "h" || event.key === "H") {
        if (selectedNodeId) {
          toggleCollapse(selectedNodeId);
        }
        return;
      }

      // Ctrl+J - Create frame around selected nodes
      if (
        (event.key === "j" || event.key === "J") &&
        (event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault();
        if (selectedNodes.length > 0) {
          createFrame(selectedNodes.map((n) => n.id));
        }
        return;
      }

      // Ctrl+D - Duplicate selected
      if (
        (event.key === "d" || event.key === "D") &&
        (event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault();
        duplicateSelected();
        return;
      }
    },
    [
      nodes,
      deleteSelected,
      reactFlowInstance,
      openQuickAddMenu,
      selectedNodeId,
      toggleMute,
      toggleCollapse,
      createFrame,
      duplicateSelected,
    ],
  );

  // Handle right-click on canvas for quick add
  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      if (reactFlowInstance) {
        const flowPosition = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        openQuickAddMenu(flowPosition, { x: event.clientX, y: event.clientY });
      }
    },
    [reactFlowInstance, openQuickAddMenu],
  );

  // Handle mouse down for link cutting (Ctrl+drag)
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (event.ctrlKey && event.button === 0 && reactFlowInstance) {
        event.preventDefault();
        const flowPosition = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        startLinkCutting(flowPosition);
      }
    },
    [reactFlowInstance, startLinkCutting],
  );

  // Handle mouse move for link cutting
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (linkCutting.active && reactFlowInstance) {
        const flowPosition = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        updateLinkCutting(flowPosition);
      }
    },
    [linkCutting.active, reactFlowInstance, updateLinkCutting],
  );

  // Handle mouse up for link cutting
  const handleMouseUp = useCallback(() => {
    if (linkCutting.active) {
      endLinkCutting();
    }
  }, [linkCutting.active, endLinkCutting]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: ReactFlow canvas wrapper requires keyboard handling for operations
    <div
      ref={containerRef}
      className="h-full w-full relative"
      onKeyDown={handleKeyDown}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
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
      <QuickAddMenu />

      {/* Link cutting visual indicator */}
      {linkCutting.active &&
        linkCutting.startPoint &&
        linkCutting.endPoint &&
        reactFlowInstance && (
          <svg
            className="absolute inset-0 pointer-events-none z-50"
            style={{ overflow: "visible" }}
            aria-hidden="true"
          >
            <title>Link cutting line</title>
            <line
              x1={
                reactFlowInstance.flowToScreenPosition(linkCutting.startPoint)
                  .x - (containerRef.current?.getBoundingClientRect().left ?? 0)
              }
              y1={
                reactFlowInstance.flowToScreenPosition(linkCutting.startPoint)
                  .y - (containerRef.current?.getBoundingClientRect().top ?? 0)
              }
              x2={
                reactFlowInstance.flowToScreenPosition(linkCutting.endPoint).x -
                (containerRef.current?.getBoundingClientRect().left ?? 0)
              }
              y2={
                reactFlowInstance.flowToScreenPosition(linkCutting.endPoint).y -
                (containerRef.current?.getBoundingClientRect().top ?? 0)
              }
              stroke="red"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
          </svg>
        )}
    </div>
  );
}
