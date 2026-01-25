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
 * Validates whether a connection between two handles is allowed based on their types.
 * Rules:
 * - Execution ports only connect to execution ports
 * - Any type can connect to anything (except execution)
 * - Same types can connect
 * - Number/boolean can connect to string (implicit conversion)
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

  // Any type can connect to anything (except execution)
  if (sourceType === "any" || targetType === "any") return true;

  // Same types can connect
  if (sourceType === targetType) return true;

  // Number can connect to string (implicit conversion)
  if (sourceType === "number" && targetType === "string") return true;
  if (sourceType === "boolean" && targetType === "string") return true;

  return false;
};
