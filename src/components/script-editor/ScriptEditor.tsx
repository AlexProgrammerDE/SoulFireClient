import {
  Background,
  BackgroundVariant,
  type ColorMode,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { handleNativeCopy, handleNativePaste } from "@/lib/script-clipboard";
import { useScriptEditorStore } from "@/stores/script-editor-store.ts";
import { createConnectionValidator, edgeTypes } from "./edges";
import { GroupBreadcrumb } from "./GroupBreadcrumb";
import { NodeContextMenu } from "./NodeContextMenu";
import { NodeEditingProvider } from "./NodeEditingContext";
import { useNodeTypes } from "./NodeTypesContext";
import { QuickAddMenu } from "./QuickAddMenu";

// State for node context menu (React Flow idiomatic pattern)
interface NodeContextMenuState {
  nodeId: string;
  top?: number | false;
  left?: number | false;
  right?: number | false;
  bottom?: number | false;
}

export function ScriptEditor() {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [nodeContextMenu, setNodeContextMenu] =
    useState<NodeContextMenuState | null>(null);
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const { nodeTypes } = useNodeTypes();

  const nodes = useScriptEditorStore((state) => state.nodes);
  const edges = useScriptEditorStore((state) => state.edges);
  const onNodesChange = useScriptEditorStore((state) => state.onNodesChange);
  const onEdgesChange = useScriptEditorStore((state) => state.onEdgesChange);
  const onConnect = useScriptEditorStore((state) => state.onConnect);
  const storeOnReconnect = useScriptEditorStore((state) => state.onReconnect);
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

  // Node context menu actions
  const disconnectNode = useScriptEditorStore((state) => state.disconnectNode);
  const previewEnabledNodes = useScriptEditorStore(
    (state) => state.previewEnabledNodes,
  );

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

  // Double-click on a group node to enter it
  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === "layout.group") {
        enterGroup(node.id);
      }
    },
    [enterGroup],
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

      // A - Select all nodes (Blender-style, no modifier)
      if (
        event.key === "a" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        selectAll();
        return;
      }

      // Alt+A - Deselect all nodes
      if (
        (event.key === "a" || event.key === "A") &&
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        onNodesChange(
          nodes
            .filter((n) => n.selected)
            .map((n) => ({
              type: "select" as const,
              id: n.id,
              selected: false,
            })),
        );
        return;
      }

      // Delete/Backspace/X - Delete selected
      if (
        event.key === "Delete" ||
        event.key === "Backspace" ||
        event.key === "x"
      ) {
        if (
          event.key === "x" &&
          (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
        ) {
          return;
        }
        deleteSelected();
        return;
      }

      // F2 - Rename selected node
      if (event.key === "F2") {
        event.preventDefault();
        if (selectedNodeId) {
          setRenamingNodeId(selectedNodeId);
        }
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

      // Ctrl+Alt+G - Ungroup selected group node (Blender convention)
      if (
        (event.key === "g" || event.key === "G") &&
        (event.ctrlKey || event.metaKey) &&
        event.altKey
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

      // Shift+D - Duplicate selected (Blender-style)
      if (
        event.key === "D" &&
        event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        duplicateSelected();
        return;
      }

      // Note: Ctrl+C and Ctrl+V are handled via native onCopy/onPaste events
      // to avoid Firefox's clipboard permission prompts

      // L - Select linked (both directions, Blender-style)
      if (
        event.key === "l" &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        selectLinked("both");
        return;
      }

      // Ctrl+L / Cmd+L - Select upstream only
      if (
        (event.key === "l" || event.key === "L") &&
        (event.ctrlKey || event.metaKey) &&
        !event.altKey
      ) {
        event.preventDefault();
        selectLinked("upstream");
        return;
      }

      // Alt+L / ⌥L - Select downstream only
      if (
        (event.key === "l" || event.key === "L") &&
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
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

      // Alignment shortcuts (Ctrl+Shift+Arrow / Cmd+Shift+Arrow)
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        selectedNodes.length >= 2
      ) {
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
      onNodesChange,
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

  // Handle right-click on canvas for quick add menu
  const handlePaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      if (!reactFlowInstance) return;

      const flowPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Regular RMB = quick add menu
      openQuickAddMenu(flowPosition, { x: event.clientX, y: event.clientY });
    },
    [reactFlowInstance, openQuickAddMenu],
  );

  // Handle right-click on edge for quick reroute (Shift+RMB)
  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (!reactFlowInstance) return;

      // Shift+RMB on an edge = quick reroute
      if (event.shiftKey) {
        event.preventDefault();
        const flowPosition = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        insertReroute(edge.id, flowPosition);
      }
      // Without shift, let the default context menu appear (or could add edge-specific menu later)
    },
    [reactFlowInstance, insertReroute],
  );

  // Handle right-click on node (React Flow idiomatic pattern)
  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();

      if (!containerRef.current) return;

      // Select the right-clicked node if it isn't already selected
      if (!node.selected) {
        onNodesChange([
          // Deselect all other nodes
          ...nodes
            .filter((n) => n.selected && n.id !== node.id)
            .map((n) => ({
              type: "select" as const,
              id: n.id,
              selected: false,
            })),
          // Select the right-clicked node
          { type: "select" as const, id: node.id, selected: true },
        ]);
      }

      // Calculate position, ensuring menu stays within bounds
      const pane = containerRef.current.getBoundingClientRect();
      setNodeContextMenu({
        nodeId: node.id,
        top: event.clientY < pane.height - 200 && event.clientY - pane.top,
        left: event.clientX < pane.width - 200 && event.clientX - pane.left,
        right:
          event.clientX >= pane.width - 200 &&
          pane.width - (event.clientX - pane.left),
        bottom:
          event.clientY >= pane.height - 200 &&
          pane.height - (event.clientY - pane.top),
      });
    },
    [nodes, onNodesChange],
  );

  // Close node context menu on pane click
  const handlePaneClick = useCallback(() => {
    setNodeContextMenu(null);
  }, []);

  // Handle pointer down for link cutting (Alt+drag)
  // Uses pointer events instead of mouse events to support touch/stylus
  // Note: React Flow doesn't provide onPanePointerDown, so we use the wrapper div
  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.altKey && event.button === 0 && reactFlowInstance) {
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

  // Handle pointer move for link cutting
  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
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

  // Handle pointer up for link cutting
  const handlePointerUp = useCallback(() => {
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

  // Edge reconnection: drag an edge to move it, drop on empty to delete
  const edgeReconnectSuccessful = useRef(true);

  const handleReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const handleReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeReconnectSuccessful.current = true;
      storeOnReconnect(oldEdge, newConnection);
    },
    [storeOnReconnect],
  );

  const handleReconnectEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        // Dropped on empty space: delete the edge
        onEdgesChange([{ id: edge.id, type: "remove" }]);
      }
      edgeReconnectSuccessful.current = true;
    },
    [onEdgesChange],
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: ReactFlow canvas wrapper requires keyboard and mouse handling for operations
    <div
      ref={containerRef}
      className="h-full w-full relative outline-none"
      onKeyDown={handleKeyDown}
      onCopy={handleCopy}
      onPaste={handlePaste}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <NodeEditingProvider
        edges={visibleEdges}
        updateNodeData={updateNodeData}
        renamingNodeId={renamingNodeId}
        clearRenamingNodeId={() => setRenamingNodeId(null)}
      >
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
          onNodeDoubleClick={handleNodeDoubleClick}
          onSelectionChange={handleSelectionChange}
          onNodeContextMenu={handleNodeContextMenu}
          onPaneContextMenu={handlePaneContextMenu}
          onEdgeContextMenu={handleEdgeContextMenu}
          onPaneClick={handlePaneClick}
          isValidConnection={connectionValidator}
          edgesReconnectable
          onReconnectStart={handleReconnectStart}
          onReconnect={handleReconnect}
          onReconnectEnd={handleReconnectEnd}
          colorMode={(resolvedTheme as ColorMode) ?? "dark"}
          fitView
          minZoom={0.1}
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

      {/* Node context menu (React Flow idiomatic pattern) */}
      {nodeContextMenu && (
        <>
          {/* Backdrop - closes menu on click, prevents native context menu on right-click */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: Backdrop dismissal doesn't need keyboard */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: Backdrop is not focusable */}
          <div
            className="fixed inset-0 z-[99]"
            onClick={() => setNodeContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setNodeContextMenu(null);
            }}
          />
          <NodeContextMenu
            nodeId={nodeContextMenu.nodeId}
            isMuted={
              (
                visibleNodes.find((n) => n.id === nodeContextMenu.nodeId)
                  ?.data as { muted?: boolean } | undefined
              )?.muted ?? false
            }
            isCollapsed={
              (
                visibleNodes.find((n) => n.id === nodeContextMenu.nodeId)
                  ?.data as { collapsed?: boolean } | undefined
              )?.collapsed ?? false
            }
            previewEnabled={previewEnabledNodes.has(nodeContextMenu.nodeId)}
            onRename={(nodeId) => {
              setRenamingNodeId(nodeId);
              setNodeContextMenu(null);
            }}
            onDelete={() => {
              deleteSelected();
              setNodeContextMenu(null);
            }}
            onDuplicate={() => {
              duplicateSelected();
              setNodeContextMenu(null);
            }}
            onDisconnectAll={(nodeId) => {
              disconnectNode(nodeId);
              setNodeContextMenu(null);
            }}
            onToggleMute={(nodeId) => {
              toggleMute(nodeId);
              setNodeContextMenu(null);
            }}
            onToggleCollapse={(nodeId) => {
              toggleCollapse(nodeId);
              setNodeContextMenu(null);
            }}
            onTogglePreview={(nodeId) => {
              togglePreview(nodeId);
              setNodeContextMenu(null);
            }}
            onClose={() => setNodeContextMenu(null)}
            style={{
              position: "absolute",
              top: nodeContextMenu.top || undefined,
              left: nodeContextMenu.left || undefined,
              right: nodeContextMenu.right || undefined,
              bottom: nodeContextMenu.bottom || undefined,
              zIndex: 100,
            }}
          />
        </>
      )}

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
