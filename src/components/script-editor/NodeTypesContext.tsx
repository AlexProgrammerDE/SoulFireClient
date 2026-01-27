import { useSuspenseQuery } from "@tanstack/react-query";
import type { NodeTypes } from "@xyflow/react";
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { TransportContext } from "@/components/providers/transport-context";
import { nodeTypesQueryOptions } from "@/lib/script-service";
import { createNodeComponent } from "./nodes/BaseNode";
import { FrameNode } from "./nodes/FrameNode";
import { GroupInputNode } from "./nodes/GroupInputNode";
import { GroupNode } from "./nodes/GroupNode";
import { GroupOutputNode } from "./nodes/GroupOutputNode";
import { RerouteNode } from "./nodes/RerouteNode";
import {
  type CategoryInfo,
  type NodeDefinition,
  protoCategoryToLocal,
  protoNodeTypeToLocal,
} from "./nodes/types";

// Client-side layout node definitions (not from server)
const LAYOUT_NODE_DEFINITIONS: NodeDefinition[] = [
  {
    type: "layout.reroute",
    label: "Reroute",
    category: "layout",
    icon: "Circle",
    inputs: [{ id: "any-in", label: "", type: "any" }],
    outputs: [{ id: "any-out", label: "", type: "any" }],
    description: "A pass-through node for organizing connections",
    isLayoutNode: true,
    keywords: ["reroute", "redirect", "organize", "passthrough"],
  },
  {
    type: "layout.frame",
    label: "Frame",
    category: "layout",
    icon: "Square",
    inputs: [],
    outputs: [],
    description: "A visual container for grouping related nodes",
    isLayoutNode: true,
    keywords: ["frame", "group", "organize", "container"],
  },
  {
    type: "layout.group",
    label: "Node Group",
    category: "layout",
    icon: "Layers",
    inputs: [],
    outputs: [],
    description: "A reusable composite node containing a sub-graph",
    isLayoutNode: true,
    keywords: ["group", "subgraph", "reusable", "composite"],
  },
  {
    type: "layout.group_input",
    label: "Group Input",
    category: "layout",
    icon: "ArrowRightFromLine",
    inputs: [],
    outputs: [],
    description: "Defines inputs for a node group (inside the group)",
    isLayoutNode: true,
    keywords: ["input", "group"],
  },
  {
    type: "layout.group_output",
    label: "Group Output",
    category: "layout",
    icon: "ArrowLeftFromLine",
    inputs: [],
    outputs: [],
    description: "Defines outputs for a node group (inside the group)",
    isLayoutNode: true,
    keywords: ["output", "group"],
  },
];

// Layout category info
const LAYOUT_CATEGORY_INFO: CategoryInfo = {
  id: "layout",
  name: "Layout",
  icon: "Layout",
  description: "Nodes for organizing your script visually",
  sortOrder: 1000, // Put at the end
};

export interface NodeTypesContextValue {
  /** All node definitions keyed by type */
  definitions: Record<string, NodeDefinition>;
  /** React Flow node type components */
  nodeTypes: NodeTypes;
  /** All available categories (from server) */
  categories: string[];
  /** Category info derived from nodes */
  categoryInfo: Record<string, CategoryInfo>;
  /** Get a node definition by type */
  getDefinition: (type: string) => NodeDefinition | undefined;
  /** Get nodes by category */
  getNodesByCategory: (category: string) => NodeDefinition[];
  /** Get category info */
  getCategoryInfo: (category: string) => CategoryInfo;
  /** Create default data for a node type */
  createNodeData: (
    type: string,
    overrides?: Record<string, unknown>,
  ) => Record<string, unknown>;
  /** Whether the node types are still loading */
  isLoading: boolean;
}

const NodeTypesContext = createContext<NodeTypesContextValue | null>(null);

interface NodeTypesProviderProps {
  children: ReactNode;
  includeDeprecated?: boolean;
}

