import {
  BaseEdge,
  type Edge,
  type EdgeProps,
  getSmoothStepPath,
  MarkerType,
} from "@xyflow/react";

import { cn } from "@/lib/utils";

export type ExecutionEdgeData = {
  isRunning?: boolean;
};

export type ExecutionEdgeType = Edge<ExecutionEdgeData, "execution">;

function ExecutionEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<ExecutionEdgeType>) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const isRunning = data?.isRunning ?? false;

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      className={cn(
        "!stroke-muted-foreground",
        isRunning && "animate-pulse",
        selected && "!stroke-foreground",
      )}
      style={{
        strokeWidth: 2.5,
        strokeDasharray: isRunning ? "5 5" : undefined,
      }}
    />
  );
}

// Default edge options for execution edges
export const executionEdgeDefaults = {
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
  },
};

export { ExecutionEdge };
