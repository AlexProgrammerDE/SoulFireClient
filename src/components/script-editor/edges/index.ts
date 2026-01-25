import type { EdgeTypes } from "@xyflow/react";

import { DataEdge, type DataEdgeType } from "./DataEdge";
import { ExecutionEdge, type ExecutionEdgeType } from "./ExecutionEdge";

/**
 * Edge types map for React Flow registration
 */
const edgeTypes: EdgeTypes = {
  execution: ExecutionEdge,
  data: DataEdge,
};

export {
  edgeTypes,
  ExecutionEdge,
  DataEdge,
  type ExecutionEdgeType,
  type DataEdgeType,
};
export * from "./connection-validation";