export function NodeTypesProvider({
  children,
  includeDeprecated = false,
}: NodeTypesProviderProps) {
  const transport = use(TransportContext);

  const { data, isLoading } = useSuspenseQuery(
    nodeTypesQueryOptions(transport, { includeDeprecated }),
  );

  // Convert proto definitions to local format and add layout nodes
  const definitions = useMemo(() => {
    const result: Record<string, NodeDefinition> = {};
    // Add server-provided node types
    for (const proto of data.nodeTypes) {
      const local = protoNodeTypeToLocal(proto);
      result[local.type] = local;
    }
    // Add client-side layout node types
    for (const layoutNode of LAYOUT_NODE_DEFINITIONS) {
      result[layoutNode.type] = layoutNode;
    }
    return result;
  }, [data.nodeTypes]);

  // Create React Flow node types from definitions
  const nodeTypes = useMemo(() => {
    const result: NodeTypes = {};
    for (const [type, definition] of Object.entries(definitions)) {
      // Use special components for layout nodes
      if (type === "layout.reroute") {
        result[type] = RerouteNode;
      } else if (type === "layout.frame") {
        result[type] = FrameNode;
      } else if (type === "layout.group") {
        result[type] = GroupNode;
      } else if (type === "layout.group_input") {
        result[type] = GroupInputNode;
      } else if (type === "layout.group_output") {
        result[type] = GroupOutputNode;
      } else {
        result[type] = createNodeComponent(definition);
      }
    }
    return result;
  }, [definitions]);

  // Convert and sort categories from server response, add layout category
  const categoryInfo = useMemo(() => {
    const result: Record<string, CategoryInfo> = {};
    for (const proto of data.categories) {
      const local = protoCategoryToLocal(proto);
      result[local.id] = local;
    }
    // Add layout category
    result[LAYOUT_CATEGORY_INFO.id] = LAYOUT_CATEGORY_INFO;
    return result;
  }, [data.categories]);

  // Get sorted category IDs
  const categories = useMemo(() => {
    const serverCategories = [...data.categories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => c.id);
    // Add layout category at the end
    return [...serverCategories, LAYOUT_CATEGORY_INFO.id];
  }, [data.categories]);

  // Group nodes by category
  const nodesByCategory = useMemo(() => {
    const result: Record<string, NodeDefinition[]> = {};
    for (const category of categories) {
      result[category] = [];
    }
    for (const node of Object.values(definitions)) {
      if (!result[node.category]) {
        result[node.category] = [];
      }
      result[node.category].push(node);
    }
    return result;
  }, [definitions, categories]);

  const getDefinition = useCallback(
    (type: string) => definitions[type],
    [definitions],
  );

  const getNodesByCategory = useCallback(
    (category: string) => {
      return nodesByCategory[category] ?? [];
    },
    [nodesByCategory],
  );

  const getCategoryInfo = useCallback(
    (category: string): CategoryInfo => {
      return (
        categoryInfo[category] ?? {
          id: category,
          name: category,
          icon: "Circle",
          sortOrder: 999,
        }
      );
    },
    [categoryInfo],
  );

  const createNodeData = useCallback(
    (type: string, overrides?: Record<string, unknown>) => {
      const definition = definitions[type];
      if (!definition) {
        return { label: type, ...overrides };
      }
      return {
        label: definition.label,
        ...definition.defaultData,
        ...overrides,
      };
    },
    [definitions],
  );

  const value = useMemo<NodeTypesContextValue>(
    () => ({
      definitions,
      nodeTypes,
      categories,
      categoryInfo,
      getDefinition,
      getNodesByCategory,
      getCategoryInfo,
      createNodeData,
      isLoading,
    }),
    [
      definitions,
      nodeTypes,
      categories,
      categoryInfo,
      getDefinition,
      getNodesByCategory,
      getCategoryInfo,
      createNodeData,
      isLoading,
    ],
  );

  return (
    <NodeTypesContext.Provider value={value}>
      {children}
    </NodeTypesContext.Provider>
  );
}

/**
 * Hook to access node type definitions.
 * Must be used within a NodeTypesProvider.
 */
export function useNodeTypes(): NodeTypesContextValue {
  const context = useContext(NodeTypesContext);
  if (!context) {
    throw new Error("useNodeTypes must be used within a NodeTypesProvider");
  }
  return context;
}
