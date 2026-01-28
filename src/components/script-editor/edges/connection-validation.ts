import type { Connection, Edge, IsValidConnection, Node } from "@xyflow/react";
import {
  getPortTypeFromDefinition,
  type PortType,
} from "@/components/script-editor/nodes/types";

/**
 * Type conversion rules - Blender-style implicit conversions.
 * Maps source type to array of compatible target types.
 */
const TYPE_CONVERSIONS: Record<string, string[]> = {
  // Number can convert to string, boolean, vector3 (all components same)
  number: ["string", "boolean"],
  // Boolean can convert to string, number (0/1)
  boolean: ["string", "number"],
  // String can convert to number (parse), boolean (truthy check)
  string: ["number", "boolean"],
  // Vector3 can convert to list
  vector3: ["list"],
  // List can convert to string (join)
  list: ["string"],
  // Bot, entity, block, item have no implicit conversions
  bot: [],
  entity: [],
  block: [],
  item: [],
};

/**
 * Check if a source type can be converted to a target type.
 */
export function canConvertType(
  sourceType: string,
  targetType: string,
): boolean {
  // Same type always works
  if (sourceType === targetType) return true;

  // Any type is universal
  if (sourceType === "any" || targetType === "any") return true;

  // Check explicit conversion rules
  const conversions = TYPE_CONVERSIONS[sourceType];
  if (conversions?.includes(targetType)) return true;

  return false;
}

/**
 * Get port type from node definition.
 * Returns the port type or "any" if not found.
 */
function getPortType(
  nodes: Node[],
  nodeId: string,
  handleId: string | null | undefined,
): PortType {
  if (!handleId) return "any";

  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return "any";

  // Try to look up from node definition
  const portType = getPortTypeFromDefinition(node.type ?? "", handleId);
  if (portType) return portType;

  // Fallback for layout nodes (reroute, group) that store resolved type in data
  const nodeData = node.data as { resolvedType?: PortType } | undefined;
  if (nodeData?.resolvedType) return nodeData.resolvedType;

  return "any";
}

/**
 * Creates a connection validator that uses node definitions to determine port types.
 * This is the primary validation method that should be used.
 *
 * @param nodes The current nodes in the graph
 * @returns An IsValidConnection function for React Flow
 */
export function createConnectionValidator(nodes: Node[]): IsValidConnection {
  return (connection: Edge | Connection): boolean => {
    const sourceType = getPortType(
      nodes,
      connection.source,
      connection.sourceHandle,
    );
    const targetType = getPortType(
      nodes,
      connection.target,
      connection.targetHandle,
    );

    // Execution ports only connect to execution ports
    if (sourceType === "execution" && targetType === "execution") return true;
    if (sourceType === "execution" || targetType === "execution") return false;

    // Use the enhanced type conversion check
    return canConvertType(sourceType, targetType);
  };
}
