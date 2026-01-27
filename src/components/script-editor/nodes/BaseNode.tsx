import { Handle, type NodeProps, Position } from "@xyflow/react";
import { ChevronDown, ChevronRight } from "lucide-react";
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
  /** Whether this node is muted (bypassed during execution) */
  muted?: boolean;
  /** Whether this node is collapsed (showing only header) */
  collapsed?: boolean;
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
  collapsed,
}: {
  port: PortDefinition;
  type: "source" | "target";
  position: Position;
  translatedLabel: string;
  collapsed?: boolean;
}) {
  const color = getPortColor(port.type);
  const isExecution = port.type === "execution";
  const isMultiInput = port.multiInput;
  const isLeft = position === Position.Left;

  // When collapsed, render handles at the edges without labels
  if (collapsed) {
    return (
      <Handle
        type={type}
        position={position}
        id={port.id}
        className="!absolute transition-transform hover:scale-125"
        style={{
          background: color,
          width: isMultiInput ? 16 : isExecution ? 10 : 8,
          height: isExecution ? 10 : 8,
          border: "2px solid var(--background)",
          borderRadius: isMultiInput ? 4 : isExecution ? 2 : "50%",
          top: "50%",
          transform: "translateY(-50%)",
          ...(isLeft ? { left: -4 } : { right: -4 }),
        }}
      />
    );
  }

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
          // Multi-input sockets are pill-shaped (wider)
          width: isMultiInput ? 16 : isExecution ? 10 : 8,
          height: isExecution ? 10 : 8,
          border: "2px solid var(--background)",
          // Multi-input has rounded corners, execution is square-ish, data is circle
          borderRadius: isMultiInput ? 4 : isExecution ? 2 : "50%",
        }}
        title={
          isMultiInput ? "Multi-input: accepts multiple connections" : undefined
        }
      />
      <span className="text-xs text-muted-foreground">{translatedLabel}</span>
    </div>
  );
}

function BaseNodeComponent({ data, definition, selected }: BaseNodeProps) {
  const { t } = useTranslation("instance");
  const { inputs, outputs, type, label, color, supportsMuting } = definition;

  // Get translated label, fall back to definition label
  const translationKey = `scripts.editor.nodes.${type}.label`;
  const translatedLabel = t(translationKey);
  const displayLabel =
    data.label ??
    (translatedLabel !== translationKey ? translatedLabel : label);
  const isActive = data.isActive ?? false;
  const isMuted = data.muted ?? false;
  const isCollapsed = data.collapsed ?? false;

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
        isMuted && "opacity-50 grayscale",
      )}
      style={borderStyle}
    >
      {/* Header */}
      <div
        className={cn(
          "px-3 py-2 flex items-center gap-2",
          !isCollapsed && "border-b border-border/50",
        )}
      >
        {/* Collapse indicator */}
        {rows.length > 0 && (
          <span className="text-muted-foreground">
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </span>
        )}
        <span className={cn("text-sm font-medium", isMuted && "line-through")}>
          {displayLabel}
        </span>
        {isMuted && supportsMuting && (
          <span className="text-xs text-muted-foreground">(muted)</span>
        )}
      </div>

      {/* Ports - hidden when collapsed, but still render handles */}
      {isCollapsed ? (
        // When collapsed, render handles positioned at edges
        <div className="relative h-4">
          {inputs.map((input) => (
            <PortRow
              key={input.id}
              port={input}
              type="target"
              position={Position.Left}
              translatedLabel=""
              collapsed
            />
          ))}
          {outputs.map((output) => (
            <PortRow
              key={output.id}
              port={output}
              type="source"
              position={Position.Right}
              translatedLabel=""
              collapsed
            />
          ))}
        </div>
      ) : (
        rows.length > 0 && (
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
        )
      )}

      {/* Muted pass-through indicator */}
      {isMuted && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="h-0.5 w-full bg-red-500/50" />
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
