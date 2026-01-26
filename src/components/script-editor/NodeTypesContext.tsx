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
import {
  type CategoryInfo,
  type NodeDefinition,
  protoCategoryToLocal,
  protoNodeTypeToLocal,
} from "./nodes/types";

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

  // Convert proto definitions to local format
  const definitions = useMemo(() => {
    const result: Record<string, NodeDefinition> = {};
    for (const proto of data.nodeTypes) {
      const local = protoNodeTypeToLocal(proto);
      result[local.type] = local;
    }
    return result;
  }, [data.nodeTypes]);

  // Create React Flow node types from definitions
  const nodeTypes = useMemo(() => {
    const result: NodeTypes = {};
    for (const [type, definition] of Object.entries(definitions)) {
      result[type] = createNodeComponent(definition);
    }
    return result;
  }, [definitions]);

  // Convert and sort categories from server response
  const categoryInfo = useMemo(() => {
    const result: Record<string, CategoryInfo> = {};
    for (const proto of data.categories) {
      const local = protoCategoryToLocal(proto);
      result[local.id] = local;
    }
    return result;
  }, [data.categories]);

  // Get sorted category IDs
  const categories = useMemo(() => {
    return [...data.categories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => c.id);
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
