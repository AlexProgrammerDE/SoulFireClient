import { Handle, type NodeProps, Position } from "@xyflow/react";
import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function NodeHandle({
  port,
  type,
  position,
  index,
}: {
  port: PortDefinition;
  type: "source" | "target";
  position: Position;
  index: number;
}) {
  const color = PORT_COLORS[port.type];
  const isExecution = port.type === "execution";

  // Calculate vertical position for handle
  // Header is ~40px, content starts after, each port row is ~24px
  const headerOffset = 44;
  const portHeight = 24;
  const topOffset = headerOffset + index * portHeight + portHeight / 2;

  return (
    <Handle
      type={type}
      position={position}
      id={port.id}
      style={{
        top: `${topOffset}px`,
        background: color,
        width: isExecution ? 12 : 10,
        height: isExecution ? 12 : 10,
        border: "2px solid hsl(var(--background))",
        borderRadius: isExecution ? 2 : "50%",
      }}
      className="transition-transform hover:scale-125"
    />
  );
}

function PortLabel({
  port,
  align,
}: {
  port: PortDefinition;
  align: "left" | "right";
}) {
  const color = PORT_COLORS[port.type];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs",
        align === "right" && "flex-row-reverse",
      )}
    >
      <div
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-muted-foreground">{port.label}</span>
    </div>
  );
}

function BaseNodeComponent({ data, definition, selected }: BaseNodeProps) {
  const { inputs, outputs, category, label } = definition;
  const displayLabel = data.label ?? label;
  const isActive = data.isActive ?? false;

  const _maxPorts = useMemo(
    () => Math.max(inputs.length, outputs.length),
    [inputs.length, outputs.length],
  );

  return (
    <Card
      size="sm"
      className={cn(
        "min-w-[180px] border-l-4 transition-all",
        CATEGORY_COLORS[category],
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isActive &&
          "ring-2 ring-green-500 ring-offset-2 ring-offset-background",
      )}
    >
      <CardHeader className="border-b border-border/50 px-3 py-2">
        <CardTitle className="text-sm font-medium">{displayLabel}</CardTitle>
      </CardHeader>

      <CardContent className="px-3 py-2">
        <div className="flex justify-between gap-4">
          {/* Input ports */}
          <div className="flex flex-col gap-1">
            {inputs.map((port) => (
              <PortLabel key={port.id} port={port} align="left" />
            ))}
          </div>

          {/* Output ports */}
          <div className="flex flex-col gap-1">
            {outputs.map((port) => (
              <PortLabel key={port.id} port={port} align="right" />
            ))}
          </div>
        </div>
      </CardContent>

      {/* Input handles */}
      {inputs.map((port, index) => (
        <NodeHandle
          key={port.id}
          port={port}
          type="target"
          position={Position.Left}
          index={index}
        />
      ))}

      {/* Output handles */}
      {outputs.map((port, index) => (
        <NodeHandle
          key={port.id}
          port={port}
          type="source"
          position={Position.Right}
          index={index}
        />
      ))}
    </Card>
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
