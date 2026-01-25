import {
  BaseEdge,
  type Edge,
  type EdgeProps,
  getSmoothStepPath,
} from "@xyflow/react";

import { cn } from "@/lib/utils";

export type ExecutionEdgeData = {
  isRunning?: boolean;
};

export type ExecutionEdgeType = Edge<ExecutionEdgeData, "execution">;

const EDGE_COLOR = "rgb(200, 200, 200)";
const _EDGE_COLOR_DARK = "rgb(180, 180, 180)";

function ExecutionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
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
    <>
      {/* Define arrow marker */}
      <defs>
        <marker
          id={`arrow-${id}`}
          markerWidth="12"
          markerHeight="12"
          refX="8"
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M2,2 L10,6 L2,10 L4,6 Z"
            fill={EDGE_COLOR}
            className="dark:fill-[rgb(180,180,180)]"
          />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        className={cn(
          "!stroke-[rgb(200,200,200)] dark:!stroke-[rgb(180,180,180)]",
          isRunning && "animate-[dash_0.5s_linear_infinite]",
          selected && "!stroke-[rgb(255,255,255)]",
        )}
        style={{
          strokeWidth: 2.5,
          strokeDasharray: isRunning ? "5 5" : undefined,
          markerEnd: `url(#arrow-${id})`,
        }}
      />
      <style>
        {`
          @keyframes dash {
            to {
              stroke-dashoffset: -10;
            }
          }
        `}
      </style>
    </>
  );
}

export { ExecutionEdge };
