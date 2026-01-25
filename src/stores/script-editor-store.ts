import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
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
  isDirty: boolean;

  // Execution state
  isRunning: boolean;
  activeNodeId: string | null;
  executionLogs: Array<{
    nodeId: string;
    level: "debug" | "info" | "warn" | "error";
    message: string;
    timestamp: Date;
  }>;

  // Selected node for inspector
  selectedNodeId: string | null;

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

  // Script metadata actions
  setScriptName: (name: string) => void;
  setScriptDescription: (description: string) => void;
  setDirty: (dirty: boolean) => void;

  // Execution actions
  setRunning: (running: boolean) => void;
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
    nodes: Node[];
    edges: Edge[];
  }) => void;
  resetEditor: () => void;
  getScriptData: () => {
    nodes: Node[];
    edges: Edge[];
    name: string;
    description: string;
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
  isDirty: false,
  isRunning: false,
  activeNodeId: null,
  executionLogs: [],
  selectedNodeId: null,

  // React Flow handlers
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      isDirty: true,
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isDirty: true,
    });
  },

  onConnect: (connection) => {
    // Add edge type based on handle types
    const edgeType = connection.sourceHandle?.startsWith("exec")
      ? "execution"
      : "data";
    set({
      edges: addEdge(
        { ...connection, type: edgeType, data: { edgeType } },
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
      data: { ...data, label: type },
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

  // Metadata actions
  setScriptName: (name) => set({ scriptName: name, isDirty: true }),
  setScriptDescription: (description) =>
    set({ scriptDescription: description, isDirty: true }),
  setDirty: (dirty) => set({ isDirty: dirty }),

  // Execution actions
  setRunning: (running) => set({ isRunning: running }),
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
      isDirty: false,
      isRunning: false,
      activeNodeId: null,
      executionLogs: [],
      selectedNodeId: null,
    }),

  getScriptData: () => ({
    nodes: get().nodes,
    edges: get().edges,
    name: get().scriptName,
    description: get().scriptDescription,
  }),
}));
