import { Handle, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  getPortColor,
  type NodeDefinition,
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
  translatedLabel,
}: {
  port: PortDefinition;
  type: "source" | "target";
  position: Position;
  translatedLabel: string;
}) {
  const color = getPortColor(port.type);
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
          border: "2px solid var(--background)",
          borderRadius: isExecution ? 2 : "50%",
        }}
      />
      <span className="text-xs text-muted-foreground">{translatedLabel}</span>
    </div>
  );
}

function BaseNodeComponent({ data, definition, selected }: BaseNodeProps) {
  const { t } = useTranslation("instance");
  const { inputs, outputs, type, label, color } = definition;

  // Get translated label, fall back to definition label
  const translationKey = `scripts.editor.nodes.${type}.label`;
  const translatedLabel = t(translationKey);
  const displayLabel =
    data.label ??
    (translatedLabel !== translationKey ? translatedLabel : label);
  const isActive = data.isActive ?? false;

  // Helper to get translated port label
  const getPortLabel = (port: PortDefinition): string => {
    // Try specific port translation
    const parts = port.id.split("-");
    const portName = parts.length > 1 ? parts.slice(1).join("-") : port.id;
    const portKey = `scripts.editor.ports.${portName}`;
    const translated = t(portKey);
    return translated !== portKey ? translated : port.label;
  };

  // Pair up inputs and outputs for aligned rows
  const maxPorts = Math.max(inputs.length, outputs.length);
  const rows = Array.from({ length: maxPorts }, (_, i) => ({
    input: inputs[i],
    output: outputs[i],
  }));

  // Use node color from server, or fall back to default gray
  const borderStyle = color ? { borderLeftColor: color } : undefined;
  const borderClass = color ? "" : "border-l-gray-500";

  return (
    <div
      className={cn(
        "min-w-[160px] rounded-lg border-2 border-border bg-card shadow-md",
        "border-l-4",
        borderClass,
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isActive &&
          "ring-2 ring-green-500 ring-offset-2 ring-offset-background",
      )}
      style={borderStyle}
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
                  translatedLabel={getPortLabel(row.input)}
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
                  translatedLabel={getPortLabel(row.output)}
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
