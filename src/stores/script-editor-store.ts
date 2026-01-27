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

export type PortType =
  | "execution"
  | "number"
  | "boolean"
  | "string"
  | "vector3"
  | "entity"
  | "bot"
  | "any";

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

  // Actions
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (
    type: string,
    position: XYPosition,
    data?: Record<string, unknown>,
  ) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  deleteSelected: () => void;
  setSelectedNode: (nodeId: string | null) => void;

  // Blender-style node actions
  toggleMute: (nodeId: string) => void;
  toggleCollapse: (nodeId: string) => void;
  createFrame: (nodeIds: string[], label?: string) => void;
  removeFromFrame: (nodeId: string) => void;
  insertReroute: (edgeId: string, position: XYPosition) => void;
  duplicateSelected: () => void;

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
    // Add edge type based on handle types
    const isExecution = connection.sourceHandle?.startsWith("exec");
    const edgeType = isExecution ? "execution" : "data";

    set({
      edges: addEdge(
        {
          ...connection,
          type: edgeType,
          data: { edgeType },
          // Add arrow marker for execution edges
          ...(isExecution && {
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
    const newNode: Node = {
      id: generateId(),
      type,
      position,
      data: { ...data },
    };
    set({
      nodes: [...get().nodes, newNode],
      isDirty: true,
    });
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
    set({
      nodes: get().nodes.filter((node) => !node.selected),
      edges: get().edges.filter((edge) => !edge.selected),
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
    const frameNode: Node = {
      id: frameId,
      type: "layout.frame",
      position: { x: minX, y: minY },
      data: {
        label,
        containedNodes: nodeIds,
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
    const rerouteNode: Node = {
      id: rerouteId,
      type: "layout.reroute",
      position,
      data: {},
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
      nodes: [...nodes, { ...rerouteNode, data: { resolvedType: sourceType } }],
      edges: [...edges.filter((e) => e.id !== edgeId), newEdge1, newEdge2],
      isDirty: true,
    });
  },

  duplicateSelected: () => {
    const { nodes, edges } = get();
    const selectedNodes = nodes.filter((n) => n.selected);
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
