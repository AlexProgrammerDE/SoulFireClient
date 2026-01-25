import { useMemo } from "react";
import DynamicIcon from "@/components/dynamic-icon.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { cn } from "@/lib/utils.tsx";
import { getNodeDefinition } from "./nodes";
import type { PortType } from "./nodes/types.ts";

interface ScriptNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

interface NodeInspectorProps {
  selectedNode: ScriptNode | null;
  onNodeDataChange?: (nodeId: string, data: Record<string, unknown>) => void;
  className?: string;
}

interface FieldConfig {
  key: string;
  label: string;
  type: "number" | "string" | "boolean" | "select" | "textarea";
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

// Field configurations for node types
const NODE_FIELD_CONFIGS: Record<string, FieldConfig[]> = {
  "on-interval": [
    {
      key: "interval",
      label: "Interval (ms)",
      type: "number",
      placeholder: "1000",
      min: 100,
      step: 100,
    },
  ],
  "on-event": [
    {
      key: "eventType",
      label: "Event Type",
      type: "select",
      options: [
        { value: "player-join", label: "Player Join" },
        { value: "player-leave", label: "Player Leave" },
        { value: "chat-message", label: "Chat Message" },
        { value: "block-break", label: "Block Break" },
        { value: "block-place", label: "Block Place" },
        { value: "entity-spawn", label: "Entity Spawn" },
        { value: "damage", label: "Damage Received" },
      ],
    },
  ],
  random: [
    {
      key: "min",
      label: "Min",
      type: "number",
      placeholder: "0",
    },
    {
      key: "max",
      label: "Max",
      type: "number",
      placeholder: "100",
    },
  ],
  formula: [
    {
      key: "formula",
      label: "Formula",
      type: "textarea",
      placeholder: "x + y",
    },
  ],
  compare: [
    {
      key: "operator",
      label: "Operator",
      type: "select",
      options: [
        { value: "==", label: "Equal (==)" },
        { value: "!=", label: "Not Equal (!=)" },
        { value: "<", label: "Less Than (<)" },
        { value: "<=", label: "Less or Equal (<=)" },
        { value: ">", label: "Greater Than (>)" },
        { value: ">=", label: "Greater or Equal (>=)" },
      ],
    },
  ],
  log: [
    {
      key: "level",
      label: "Log Level",
      type: "select",
      options: [
        { value: "debug", label: "Debug" },
        { value: "info", label: "Info" },
        { value: "warn", label: "Warning" },
        { value: "error", label: "Error" },
      ],
    },
  ],
  wait: [
    {
      key: "duration",
      label: "Duration (ms)",
      type: "number",
      placeholder: "1000",
      min: 0,
      step: 100,
    },
  ],
  number: [
    {
      key: "value",
      label: "Value",
      type: "number",
      placeholder: "0",
    },
  ],
  string: [
    {
      key: "value",
      label: "Value",
      type: "textarea",
      placeholder: "Enter text...",
    },
  ],
  boolean: [
    {
      key: "value",
      label: "Value",
      type: "boolean",
    },
  ],
  "get-variable": [
    {
      key: "variableName",
      label: "Variable Name",
      type: "string",
      placeholder: "myVariable",
    },
  ],
  "set-variable": [
    {
      key: "variableName",
      label: "Variable Name",
      type: "string",
      placeholder: "myVariable",
    },
  ],
  loop: [
    {
      key: "count",
      label: "Loop Count",
      type: "number",
      placeholder: "10",
      min: 1,
    },
  ],
};

function getPortTypeColor(type: PortType): string {
  switch (type) {
    case "execution":
      return "text-white";
    case "number":
      return "text-green-500";
    case "boolean":
      return "text-red-500";
    case "string":
      return "text-yellow-500";
    case "vector3":
      return "text-blue-500";
    case "entity":
      return "text-purple-500";
    case "bot":
      return "text-orange-500";
    default:
      return "text-muted-foreground";
  }
}

interface FieldRendererProps {
  field: FieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}

function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const id = `field-${field.key}`;

  switch (field.type) {
    case "number":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Input
            id={id}
            type="number"
            value={(value as number) ?? ""}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        </div>
      );

    case "string":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Input
            id={id}
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        </div>
      );

    case "textarea":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Textarea
            id={id}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="min-h-20 resize-none font-mono text-xs"
          />
        </div>
      );

    case "boolean":
      return (
        <div className="flex items-center justify-between">
          <Label htmlFor={id}>{field.label}</Label>
          <Switch
            id={id}
            checked={(value as boolean) ?? false}
            onCheckedChange={onChange}
          />
        </div>
      );

    case "select":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Select
            value={(value as string) ?? field.options?.[0]?.value}
            onValueChange={onChange}
          >
            <SelectTrigger id={id} className="w-full">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    default:
      return null;
  }
}

export function NodeInspector({
  selectedNode,
  onNodeDataChange,
  className,
}: NodeInspectorProps) {
  const nodeDefinition = useMemo(() => {
    if (!selectedNode) return null;
    return getNodeDefinition(selectedNode.type);
  }, [selectedNode]);

  const fieldConfigs = useMemo(() => {
    if (!selectedNode) return [];
    return NODE_FIELD_CONFIGS[selectedNode.type] ?? [];
  }, [selectedNode]);

  const handleFieldChange = (key: string, value: unknown) => {
    if (!selectedNode || !onNodeDataChange) return;
    onNodeDataChange(selectedNode.id, {
      ...selectedNode.data,
      [key]: value,
    });
  };

  if (!selectedNode || !nodeDefinition) {
    return (
      <div
        className={cn(
          "flex h-full flex-col border-l border-border bg-card",
          className,
        )}
      >
        <div className="border-b border-border p-3">
          <h2 className="text-sm font-semibold">Node Inspector</h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-center text-sm text-muted-foreground">
            Select a node to view its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col border-l border-border bg-card",
        className,
      )}
    >
      <div className="border-b border-border p-3">
        <h2 className="text-sm font-semibold">Node Inspector</h2>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-3">
          {/* Node Header */}
          <Card size="sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <DynamicIcon
                  name={nodeDefinition.icon}
                  className="size-5 shrink-0"
                />
                <CardTitle className="text-base">
                  {nodeDefinition.label}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {nodeDefinition.type}
              </p>
            </CardContent>
          </Card>

          {/* Node ID */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Node ID</Label>
            <code className="block rounded bg-muted px-2 py-1 text-xs">
              {selectedNode.id}
            </code>
          </div>

          {/* Editable Fields */}
          {fieldConfigs.length > 0 && (
            <Card size="sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Properties</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {fieldConfigs.map((field) => (
                  <FieldRenderer
                    key={field.key}
                    field={field}
                    value={selectedNode.data[field.key]}
                    onChange={(value) => handleFieldChange(field.key, value)}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Inputs */}
          {nodeDefinition.inputs.length > 0 && (
            <Card size="sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Inputs</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1">
                  {nodeDefinition.inputs.map((port) => (
                    <li
                      key={port.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span>{port.label}</span>
                      <span
                        className={cn("font-mono", getPortTypeColor(port.type))}
                      >
                        {port.type}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Outputs */}
          {nodeDefinition.outputs.length > 0 && (
            <Card size="sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Outputs</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1">
                  {nodeDefinition.outputs.map((port) => (
                    <li
                      key={port.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span>{port.label}</span>
                      <span
                        className={cn("font-mono", getPortTypeColor(port.type))}
                      >
                        {port.type}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
