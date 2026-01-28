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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { handleNativeCopy, handleNativePaste } from "@/lib/script-clipboard";
import { useScriptEditorStore } from "@/stores/script-editor-store.ts";
import { createConnectionValidator, edgeTypes } from "./edges";
import { GroupBreadcrumb } from "./GroupBreadcrumb";
import { NodeEditingProvider } from "./NodeEditingContext";
import { useNodeTypes } from "./NodeTypesContext";
import { QuickAddMenu } from "./QuickAddMenu";

// Calculate distance from point to line segment (pure function, no dependencies)
function pointToLineDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number },
): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx: number;
  let yy: number;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

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
  const updateNodeData = useScriptEditorStore((state) => state.updateNodeData);
  const setSelectedNode = useScriptEditorStore(
    (state) => state.setSelectedNode,
  );
  const deleteSelected = useScriptEditorStore((state) => state.deleteSelected);

  // Blender-style actions
  const toggleMute = useScriptEditorStore((state) => state.toggleMute);
  const toggleCollapse = useScriptEditorStore((state) => state.toggleCollapse);
  const toggleSocketVisibility = useScriptEditorStore(
    (state) => state.toggleSocketVisibility,
  );
  const togglePreview = useScriptEditorStore((state) => state.togglePreview);
  const createFrame = useScriptEditorStore((state) => state.createFrame);
  const duplicateSelected = useScriptEditorStore(
    (state) => state.duplicateSelected,
  );
  const openQuickAddMenu = useScriptEditorStore(
    (state) => state.openQuickAddMenu,
  );
  const selectedNodeId = useScriptEditorStore((state) => state.selectedNodeId);

  // Group actions
  const groupEditStack = useScriptEditorStore((state) => state.groupEditStack);
  const enterGroup = useScriptEditorStore((state) => state.enterGroup);
  const exitGroup = useScriptEditorStore((state) => state.exitGroup);
  const createGroupFromSelection = useScriptEditorStore(
    (state) => state.createGroupFromSelection,
  );
  const ungroupSelected = useScriptEditorStore(
    (state) => state.ungroupSelected,
  );
  const getVisibleNodes = useScriptEditorStore(
    (state) => state.getVisibleNodes,
  );
  const getVisibleEdges = useScriptEditorStore(
    (state) => state.getVisibleEdges,
  );

  // Reroute action
  const insertReroute = useScriptEditorStore((state) => state.insertReroute);

  // Selection actions
  const selectAll = useScriptEditorStore((state) => state.selectAll);
  const selectLinked = useScriptEditorStore((state) => state.selectLinked);
  const selectSimilar = useScriptEditorStore((state) => state.selectSimilar);
  const selectShortestPath = useScriptEditorStore(
    (state) => state.selectShortestPath,
  );

  // Clipboard actions
  const getSelectedForClipboard = useScriptEditorStore(
    (state) => state.getSelectedForClipboard,
  );
  const pasteClipboardData = useScriptEditorStore(
    (state) => state.pasteClipboardData,
  );

  // Alignment actions
  const alignNodes = useScriptEditorStore((state) => state.alignNodes);
  const distributeNodes = useScriptEditorStore(
    (state) => state.distributeNodes,
  );

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

  // Auto-focus the container so keyboard shortcuts work immediately
  useEffect(() => {
    containerRef.current?.focus();
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

  // Handle Shift+click for shortest path selection (Blender-style)
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: { id: string }) => {
      if (event.shiftKey) {
        // Find the currently selected node (if any)
        const currentlySelected = nodes.find((n) => n.selected);
        if (currentlySelected && currentlySelected.id !== node.id) {
          event.preventDefault();
          selectShortestPath(currentlySelected.id, node.id);
        }
      }
    },
    [nodes, selectShortestPath],
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

      // Ctrl+A - Select all nodes
      if (
        (event.key === "a" || event.key === "A") &&
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey
      ) {
        event.preventDefault();
        selectAll();
        return;
      }

      // Delete/Backspace - Delete selected
      if (event.key === "Delete" || event.key === "Backspace") {
        deleteSelected();
        return;
      }

      // Tab - Enter/Exit group
      if (event.key === "Tab") {
        event.preventDefault();
        if (groupEditStack.length > 0) {
          // If inside a group, exit
          exitGroup();
        } else if (selectedNodeId) {
          // If a group node is selected, enter it
          const selectedNode = nodes.find((n) => n.id === selectedNodeId);
          if (selectedNode?.type === "layout.group") {
            enterGroup(selectedNodeId);
          }
        }
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
      if (
        event.key === "m" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey
      ) {
        if (selectedNodeId) {
          toggleMute(selectedNodeId);
        }
        return;
      }

      // H - Toggle collapse on selected node (without modifiers)
      if (
        event.key === "h" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey
      ) {
        if (selectedNodeId) {
          toggleCollapse(selectedNodeId);
        }
        return;
      }

      // Ctrl+H - Toggle socket visibility (hide unconnected)
      if (
        event.key === "h" &&
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey
      ) {
        event.preventDefault();
        if (selectedNodeId) {
          toggleSocketVisibility(selectedNodeId);
        }
        return;
      }

      // Shift+H - Toggle preview on selected node
      if (
        (event.key === "H" || event.key === "h") &&
        event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        if (selectedNodeId) {
          togglePreview(selectedNodeId);
        }
        return;
      }

      // Ctrl+G - Create group from selected nodes
      if (
        event.key === "g" &&
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey
      ) {
        event.preventDefault();
        if (selectedNodes.length > 0) {
          createGroupFromSelection();
        }
        return;
      }

      // Ctrl+Shift+G - Ungroup selected group node
      if (
        event.key === "G" &&
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey
      ) {
        event.preventDefault();
        ungroupSelected();
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

      // Note: Ctrl+C and Ctrl+V are handled via native onCopy/onPaste events
      // to avoid Firefox's clipboard permission prompts

      // Shift+L - Select linked (both directions)
      if (
        event.key === "L" &&
        event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        selectLinked("both");
        return;
      }

      // Ctrl+Shift+L - Select upstream only
      if (
        event.key === "L" &&
        event.shiftKey &&
        (event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault();
        selectLinked("upstream");
        return;
      }

      // Alt+Shift+L - Select downstream only
      if (event.key === "L" && event.shiftKey && event.altKey) {
        event.preventDefault();
        selectLinked("downstream");
        return;
      }

      // Shift+S - Select similar (same node type)
      if (
        event.key === "S" &&
        event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        selectSimilar();
        return;
      }

      // Alignment shortcuts (Ctrl+Shift+Arrow)
      if (event.ctrlKey && event.shiftKey && selectedNodes.length >= 2) {
        switch (event.key) {
          case "ArrowLeft":
            event.preventDefault();
            alignNodes("left");
            return;
          case "ArrowRight":
            event.preventDefault();
            alignNodes("right");
            return;
          case "ArrowUp":
            event.preventDefault();
            alignNodes("top");
            return;
          case "ArrowDown":
            event.preventDefault();
            alignNodes("bottom");
            return;
        }
      }

      // Distribute shortcuts
      if (event.altKey && event.shiftKey && selectedNodes.length >= 3) {
        if (event.key === "H" || event.key === "h") {
          event.preventDefault();
          distributeNodes("horizontal");
          return;
        }
        if (event.key === "V" || event.key === "v") {
          event.preventDefault();
          distributeNodes("vertical");
          return;
        }
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
      toggleSocketVisibility,
      togglePreview,
      createFrame,
      createGroupFromSelection,
      ungroupSelected,
      duplicateSelected,
      groupEditStack,
      enterGroup,
      exitGroup,
      selectAll,
      selectLinked,
      selectSimilar,
      alignNodes,
      distributeNodes,
    ],
  );

  // Native copy handler - uses ClipboardEvent for cross-browser support without permission prompts
  const handleCopy = useCallback(
    (event: React.ClipboardEvent) => {
      // Ignore if typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const clipboardData = getSelectedForClipboard();
      if (clipboardData) {
        handleNativeCopy(event.nativeEvent, clipboardData);
      }
    },
    [getSelectedForClipboard],
  );

  // Native paste handler - uses ClipboardEvent for cross-browser support without permission prompts
  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      // Ignore if typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const clipboardData = handleNativePaste(event.nativeEvent);
      if (clipboardData && reactFlowInstance && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const flowPosition = reactFlowInstance.screenToFlowPosition({
          x: centerX,
          y: centerY,
        });
        pasteClipboardData(clipboardData, flowPosition);
      }
    },
    [reactFlowInstance, pasteClipboardData],
  );

  // Handle right-click on canvas for quick add or quick reroute
  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      if (!reactFlowInstance) return;

      const flowPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Shift+RMB on an edge = quick reroute
      if (event.shiftKey) {
        // Find the nearest edge to the click position
        // This is a simplified approach - ideally we'd use edge hit detection
        const visibleEdges = getVisibleEdges();
        const visibleNodes = getVisibleNodes();
        const nodePositions = new Map(
          visibleNodes.map((n) => [n.id, n.position]),
        );

        // Find edge closest to click position
        let nearestEdge: { id: string; distance: number } | null = null;
        for (const edge of visibleEdges) {
          const sourcePos = nodePositions.get(edge.source);
          const targetPos = nodePositions.get(edge.target);
          if (!sourcePos || !targetPos) continue;

          // Simple distance check to edge line segment
          const edgeStart = { x: sourcePos.x + 80, y: sourcePos.y + 40 };
          const edgeEnd = { x: targetPos.x, y: targetPos.y + 40 };
          const distance = pointToLineDistance(
            flowPosition,
            edgeStart,
            edgeEnd,
          );

          if (
            distance < 30 &&
            (!nearestEdge || distance < nearestEdge.distance)
          ) {
            nearestEdge = { id: edge.id, distance };
          }
        }

        if (nearestEdge) {
          insertReroute(nearestEdge.id, flowPosition);
          return;
        }
      }

      // Regular RMB = quick add menu
      openQuickAddMenu(flowPosition, { x: event.clientX, y: event.clientY });
    },
    [
      reactFlowInstance,
      openQuickAddMenu,
      getVisibleEdges,
      getVisibleNodes,
      insertReroute,
    ],
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

  // Get visible nodes and edges based on current group context
  const visibleNodes = groupEditStack.length > 0 ? getVisibleNodes() : nodes;
  const visibleEdges = groupEditStack.length > 0 ? getVisibleEdges() : edges;

  // Create connection validator with current nodes
  const connectionValidator = useMemo(
    () => createConnectionValidator(visibleNodes),
    [visibleNodes],
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: ReactFlow canvas wrapper requires keyboard handling for operations
    <div
      ref={containerRef}
      className="h-full w-full relative outline-none"
      onKeyDown={handleKeyDown}
      onCopy={handleCopy}
      onPaste={handlePaste}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <NodeEditingProvider edges={visibleEdges} updateNodeData={updateNodeData}>
        <ReactFlow
          nodes={visibleNodes}
          edges={visibleEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={handleInit}
          onNodeClick={handleNodeClick}
          onSelectionChange={handleSelectionChange}
          isValidConnection={connectionValidator}
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
      </NodeEditingProvider>

      {/* Group breadcrumb navigation */}
      <GroupBreadcrumb />

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
