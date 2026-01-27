import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  MarkerType,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type XYPosition,
} from "@xyflow/react";
import { create } from "zustand";
import {
  getEdgeStyle,
  isTypeCompatible,
  type PortType,
} from "@/components/script-editor/nodes/types";

export type { PortType };

export interface ScriptEditorState {
  // React Flow state
  nodes: Node[];
  edges: Edge[];

  // Script metadata
  scriptId: string | null;
  scriptName: string;
  scriptDescription: string;
  autoStart: boolean;
  isDirty: boolean;

  // Execution state
  isActive: boolean;
  activeNodeId: string | null;
  executionLogs: Array<{
    nodeId: string;
    level: "debug" | "info" | "warn" | "error";
    message: string;
    timestamp: Date;
  }>;

  // Selected node for inspector
  selectedNodeId: string | null;

  // Quick add menu state
  quickAddMenu: {
    position: XYPosition;
    screenPosition: XYPosition;
    sourceSocket?: {
      nodeId: string;
      handleId: string;
      handleType: "source" | "target";
    };
  } | null;

  // Group editing state
  groupEditStack: string[]; // Stack of group node IDs we're editing inside

  // Node preview state
  previewEnabledNodes: Set<string>; // Node IDs with preview enabled
  previewValues: Map<string, Record<string, unknown>>; // Node ID -> output values

  // Debug node state
  debugNodeValues: Map<string, Array<{ value: unknown; timestamp: Date }>>; // Node ID -> value history

  // Clipboard state
  clipboard: {
    nodes: Node[];
    edges: Edge[];
    sourceScriptId: string | null;
  } | null;

  // Actions
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (
    type: string,
    position: XYPosition,
    data?: Record<string, unknown>,
  ) => string;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  deleteSelected: () => void;
  setSelectedNode: (nodeId: string | null) => void;

  // Blender-style node actions
  toggleMute: (nodeId: string) => void;
  toggleCollapse: (nodeId: string) => void;
  toggleSocketVisibility: (nodeId: string) => void;
  togglePreview: (nodeId: string) => void;
  updatePreviewValue: (
    nodeId: string,
    outputs: Record<string, unknown>,
  ) => void;
  createFrame: (nodeIds: string[], label?: string) => void;
  removeFromFrame: (nodeId: string) => void;
  insertReroute: (edgeId: string, position: XYPosition) => void;
  duplicateSelected: () => void;

  // Group actions
  enterGroup: (groupNodeId: string) => void;
  exitGroup: () => void;
  exitToRoot: () => void;
  createGroupFromSelection: () => void;
  ungroupSelected: () => void;
  getCurrentGroupId: () => string | null;
  getVisibleNodes: () => Node[];
  getVisibleEdges: () => Edge[];

  // Auto-insert on edge
  insertNodeOnEdge: (nodeId: string, edgeId: string) => void;

  // Debug node actions
  updateDebugValue: (nodeId: string, value: unknown) => void;
  clearDebugValues: (nodeId: string) => void;
  getDebugHistory: (
    nodeId: string,
  ) => Array<{ value: unknown; timestamp: Date }>;

  // Selection actions
  selectLinked: (direction: "upstream" | "downstream" | "both") => void;
  selectSimilar: () => void;

  // Clipboard actions
  copySelected: () => void;
  pasteFromClipboard: (position: XYPosition) => void;
  canPaste: () => boolean;

  // Alignment actions
  alignNodes: (
    direction: "left" | "right" | "top" | "bottom" | "centerH" | "centerV",
  ) => void;
  distributeNodes: (direction: "horizontal" | "vertical") => void;

  // Quick add menu actions
  openQuickAddMenu: (
    position: XYPosition,
    screenPosition: XYPosition,
    sourceSocket?: {
      nodeId: string;
      handleId: string;
      handleType: "source" | "target";
    },
  ) => void;
  closeQuickAddMenu: () => void;

  // Link cutting state and actions
  linkCutting: {
    active: boolean;
    startPoint: XYPosition | null;
    endPoint: XYPosition | null;
  };
  startLinkCutting: (point: XYPosition) => void;
  updateLinkCutting: (point: XYPosition) => void;
  endLinkCutting: () => void;
  cutEdgesIntersectingLine: (start: XYPosition, end: XYPosition) => void;

  // Script metadata actions
  setScriptName: (name: string) => void;
  setScriptDescription: (description: string) => void;
  setAutoStart: (autoStart: boolean) => void;
  setDirty: (dirty: boolean) => void;

  // Execution actions
  setActive: (active: boolean) => void;
  setActiveNode: (nodeId: string | null) => void;
  addExecutionLog: (log: {
    nodeId: string;
    level: "debug" | "info" | "warn" | "error";
    message: string;
  }) => void;
  clearExecutionLogs: () => void;

  // Persistence
  loadScript: (data: {
    id: string;
    name: string;
    description: string;
    autoStart: boolean;
    nodes: Node[];
    edges: Edge[];
  }) => void;
  resetEditor: () => void;
  getScriptData: () => {
    nodes: Node[];
    edges: Edge[];
    name: string;
    description: string;
    autoStart: boolean;
  };
}

// Generate unique IDs
const generateId = () => crypto.randomUUID();

// Helper to get port type from handle ID
const getPortType = (handleId: string | null | undefined): string => {
  if (!handleId) return "any";
  const parts = handleId.split("-");
  return parts[0] || "any";
};

