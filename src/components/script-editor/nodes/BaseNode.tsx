import { Handle, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import {
  CATEGORY_COLORS,
  type NodeDefinition,
  PORT_COLORS,
  type PortDefinition,
} from "./types";

export interface BaseNodeData {
  label?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

interface BaseNodeProps extends NodeProps {
  data: BaseNodeData;
  definition: NodeDefinition;
}

function PortRow({
  port,
  type,
  position,
}: {
  port: PortDefinition;
  type: "source" | "target";
  position: Position;
}) {
  const color = PORT_COLORS[port.type];
  const isExecution = port.type === "execution";
  const isLeft = position === Position.Left;

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 py-1",
        isLeft ? "pr-4" : "pl-4 flex-row-reverse",
      )}
    >
      <Handle
        type={type}
        position={position}
        id={port.id}
        className="!relative !top-0 !transform-none transition-transform hover:scale-125"
        style={{
          background: color,
          width: isExecution ? 10 : 8,
          height: isExecution ? 10 : 8,
          border: `2px solid var(--background)`,
          borderRadius: isExecution ? 2 : "50%",
        }}
      />
      <span className="text-xs text-muted-foreground">{port.label}</span>
    </div>
  );
}

function BaseNodeComponent({ data, definition, selected }: BaseNodeProps) {
  const { inputs, outputs, category, label } = definition;
  const displayLabel = data.label ?? label;
  const isActive = data.isActive ?? false;

  // Pair up inputs and outputs for aligned rows
  const maxPorts = Math.max(inputs.length, outputs.length);
  const rows = Array.from({ length: maxPorts }, (_, i) => ({
    input: inputs[i],
    output: outputs[i],
  }));

  return (
    <div
      className={cn(
        "min-w-[160px] rounded-lg border-2 border-border bg-card shadow-md",
        "border-l-4",
        CATEGORY_COLORS[category],
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isActive &&
          "ring-2 ring-green-500 ring-offset-2 ring-offset-background",
      )}
    >
      {/* Header */}
      <div className="border-b border-border/50 px-3 py-2">
        <span className="text-sm font-medium">{displayLabel}</span>
      </div>

      {/* Ports */}
      {rows.length > 0 && (
        <div className="px-1 py-1">
          {rows.map((row) => (
            <div
              key={`${row.input?.id ?? "empty"}-${row.output?.id ?? "empty"}`}
              className="flex items-center justify-between"
            >
              {/* Input port */}
              {row.input ? (
                <PortRow
                  port={row.input}
                  type="target"
                  position={Position.Left}
                />
              ) : (
                <div />
              )}

              {/* Output port */}
              {row.output ? (
                <PortRow
                  port={row.output}
                  type="source"
                  position={Position.Right}
                />
              ) : (
                <div />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Create a memoized version for better performance
export const BaseNode = memo(BaseNodeComponent);

// Factory function to create node components from definitions
export function createNodeComponent(definition: NodeDefinition) {
  const NodeComponent = (props: NodeProps) => (
    <BaseNode
      {...props}
      definition={definition}
      data={props.data as BaseNodeData}
    />
  );
  NodeComponent.displayName = `${definition.type}Node`;
  return memo(NodeComponent);
}
