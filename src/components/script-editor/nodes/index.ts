import type { NodeTypes } from "@xyflow/react";
import { createNodeComponent } from "./BaseNode";
import { NODE_DEFINITIONS } from "./node-definitions";

export type { BaseNodeData } from "./BaseNode";

// Export base node component and factory
export { BaseNode, createNodeComponent } from "./BaseNode";
// Export all node definitions
export * from "./node-definitions";
// Export types
export * from "./types";

// Create node type components from all definitions
export const nodeTypes: NodeTypes = Object.fromEntries(
  Object.entries(NODE_DEFINITIONS).map(([type, definition]) => [
    type,
    createNodeComponent(definition),
  ]),
);

// Helper to get a node definition by type
export function getNodeDefinition(type: string) {
  return NODE_DEFINITIONS[type];
}

// Helper to create a new node with default data
export function createNodeData(
  type: string,
  overrides?: Record<string, unknown>,
) {
  const definition = NODE_DEFINITIONS[type];
  if (!definition) {
    return { label: type };
  }

  return {
    label: definition.label,
    ...definition.defaultData,
    ...overrides,
  };
}
