import type { Edge } from "@xyflow/react";
import { createContext, type ReactNode, useContext } from "react";

/**
 * Context for providing node editing capabilities to node components.
 * This avoids circular dependencies between nodes and the store.
 */
export interface NodeEditingContextValue {
  /** Current edges in the graph - used to determine connected ports */
  edges: Edge[];
  /** Update node data */
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  /** ID of the node currently being renamed (via F2 or context menu) */
  renamingNodeId: string | null;
  /** Clear the renaming node ID after the target node has entered edit mode */
  clearRenamingNodeId: () => void;
}

const NodeEditingContext = createContext<NodeEditingContextValue | null>(null);

interface NodeEditingProviderProps {
  children: ReactNode;
  edges: Edge[];
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  renamingNodeId: string | null;
  clearRenamingNodeId: () => void;
}

export function NodeEditingProvider({
  children,
  edges,
  updateNodeData,
  renamingNodeId,
  clearRenamingNodeId,
}: NodeEditingProviderProps) {
  return (
    <NodeEditingContext.Provider
      value={{ edges, updateNodeData, renamingNodeId, clearRenamingNodeId }}
    >
      {children}
    </NodeEditingContext.Provider>
  );
}

/**
 * Hook to access node editing capabilities.
 * Must be used within a NodeEditingProvider (inside ReactFlow).
 */
export function useNodeEditing(): NodeEditingContextValue {
  const context = useContext(NodeEditingContext);
  if (!context) {
    // Return safe defaults if not in provider (shouldn't happen in practice)
    return {
      edges: [],
      updateNodeData: () => {},
      renamingNodeId: null,
      clearRenamingNodeId: () => {},
    };
  }
  return context;
}
