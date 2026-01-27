import { Handle, type NodeProps, Position } from "@xyflow/react";
import { ArrowLeftFromLine } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { getPortColor, type PortType } from "./types";

export interface GroupOutputNodeData {
  /** Input sockets that map to the group's external outputs */
  inputs?: Array<{ id: string; type: PortType; label: string }>;
}

interface GroupOutputNodeProps extends NodeProps {
  data: GroupOutputNodeData;
}

/**
 * Group Output Node - Defines the outputs of a node group from inside.
 * Blender-style: This node exposes values that will be output from the group.
 */
function GroupOutputNodeComponent({ data, selected }: GroupOutputNodeProps) {
  const inputs = data.inputs ?? [];

  return (
    <div
      className={cn(
        "min-w-[140px] rounded-lg border-2 bg-card shadow-md",
        "border-red-500/50",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/50 bg-red-500/10 px-3 py-2">
        <ArrowLeftFromLine className="h-4 w-4 text-red-500" />
        <span className="text-sm font-medium">Group Output</span>
      </div>

      {/* Input ports */}
      {inputs.length > 0 && (
        <div className="px-1 py-1">
          {inputs.map((input) => (
            <div key={input.id} className="flex items-center gap-2 py-1 pr-4">
              <Handle
                type="target"
                position={Position.Left}
                id={input.id}
                className="!relative !top-0 !transform-none transition-transform hover:scale-125"
                style={{
                  background: getPortColor(input.type),
                  width: input.type === "execution" ? 10 : 8,
                  height: input.type === "execution" ? 10 : 8,
                  border: "2px solid var(--background)",
                  borderRadius: input.type === "execution" ? 2 : "50%",
                }}
              />
              <span className="text-xs text-muted-foreground">
                {input.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {inputs.length === 0 && (
        <div className="px-3 py-2 text-xs text-muted-foreground italic">
          No outputs defined
        </div>
      )}
    </div>
  );
}

export const GroupOutputNode = memo(GroupOutputNodeComponent);
