import { type NodeProps, NodeResizer } from "@xyflow/react";
import { memo } from "react";
import { cn } from "@/lib/utils";

export interface FrameNodeData {
  /** Label displayed at the top of the frame */
  label?: string;
  /** Background color (hex) */
  color?: string;
  /** Whether the frame is locked (children can't be moved) */
  locked?: boolean;
}

interface FrameNodeProps extends NodeProps {
  data: FrameNodeData;
}

/**
 * Frame Node - A visual container for grouping related nodes.
 * Blender-style: provides organization without affecting execution.
 * Children move with the frame when it's dragged.
 */
function FrameNodeComponent({ data, selected }: FrameNodeProps) {
  const label = data.label ?? "Frame";
  const backgroundColor = data.color ?? "var(--muted)";

  return (
    <>
      {/* Resizer handles */}
      <NodeResizer
        minWidth={200}
        minHeight={100}
        isVisible={selected}
        lineClassName="!border-primary"
        handleClassName="!w-2 !h-2 !bg-primary !border-none"
      />

      {/* Frame container */}
      <div
        className={cn(
          "w-full h-full rounded-lg border-2 border-dashed",
          selected ? "border-primary" : "border-border/50",
          data.locked && "cursor-not-allowed",
        )}
        style={{
          backgroundColor: `${backgroundColor}20`, // 20% opacity
          minWidth: 200,
          minHeight: 100,
        }}
      >
        {/* Frame header/label */}
        <div
          className={cn(
            "absolute -top-6 left-2 px-2 py-0.5 rounded text-sm font-medium",
            selected ? "text-primary" : "text-muted-foreground",
          )}
          style={{
            backgroundColor: backgroundColor,
          }}
        >
          {label}
          {data.locked && <span className="ml-1 text-xs opacity-50">🔒</span>}
        </div>
      </div>
    </>
  );
}

export const FrameNode = memo(FrameNodeComponent);