export const useScriptEditorStore = create<ScriptEditorState>((set, get) => ({
  // Initial state
  nodes: [],
  edges: [],
  scriptId: null,
  scriptName: "Untitled Script",
  scriptDescription: "",
  autoStart: false,
  isDirty: false,
  isActive: false,
  activeNodeId: null,
  executionLogs: [],
  selectedNodeId: null,
  quickAddMenu: null,
  groupEditStack: [],
  previewEnabledNodes: new Set<string>(),
  previewValues: new Map<string, Record<string, unknown>>(),
  debugNodeValues: new Map<
    string,
    Array<{ value: unknown; timestamp: Date }>
  >(),
  clipboard: null,
  linkCutting: {
    active: false,
    startPoint: null,
    endPoint: null,
  },

  // React Flow handlers
  onNodesChange: (changes) => {
    // Only mark as dirty for actual content changes, not internal React Flow events
    // like selection changes or dimension recalculations
    const hasMeaningfulChange = changes.some(
      (change) =>
        change.type === "position" ||
        change.type === "remove" ||
        change.type === "add" ||
        change.type === "replace",
    );
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      ...(hasMeaningfulChange && { isDirty: true }),
    });
  },

  onEdgesChange: (changes) => {
    // Only mark as dirty for actual content changes, not selection changes
    const hasMeaningfulChange = changes.some(
      (change) =>
        change.type === "remove" ||
        change.type === "add" ||
        change.type === "replace",
    );
    set({
      edges: applyEdgeChanges(changes, get().edges),
      ...(hasMeaningfulChange && { isDirty: true }),
    });
  },

  onConnect: (connection) => {
    // Get port type from handle and determine edge style (data-driven)
    const sourcePortType = getPortType(connection.sourceHandle) as PortType;
    const edgeStyle = getEdgeStyle(sourcePortType);

    // Execution edges use "animated" style, data edges use "default"
    const isExecutionStyle = edgeStyle === "animated";
    const edgeType = isExecutionStyle ? "execution" : "data";

    set({
      edges: addEdge(
        {
          ...connection,
          type: edgeType,
          data: { edgeType, edgeStyle },
          // Add arrow marker for animated (execution) edges
          ...(isExecutionStyle && {
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 16,
              height: 16,
            },
          }),
        },
        get().edges,
      ),
      isDirty: true,
    });
  },

  addNode: (type, position, data = {}) => {
    const currentGroupId = get().getCurrentGroupId();
    const newNode: Node = {
      id: generateId(),
      type,
      position,
      data: {
        ...data,
        ...(currentGroupId && { parentGroupId: currentGroupId }),
      },
    };
    set({
      nodes: [...get().nodes, newNode],
      isDirty: true,
    });
    return newNode.id;
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node,
      ),
      isDirty: true,
    });
  },

  deleteSelected: () => {
    const { nodes, edges, groupEditStack } = get();
    const currentGroupId = groupEditStack[groupEditStack.length - 1] ?? null;

    // Only delete nodes in the current view
    const nodesToDelete = nodes.filter((n) => {
      if (!n.selected) return false;
      const nodeGroupId = (n.data.parentGroupId as string) ?? null;
      return nodeGroupId === currentGroupId;
    });

    const nodeIdsToDelete = new Set(nodesToDelete.map((n) => n.id));

    set({
      nodes: nodes.filter((node) => !nodeIdsToDelete.has(node.id)),
      edges: edges.filter(
        (edge) =>
          !edge.selected &&
          !nodeIdsToDelete.has(edge.source) &&
          !nodeIdsToDelete.has(edge.target),
      ),
      isDirty: true,
    });
  },

  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),

  // Blender-style node actions
  toggleMute: (nodeId) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, muted: !node.data.muted } }
          : node,
      ),
      isDirty: true,
    });
  },

  toggleCollapse: (nodeId) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, collapsed: !node.data.collapsed } }
          : node,
      ),
      isDirty: true,
    });
  },

  toggleSocketVisibility: (nodeId) => {
    const { nodes, edges } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    // Get connected socket handles for this node
    const connectedHandles = new Set<string>();
    for (const edge of edges) {
      if (edge.source === nodeId && edge.sourceHandle) {
        connectedHandles.add(edge.sourceHandle);
      }
      if (edge.target === nodeId && edge.targetHandle) {
        connectedHandles.add(edge.targetHandle);
      }
    }

    // Current hidden sockets
    const currentHidden = (node.data.hiddenSockets as string[]) || [];

    // Toggle: if any hidden, show all; otherwise we'll hide unconnected
    // Note: We can't know all sockets here without the definition,
    // so we just toggle the hiddenSockets flag
    const newHidden = currentHidden.length > 0 ? [] : ["__hide_unconnected__"];

    set({
      nodes: nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, hiddenSockets: newHidden } }
          : n,
      ),
      isDirty: true,
    });
  },

  togglePreview: (nodeId) => {
    const current = get().previewEnabledNodes;
    const next = new Set(current);
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    set({ previewEnabledNodes: next });
  },

  updatePreviewValue: (nodeId, outputs) => {
    const current = get().previewValues;
    const next = new Map(current);
    next.set(nodeId, outputs);
    set({ previewValues: next });
  },

  createFrame: (nodeIds, label = "Frame") => {
    if (nodeIds.length === 0) return;

    const { nodes } = get();
    const selectedNodes = nodes.filter((n) => nodeIds.includes(n.id));
    if (selectedNodes.length === 0) return;

    // Calculate bounding box of selected nodes
    const padding = 40;
    const minX = Math.min(...selectedNodes.map((n) => n.position.x)) - padding;
    const minY = Math.min(...selectedNodes.map((n) => n.position.y)) - padding;
    const maxX =
      Math.max(
        ...selectedNodes.map((n) => n.position.x + (n.measured?.width ?? 160)),
      ) + padding;
    const maxY =
      Math.max(
        ...selectedNodes.map((n) => n.position.y + (n.measured?.height ?? 100)),
      ) + padding;

    const frameId = generateId();
    const currentGroupId = get().getCurrentGroupId();
    const frameNode: Node = {
      id: frameId,
      type: "layout.frame",
      position: { x: minX, y: minY },
      data: {
        label,
        containedNodes: nodeIds,
        ...(currentGroupId && { parentGroupId: currentGroupId }),
      },
      style: {
        width: maxX - minX,
        height: maxY - minY,
      },
      // Frames should be behind other nodes
      zIndex: -1,
    };

    // Update contained nodes to reference the frame
    const updatedNodes = nodes.map((node) =>
      nodeIds.includes(node.id)
        ? { ...node, data: { ...node.data, parentFrameId: frameId } }
        : node,
    );

    set({
      nodes: [frameNode, ...updatedNodes],
      isDirty: true,
    });
  },

  removeFromFrame: (nodeId) => {
    const { nodes } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node?.data.parentFrameId) return;

    const frameId = node.data.parentFrameId as string;

    set({
      nodes: nodes.map((n) => {
        if (n.id === nodeId) {
          const { parentFrameId, ...restData } = n.data;
          return { ...n, data: restData };
        }
        if (n.id === frameId && n.data.containedNodes) {
          return {
            ...n,
            data: {
              ...n.data,
              containedNodes: (n.data.containedNodes as string[]).filter(
                (id) => id !== nodeId,
              ),
            },
          };
        }
        return n;
      }),
      isDirty: true,
    });
  },

  insertReroute: (edgeId, position) => {
    const { edges, nodes } = get();
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;

    const rerouteId = generateId();
    const currentGroupId = get().getCurrentGroupId();
    const rerouteNode: Node = {
      id: rerouteId,
      type: "layout.reroute",
      position,
      data: {
        ...(currentGroupId && { parentGroupId: currentGroupId }),
      },
    };

    // Get the edge type from the source handle
    const sourceType = edge.sourceHandle?.split("-")[0] ?? "any";

    // Create new edges
    const newEdge1: Edge = {
      id: generateId(),
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      target: rerouteId,
      targetHandle: "any-in",
      type: edge.type,
      data: edge.data,
    };

    const newEdge2: Edge = {
      id: generateId(),
      source: rerouteId,
      sourceHandle: "any-out",
      target: edge.target,
      targetHandle: edge.targetHandle,
      type: edge.type,
      data: edge.data,
    };

    set({
      nodes: [
        ...nodes,
        {
          ...rerouteNode,
          data: { ...rerouteNode.data, resolvedType: sourceType },
        },
      ],
      edges: [...edges.filter((e) => e.id !== edgeId), newEdge1, newEdge2],
      isDirty: true,
    });
  },

  duplicateSelected: () => {
    const { nodes, edges, groupEditStack } = get();
    const currentGroupId = groupEditStack[groupEditStack.length - 1] ?? null;

    // Only duplicate nodes in the current view
    const selectedNodes = nodes.filter((n) => {
      if (!n.selected) return false;
      const nodeGroupId = (n.data.parentGroupId as string) ?? null;
      return nodeGroupId === currentGroupId;
    });

    if (selectedNodes.length === 0) return;

    // Create mapping from old IDs to new IDs
    const idMap = new Map<string, string>();
    for (const node of selectedNodes) {
      idMap.set(node.id, generateId());
    }

    // Duplicate nodes with offset
    const offset = { x: 50, y: 50 };
    const newNodes: Node[] = selectedNodes.map((node) => ({
      ...node,
      id: idMap.get(node.id) ?? generateId(),
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
      selected: true,
    }));

    // Duplicate edges between selected nodes
    const newEdges: Edge[] = edges
      .filter((edge) => idMap.has(edge.source) && idMap.has(edge.target))
      .map((edge) => ({
        ...edge,
        id: generateId(),
        source: idMap.get(edge.source) ?? edge.source,
        target: idMap.get(edge.target) ?? edge.target,
      }));

    // Deselect original nodes
    const updatedNodes = nodes.map((n) => ({ ...n, selected: false }));

    set({
      nodes: [...updatedNodes, ...newNodes],
      edges: [...edges, ...newEdges],
      isDirty: true,
    });
  },

  // Group actions
  enterGroup: (groupNodeId) => {
    const node = get().nodes.find((n) => n.id === groupNodeId);
    if (!node || node.type !== "layout.group") return;

    set({
      groupEditStack: [...get().groupEditStack, groupNodeId],
      selectedNodeId: null,
    });
  },

  exitGroup: () => {
    const stack = get().groupEditStack;
    if (stack.length === 0) return;

    set({
      groupEditStack: stack.slice(0, -1),
      selectedNodeId: null,
    });
  },

  exitToRoot: () => {
    set({
      groupEditStack: [],
      selectedNodeId: null,
    });
  },

  getCurrentGroupId: () => {
    const stack = get().groupEditStack;
    return stack.length > 0 ? stack[stack.length - 1] : null;
  },

  getVisibleNodes: () => {
    const { nodes, groupEditStack } = get();
    const currentGroupId = groupEditStack[groupEditStack.length - 1] ?? null;

    return nodes.filter((n) => {
      const nodeGroupId = (n.data.parentGroupId as string) ?? null;
      return nodeGroupId === currentGroupId;
    });
  },

  getVisibleEdges: () => {
    const { edges } = get();
    const visibleNodeIds = new Set(
      get()
        .getVisibleNodes()
        .map((n) => n.id),
    );

    return edges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target),
    );
  },

  createGroupFromSelection: () => {
    const { nodes, edges, groupEditStack } = get();
    const currentGroupId = groupEditStack[groupEditStack.length - 1] ?? null;

    // Get selected nodes in current view
    const selectedNodes = nodes.filter((n) => {
      if (!n.selected) return false;
      const nodeGroupId = (n.data.parentGroupId as string) ?? null;
      return nodeGroupId === currentGroupId;
    });

    if (selectedNodes.length === 0) return;

    const selectedIds = new Set(selectedNodes.map((n) => n.id));

    // Find edges that cross the selection boundary
    const incomingEdges = edges.filter(
      (e) => !selectedIds.has(e.source) && selectedIds.has(e.target),
    );
    const outgoingEdges = edges.filter(
      (e) => selectedIds.has(e.source) && !selectedIds.has(e.target),
    );
    // Internal edges (between selected nodes) are automatically preserved
    // since we only remove incoming/outgoing crossing edges

    // Create group input/output sockets based on crossing edges
    const groupInputs = incomingEdges.map((e, i) => ({
      id: `group-in-${i}`,
      type: getPortType(e.sourceHandle),
      label: e.targetHandle?.split("-").slice(1).join("-") || `Input ${i + 1}`,
      originalTarget: e.target,
      originalTargetHandle: e.targetHandle,
    }));

    const groupOutputs = outgoingEdges.map((e, i) => ({
      id: `group-out-${i}`,
      type: getPortType(e.sourceHandle),
      label: e.sourceHandle?.split("-").slice(1).join("-") || `Output ${i + 1}`,
      originalSource: e.source,
      originalSourceHandle: e.sourceHandle,
    }));

    // Calculate group position (center of selected nodes)
    const centerX =
      selectedNodes.reduce((sum, n) => sum + n.position.x, 0) /
      selectedNodes.length;
    const centerY =
      selectedNodes.reduce((sum, n) => sum + n.position.y, 0) /
      selectedNodes.length;

    const groupId = generateId();

    // Create group node
    const groupNode: Node = {
      id: groupId,
      type: "layout.group",
      position: { x: centerX - 80, y: centerY - 40 },
      data: {
        label: "Group",
        inputs: groupInputs.map((i) => ({
          id: i.id,
          type: i.type,
          label: i.label,
        })),
        outputs: groupOutputs.map((o) => ({
          id: o.id,
          type: o.type,
          label: o.label,
        })),
        ...(currentGroupId && { parentGroupId: currentGroupId }),
      },
    };

    // Create GroupInput and GroupOutput nodes inside the group
    const groupInputNode: Node = {
      id: generateId(),
      type: "layout.group_input",
      position: { x: -200, y: 0 },
      data: {
        parentGroupId: groupId,
        outputs: groupInputs.map((i) => ({
          id: i.id,
          type: i.type,
          label: i.label,
        })),
      },
    };

    const groupOutputNode: Node = {
      id: generateId(),
      type: "layout.group_output",
      position: { x: 200, y: 0 },
      data: {
        parentGroupId: groupId,
        inputs: groupOutputs.map((o) => ({
          id: o.id,
          type: o.type,
          label: o.label,
        })),
      },
    };

    // Update selected nodes to be inside group
    const updatedNodes = nodes.map((n) => {
      if (selectedIds.has(n.id)) {
        // Adjust position relative to group center
        return {
          ...n,
          data: { ...n.data, parentGroupId: groupId },
          position: {
            x: n.position.x - centerX,
            y: n.position.y - centerY,
          },
          selected: false,
        };
      }
      return n;
    });

    // Create new edges:
    // 1. External edges now connect to group node
    // 2. Internal edges from GroupInput to original targets
    // 3. Internal edges from original sources to GroupOutput
    const newExternalEdges: Edge[] = [];
    const newInternalEdges: Edge[] = [];

    // Rewire incoming edges to group
    for (let i = 0; i < incomingEdges.length; i++) {
      const e = incomingEdges[i];
      const input = groupInputs[i];

      // External: source -> group
      newExternalEdges.push({
        ...e,
        id: generateId(),
        target: groupId,
        targetHandle: input.id,
      });

      // Internal: GroupInput -> original target
      newInternalEdges.push({
        id: generateId(),
        source: groupInputNode.id,
        sourceHandle: input.id,
        target: input.originalTarget,
        targetHandle: input.originalTargetHandle,
        type: e.type,
        data: e.data,
      });
    }

    // Rewire outgoing edges from group
    for (let i = 0; i < outgoingEdges.length; i++) {
      const e = outgoingEdges[i];
      const output = groupOutputs[i];

      // External: group -> target
      newExternalEdges.push({
        ...e,
        id: generateId(),
        source: groupId,
        sourceHandle: output.id,
      });

      // Internal: original source -> GroupOutput
      newInternalEdges.push({
        id: generateId(),
        source: output.originalSource,
        sourceHandle: output.originalSourceHandle,
        target: groupOutputNode.id,
        targetHandle: output.id,
        type: e.type,
        data: e.data,
      });
    }

    // Remove old crossing edges, keep internal edges
    const edgesToRemove = new Set([
      ...incomingEdges.map((e) => e.id),
      ...outgoingEdges.map((e) => e.id),
    ]);

    set({
      nodes: [
        ...updatedNodes.filter(
          (n) => !selectedIds.has(n.id) || n.data.parentGroupId === groupId,
        ),
        ...selectedNodes.map((n) => ({
          ...n,
          data: { ...n.data, parentGroupId: groupId },
          position: {
            x: n.position.x - centerX,
            y: n.position.y - centerY,
          },
          selected: false,
        })),
        groupNode,
        groupInputNode,
        groupOutputNode,
      ],
      edges: [
        ...edges.filter((e) => !edgesToRemove.has(e.id)),
        ...newExternalEdges,
        ...newInternalEdges,
      ],
      isDirty: true,
    });
  },

  ungroupSelected: () => {
    const { nodes, edges, selectedNodeId, groupEditStack } = get();
    const currentGroupId = groupEditStack[groupEditStack.length - 1] ?? null;

    const groupNode = nodes.find(
      (n) => n.id === selectedNodeId && n.type === "layout.group",
    );
    if (!groupNode) return;

    const groupId = groupNode.id;

    // Find nodes inside this group
    const innerNodes = nodes.filter((n) => n.data.parentGroupId === groupId);

    // Find GroupInput and GroupOutput nodes
    const groupInputNode = innerNodes.find(
      (n) => n.type === "layout.group_input",
    );
    const groupOutputNode = innerNodes.find(
      (n) => n.type === "layout.group_output",
    );

    // Get position offset to move inner nodes back to parent level
    const offsetX = groupNode.position.x;
    const offsetY = groupNode.position.y;

    // Nodes to keep (inner nodes minus GroupInput/GroupOutput, with adjusted positions)
    const nodesFromGroup = innerNodes
      .filter(
        (n) =>
          n.type !== "layout.group_input" && n.type !== "layout.group_output",
      )
      .map((n) => ({
        ...n,
        data: {
          ...n.data,
          parentGroupId: currentGroupId ?? undefined,
        },
        position: {
          x: n.position.x + offsetX,
          y: n.position.y + offsetY,
        },
      }));

    // Find edges to/from group node and rewire them
    const edgesToGroup = edges.filter((e) => e.target === groupId);
    const edgesFromGroup = edges.filter((e) => e.source === groupId);

    // Find internal edges from GroupInput and to GroupOutput
    const edgesFromGroupInput = edges.filter(
      (e) => e.source === groupInputNode?.id,
    );
    const edgesToGroupOutput = edges.filter(
      (e) => e.target === groupOutputNode?.id,
    );

    // Rewire external edges
    const rewiredEdges: Edge[] = [];

    for (const externalEdge of edgesToGroup) {
      // Find the internal edge from GroupInput with matching handle
      const internalEdge = edgesFromGroupInput.find(
        (e) => e.sourceHandle === externalEdge.targetHandle,
      );
      if (internalEdge) {
        rewiredEdges.push({
          ...externalEdge,
          id: generateId(),
          target: internalEdge.target,
          targetHandle: internalEdge.targetHandle,
        });
      }
    }

    for (const externalEdge of edgesFromGroup) {
      // Find the internal edge to GroupOutput with matching handle
      const internalEdge = edgesToGroupOutput.find(
        (e) => e.targetHandle === externalEdge.sourceHandle,
      );
      if (internalEdge) {
        rewiredEdges.push({
          ...externalEdge,
          id: generateId(),
          source: internalEdge.source,
          sourceHandle: internalEdge.sourceHandle,
        });
      }
    }

    // Internal edges between regular nodes (not GroupInput/GroupOutput)
    const innerEdges = edges.filter(
      (e) =>
        e.source !== groupInputNode?.id &&
        e.target !== groupOutputNode?.id &&
        innerNodes.some((n) => n.id === e.source) &&
        innerNodes.some((n) => n.id === e.target),
    );

    // Remove group node and its special nodes, remove edges to/from them
    const nodesToRemove = new Set([
      groupId,
      groupInputNode?.id,
      groupOutputNode?.id,
    ]);
    const edgesToRemove = new Set([
      ...edgesToGroup.map((e) => e.id),
      ...edgesFromGroup.map((e) => e.id),
      ...edgesFromGroupInput.map((e) => e.id),
      ...edgesToGroupOutput.map((e) => e.id),
    ]);

    set({
      nodes: [
        ...nodes.filter(
          (n) => !nodesToRemove.has(n.id) && n.data.parentGroupId !== groupId,
        ),
        ...nodesFromGroup,
      ],
      edges: [
        ...edges.filter((e) => !edgesToRemove.has(e.id)),
        ...rewiredEdges,
        ...innerEdges,
      ],
      selectedNodeId: null,
      isDirty: true,
    });
  },

  // Auto-insert on edge
  insertNodeOnEdge: (nodeId, edgeId) => {
    const { nodes, edges } = get();
    const edge = edges.find((e) => e.id === edgeId);
    const node = nodes.find((n) => n.id === nodeId);
    if (!edge || !node) return;

    // We need node definition to find compatible sockets
    // Since we don't have access to definitions here, we'll use a simple heuristic:
    // Find first non-execution input and output that might match

    const sourceType = getPortType(edge.sourceHandle);
    const targetType = getPortType(edge.targetHandle);

    // Look for compatible sockets in node data if available
    // This is a simplified version - in practice, we'd need the node definition
    const nodeData = node.data as Record<string, unknown>;
    const nodeInputs =
      (nodeData.inputs as Array<{ id: string; type: string }>) || [];
    const nodeOutputs =
      (nodeData.outputs as Array<{ id: string; type: string }>) || [];

    // Try to find compatible input socket
    let inputSocket = nodeInputs.find(
      (p) =>
        p.type !== "execution" &&
        isTypeCompatible(sourceType as PortType, p.type as PortType),
    );

    // Try to find compatible output socket
    let outputSocket = nodeOutputs.find(
      (p) =>
        p.type !== "execution" &&
        isTypeCompatible(p.type as PortType, targetType as PortType),
    );

    // If no matching sockets found in data, try common patterns
    if (!inputSocket) {
      // Common input handle patterns
      const commonInputs = [
        `${sourceType}-in`,
        `${sourceType}-input`,
        `${sourceType}-value`,
        "any-in",
      ];
      inputSocket = { id: commonInputs[0], type: sourceType };
    }

    if (!outputSocket) {
      // Common output handle patterns
      const commonOutputs = [
        `${targetType}-out`,
        `${targetType}-output`,
        `${targetType}-result`,
        "any-out",
      ];
      outputSocket = { id: commonOutputs[0], type: targetType };
    }

    // Create new edges
    const newEdge1: Edge = {
      id: generateId(),
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      target: nodeId,
      targetHandle: inputSocket.id,
      type: edge.type,
      data: edge.data,
    };

    const newEdge2: Edge = {
      id: generateId(),
      source: nodeId,
      sourceHandle: outputSocket.id,
      target: edge.target,
      targetHandle: edge.targetHandle,
      type: edge.type,
      data: edge.data,
    };

    set({
      edges: [...edges.filter((e) => e.id !== edgeId), newEdge1, newEdge2],
      isDirty: true,
    });
  },

  // Debug node actions
  updateDebugValue: (nodeId, value) => {
    const current = get().debugNodeValues;
    const next = new Map(current);
    const history = next.get(nodeId) ?? [];
    // Keep last 50 values
    const newHistory = [
      ...history.slice(-49),
      { value, timestamp: new Date() },
    ];
    next.set(nodeId, newHistory);
    set({ debugNodeValues: next });
  },

  clearDebugValues: (nodeId) => {
    const current = get().debugNodeValues;
    const next = new Map(current);
    next.delete(nodeId);
    set({ debugNodeValues: next });
  },

  getDebugHistory: (nodeId) => {
    return get().debugNodeValues.get(nodeId) ?? [];
  },

  // Selection actions
  selectLinked: (direction) => {
    const { nodes, edges, groupEditStack } = get();
    const currentGroupId = groupEditStack[groupEditStack.length - 1] ?? null;

    // Get currently selected nodes in current view
    const selectedNodes = nodes.filter((n) => {
      if (!n.selected) return false;
      const nodeGroupId = (n.data.parentGroupId as string) ?? null;
      return nodeGroupId === currentGroupId;
    });

    if (selectedNodes.length === 0) return;

    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    const toSelect = new Set(selectedIds);

    // Build adjacency lists
    const upstream = new Map<string, string[]>();
    const downstream = new Map<string, string[]>();
    for (const edge of edges) {
      if (!downstream.has(edge.source)) downstream.set(edge.source, []);
      downstream.get(edge.source)?.push(edge.target);
      if (!upstream.has(edge.target)) upstream.set(edge.target, []);
      upstream.get(edge.target)?.push(edge.source);
    }

    // BFS traversal
    const queue = [...selectedIds];
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;

      if (direction === "upstream" || direction === "both") {
        for (const source of upstream.get(current) ?? []) {
          if (!toSelect.has(source)) {
            toSelect.add(source);
            queue.push(source);
          }
        }
      }

      if (direction === "downstream" || direction === "both") {
        for (const target of downstream.get(current) ?? []) {
          if (!toSelect.has(target)) {
            toSelect.add(target);
            queue.push(target);
          }
        }
      }
    }

    // Update selection (only nodes in current view)
    set({
      nodes: nodes.map((n) => {
        const nodeGroupId = (n.data.parentGroupId as string) ?? null;
        if (nodeGroupId !== currentGroupId) return n;
        return { ...n, selected: toSelect.has(n.id) };
      }),
    });
  },

  selectSimilar: () => {
    const { nodes, groupEditStack } = get();
    const currentGroupId = groupEditStack[groupEditStack.length - 1] ?? null;

    // Get types of selected nodes
    const selectedTypes = new Set(
      nodes
        .filter((n) => {
          if (!n.selected) return false;
          const nodeGroupId = (n.data.parentGroupId as string) ?? null;
          return nodeGroupId === currentGroupId;
        })
        .map((n) => n.type),
    );

    if (selectedTypes.size === 0) return;

    // Select all nodes of the same types in current view
    set({
      nodes: nodes.map((n) => {
        const nodeGroupId = (n.data.parentGroupId as string) ?? null;
        if (nodeGroupId !== currentGroupId) return n;
        return { ...n, selected: selectedTypes.has(n.type) };
      }),
    });
  },

  // Clipboard actions
  copySelected: () => {
    const { nodes, edges, scriptId, groupEditStack } = get();
    const currentGroupId = groupEditStack[groupEditStack.length - 1] ?? null;

    // Get selected nodes in current view
    const selectedNodes = nodes.filter((n) => {
      if (!n.selected) return false;
      const nodeGroupId = (n.data.parentGroupId as string) ?? null;
      return nodeGroupId === currentGroupId;
    });

    if (selectedNodes.length === 0) return;

    const selectedIds = new Set(selectedNodes.map((n) => n.id));

    // Get edges between selected nodes
    const selectedEdges = edges.filter(
      (e) => selectedIds.has(e.source) && selectedIds.has(e.target),
    );

    set({
      clipboard: {
        nodes: selectedNodes,
        edges: selectedEdges,
        sourceScriptId: scriptId,
      },
    });
  },

  pasteFromClipboard: (position) => {
    const { clipboard, nodes, edges, groupEditStack } = get();
    if (!clipboard || clipboard.nodes.length === 0) return;

    const currentGroupId = groupEditStack[groupEditStack.length - 1] ?? null;

    // Calculate centroid of copied nodes
    const centerX =
      clipboard.nodes.reduce((sum, n) => sum + n.position.x, 0) /
      clipboard.nodes.length;
    const centerY =
      clipboard.nodes.reduce((sum, n) => sum + n.position.y, 0) /
      clipboard.nodes.length;

    // Create ID mapping
    const idMap = new Map<string, string>();
    for (const node of clipboard.nodes) {
      idMap.set(node.id, generateId());
    }

    // Create new nodes at target position
    const newNodes: Node[] = clipboard.nodes.map((node) => ({
      ...node,
      id: idMap.get(node.id) ?? generateId(),
      position: {
        x: position.x + (node.position.x - centerX),
        y: position.y + (node.position.y - centerY),
      },
      data: {
        ...node.data,
        parentGroupId: currentGroupId ?? undefined,
      },
      selected: true,
    }));

    // Create new edges with remapped IDs
    const newEdges: Edge[] = clipboard.edges.map((edge) => ({
      ...edge,
      id: generateId(),
      source: idMap.get(edge.source) ?? edge.source,
      target: idMap.get(edge.target) ?? edge.target,
    }));

    // Deselect existing nodes
    const updatedNodes = nodes.map((n) => ({ ...n, selected: false }));

    set({
      nodes: [...updatedNodes, ...newNodes],
      edges: [...edges, ...newEdges],
      isDirty: true,
    });
  },

  canPaste: () => {
    const { clipboard } = get();
    return clipboard !== null && clipboard.nodes.length > 0;
  },

  // Alignment actions
  alignNodes: (direction) => {
    const { nodes, groupEditStack } = get();
    const currentGroupId = groupEditStack[groupEditStack.length - 1] ?? null;

    // Get selected nodes in current view
    const selectedNodes = nodes.filter((n) => {
      if (!n.selected) return false;
      const nodeGroupId = (n.data.parentGroupId as string) ?? null;
      return nodeGroupId === currentGroupId;
    });

    if (selectedNodes.length < 2) return;

    const selectedIds = new Set(selectedNodes.map((n) => n.id));

    // Calculate reference values
    const positions = selectedNodes.map((n) => ({
      x: n.position.x,
      y: n.position.y,
      width: n.measured?.width ?? 160,
      height: n.measured?.height ?? 100,
    }));

    let targetValue: number;
    switch (direction) {
      case "left":
        targetValue = Math.min(...positions.map((p) => p.x));
        break;
      case "right":
        targetValue = Math.max(...positions.map((p) => p.x + p.width));
        break;
      case "top":
        targetValue = Math.min(...positions.map((p) => p.y));
        break;
      case "bottom":
        targetValue = Math.max(...positions.map((p) => p.y + p.height));
        break;
      case "centerH":
        targetValue =
          positions.reduce((sum, p) => sum + p.x + p.width / 2, 0) /
          positions.length;
        break;
      case "centerV":
        targetValue =
          positions.reduce((sum, p) => sum + p.y + p.height / 2, 0) /
          positions.length;
        break;
    }

    set({
      nodes: nodes.map((n) => {
        if (!selectedIds.has(n.id)) return n;

        const width = n.measured?.width ?? 160;
        const height = n.measured?.height ?? 100;

        const newPosition = { ...n.position };
        switch (direction) {
          case "left":
            newPosition.x = targetValue;
            break;
          case "right":
            newPosition.x = targetValue - width;
            break;
          case "top":
            newPosition.y = targetValue;
            break;
          case "bottom":
            newPosition.y = targetValue - height;
            break;
          case "centerH":
            newPosition.x = targetValue - width / 2;
            break;
          case "centerV":
            newPosition.y = targetValue - height / 2;
            break;
        }

        return { ...n, position: newPosition };
      }),
      isDirty: true,
    });
  },

  distributeNodes: (direction) => {
    const { nodes, groupEditStack } = get();
    const currentGroupId = groupEditStack[groupEditStack.length - 1] ?? null;

    // Get selected nodes in current view
    const selectedNodes = nodes.filter((n) => {
      if (!n.selected) return false;
      const nodeGroupId = (n.data.parentGroupId as string) ?? null;
      return nodeGroupId === currentGroupId;
    });

    if (selectedNodes.length < 3) return;

    const selectedIds = new Set(selectedNodes.map((n) => n.id));

    // Sort by position
    const sorted = [...selectedNodes].sort((a, b) =>
      direction === "horizontal"
        ? a.position.x - b.position.x
        : a.position.y - b.position.y,
    );

    // Calculate spacing
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const _firstSize =
      direction === "horizontal"
        ? (first.measured?.width ?? 160)
        : (first.measured?.height ?? 100);
    const lastPos =
      direction === "horizontal" ? last.position.x : last.position.y;
    const firstPos =
      direction === "horizontal" ? first.position.x : first.position.y;

    const totalSpace = lastPos - firstPos;
    const step = totalSpace / (sorted.length - 1);

    // Create position map
    const positionMap = new Map<string, number>();
    for (let i = 0; i < sorted.length; i++) {
      positionMap.set(sorted[i].id, firstPos + i * step);
    }

    set({
      nodes: nodes.map((n) => {
        if (!selectedIds.has(n.id)) return n;

        const newPos = positionMap.get(n.id);
        if (newPos === undefined) return n;

        return {
          ...n,
          position:
            direction === "horizontal"
              ? { ...n.position, x: newPos }
              : { ...n.position, y: newPos },
        };
      }),
      isDirty: true,
    });
  },

  // Quick add menu actions
  openQuickAddMenu: (position, screenPosition, sourceSocket) => {
    set({
      quickAddMenu: {
        position,
        screenPosition,
        sourceSocket,
      },
    });
  },

  closeQuickAddMenu: () => {
    set({ quickAddMenu: null });
  },

  // Link cutting actions
  startLinkCutting: (point) => {
    set({
      linkCutting: {
        active: true,
        startPoint: point,
        endPoint: point,
      },
    });
  },

  updateLinkCutting: (point) => {
    const { linkCutting } = get();
    if (linkCutting.active) {
      set({
        linkCutting: {
          ...linkCutting,
          endPoint: point,
        },
      });
    }
  },

  endLinkCutting: () => {
    const { linkCutting } = get();
    if (linkCutting.active && linkCutting.startPoint && linkCutting.endPoint) {
      // Cut edges that intersect the line
      get().cutEdgesIntersectingLine(
        linkCutting.startPoint,
        linkCutting.endPoint,
      );
    }
    set({
      linkCutting: {
        active: false,
        startPoint: null,
        endPoint: null,
      },
    });
  },

  cutEdgesIntersectingLine: (start, end) => {
    const { edges, nodes } = get();

    // Helper function to check if two line segments intersect
    const lineSegmentsIntersect = (
      p1: XYPosition,
      p2: XYPosition,
      p3: XYPosition,
      p4: XYPosition,
    ): boolean => {
      const d1 = direction(p3, p4, p1);
      const d2 = direction(p3, p4, p2);
      const d3 = direction(p1, p2, p3);
      const d4 = direction(p1, p2, p4);

      if (
        ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
      ) {
        return true;
      }
      return false;
    };

    const direction = (
      p1: XYPosition,
      p2: XYPosition,
      p3: XYPosition,
    ): number => {
      return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
    };

    // Get node positions for edge endpoints
    const nodePositions = new Map(nodes.map((n) => [n.id, n.position]));

    // Find edges to cut
    const edgesToRemove = edges.filter((edge) => {
      const sourcePos = nodePositions.get(edge.source);
      const targetPos = nodePositions.get(edge.target);
      if (!sourcePos || !targetPos) return false;

      // Approximate edge as a straight line between node centers
      // (In reality, edges are curves, but this is a reasonable approximation)
      const edgeStart = { x: sourcePos.x + 80, y: sourcePos.y + 40 };
      const edgeEnd = { x: targetPos.x, y: targetPos.y + 40 };

      return lineSegmentsIntersect(start, end, edgeStart, edgeEnd);
    });

    if (edgesToRemove.length > 0) {
      set({
        edges: edges.filter((e) => !edgesToRemove.some((r) => r.id === e.id)),
        isDirty: true,
      });
    }
  },

  // Metadata actions
  setScriptName: (name) => set({ scriptName: name, isDirty: true }),
  setScriptDescription: (description) =>
    set({ scriptDescription: description, isDirty: true }),
  setAutoStart: (autoStart) => set({ autoStart, isDirty: true }),
  setDirty: (dirty) => set({ isDirty: dirty }),

  // Execution actions
  setActive: (active) => set({ isActive: active }),
  setActiveNode: (nodeId) => set({ activeNodeId: nodeId }),
  addExecutionLog: (log) =>
    set({
      executionLogs: [
        ...get().executionLogs,
        { ...log, timestamp: new Date() },
      ],
    }),
  clearExecutionLogs: () => set({ executionLogs: [] }),

  // Persistence
  loadScript: (data) =>
    set({
      scriptId: data.id,
      scriptName: data.name,
      scriptDescription: data.description,
      autoStart: data.autoStart,
      nodes: data.nodes,
      edges: data.edges,
      isDirty: false,
      selectedNodeId: null,
      groupEditStack: [],
      previewEnabledNodes: new Set<string>(),
      previewValues: new Map<string, Record<string, unknown>>(),
      debugNodeValues: new Map<
        string,
        Array<{ value: unknown; timestamp: Date }>
      >(),
    }),

  resetEditor: () =>
    set({
      nodes: [],
      edges: [],
      scriptId: null,
      scriptName: "Untitled Script",
      scriptDescription: "",
      autoStart: false,
      isDirty: false,
      isActive: false,
      activeNodeId: null,
      executionLogs: [],
      selectedNodeId: null,
      quickAddMenu: null,
      groupEditStack: [],
      previewEnabledNodes: new Set<string>(),
      previewValues: new Map<string, Record<string, unknown>>(),
      debugNodeValues: new Map<
        string,
        Array<{ value: unknown; timestamp: Date }>
      >(),
      clipboard: null,
      linkCutting: {
        active: false,
        startPoint: null,
        endPoint: null,
      },
    }),

  getScriptData: () => ({
    nodes: get().nodes,
    edges: get().edges,
    name: get().scriptName,
    description: get().scriptDescription,
    autoStart: get().autoStart,
  }),
}));
