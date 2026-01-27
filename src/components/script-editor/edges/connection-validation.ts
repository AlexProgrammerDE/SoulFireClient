import type { Connection, Edge, IsValidConnection } from "@xyflow/react";

/**
 * Extract port type from handle id format: "type-name" e.g., "number-a", "exec-out"
 */
export function getPortType(
  handleId: string | null | undefined,
): string | null {
  if (!handleId) return null;
  const parts = handleId.split("-");
  return parts[0] || null;
}

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
 * Validates whether a connection between two handles is allowed based on their types.
 * Rules:
 * - Execution ports only connect to execution ports
 * - Any type can connect to anything (except execution)
 * - Same types can connect
 * - Implicit type conversions are supported (Blender-style)
 */
export const isValidConnection: IsValidConnection = (
  connection: Edge | Connection,
): boolean => {
  const sourceType = getPortType(connection.sourceHandle);
  const targetType = getPortType(connection.targetHandle);

  if (!sourceType || !targetType) return false;

  // Execution ports only connect to execution ports
  if (sourceType === "exec" && targetType === "exec") return true;
  if (sourceType === "exec" || targetType === "exec") return false;

  // Use the enhanced type conversion check
  return canConvertType(sourceType, targetType);
};
