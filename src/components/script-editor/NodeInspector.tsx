import { useMemo } from "react";
import { useTranslation } from "react-i18next";
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
import { useNodeTypes } from "./NodeTypesContext";
import type { PortType } from "./nodes/types.ts";
import { useNodeTranslations } from "./useNodeTranslations";

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
  labelKey: string; // Translation key for label
  type: "number" | "string" | "boolean" | "select" | "textarea";
  options?: { value: string; labelKey: string }[]; // Translation key for option labels
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

// Field configurations for node types (keys must match node type names exactly)
// Labels use translation keys that will be resolved at render time
const NODE_FIELD_CONFIGS: Record<string, FieldConfig[]> = {
  // Trigger nodes
  "trigger.on_interval": [
    {
      key: "interval",
      labelKey: "interval",
      type: "number",
      placeholder: "1000",
      min: 100,
      step: 100,
    },
  ],

  // Math nodes
  "math.random": [
    {
      key: "min",
      labelKey: "min",
      type: "number",
      placeholder: "0",
    },
    {
      key: "max",
      labelKey: "max",
      type: "number",
      placeholder: "100",
    },
  ],
  "math.formula": [
    {
      key: "formula",
      labelKey: "formula",
      type: "textarea",
      placeholder: "a + b * 2",
    },
  ],
  "math.bspline": [
    {
      key: "degree",
      labelKey: "degree",
      type: "number",
      placeholder: "3",
      min: 1,
      max: 10,
    },
  ],

  // Logic nodes
  "logic.compare": [
    {
      key: "operator",
      labelKey: "operator",
      type: "select",
      options: [
        { value: "==", labelKey: "operatorEqual" },
        { value: "!=", labelKey: "operatorNotEqual" },
        { value: "<", labelKey: "operatorLess" },
        { value: "<=", labelKey: "operatorLessEqual" },
        { value: ">", labelKey: "operatorGreater" },
        { value: ">=", labelKey: "operatorGreaterEqual" },
      ],
    },
  ],

  // Action nodes
  "action.set_rotation": [
    {
      key: "smooth",
      labelKey: "smooth",
      type: "boolean",
    },
  ],
  "action.look_at": [
    {
      key: "smooth",
      labelKey: "smooth",
      type: "boolean",
    },
  ],
  "action.sneak": [
    {
      key: "enabled",
      labelKey: "enabled",
      type: "boolean",
    },
  ],
  "action.sprint": [
    {
      key: "enabled",
      labelKey: "enabled",
      type: "boolean",
    },
  ],
  "action.use_item": [
    {
      key: "hand",
      labelKey: "hand",
      type: "select",
      options: [
        { value: "main", labelKey: "handMain" },
        { value: "off", labelKey: "handOff" },
      ],
    },
  ],
  "action.place_block": [
    {
      key: "face",
      labelKey: "face",
      type: "select",
      options: [
        { value: "up", labelKey: "faceUp" },
        { value: "down", labelKey: "faceDown" },
        { value: "north", labelKey: "faceNorth" },
        { value: "south", labelKey: "faceSouth" },
        { value: "east", labelKey: "faceEast" },
        { value: "west", labelKey: "faceWest" },
      ],
    },
  ],
  "action.select_slot": [
    {
      key: "slot",
      labelKey: "slot",
      type: "number",
      placeholder: "0",
      min: 0,
      max: 8,
    },
  ],
  "action.wait": [
    {
      key: "ticks",
      labelKey: "ticks",
      type: "number",
      placeholder: "20",
      min: 1,
    },
  ],
  "action.print": [
    {
      key: "level",
      labelKey: "level",
      type: "select",
      options: [
        { value: "debug", labelKey: "levelDebug" },
        { value: "info", labelKey: "levelInfo" },
        { value: "warn", labelKey: "levelWarn" },
        { value: "error", labelKey: "levelError" },
      ],
    },
  ],
  "action.set_variable": [
    {
      key: "variableName",
      labelKey: "variableName",
      type: "string",
      placeholder: "myVar",
    },
  ],

  // Data nodes
  "data.find_entity": [
    {
      key: "range",
      labelKey: "range",
      type: "number",
      placeholder: "16",
      min: 1,
    },
  ],
  "data.find_block": [
    {
      key: "range",
      labelKey: "range",
      type: "number",
      placeholder: "32",
      min: 1,
    },
  ],
  "data.get_variable": [
    {
      key: "variableName",
      labelKey: "variableName",
      type: "string",
      placeholder: "myVar",
    },
  ],

  // Constant nodes
  "constant.number": [
    {
      key: "value",
      labelKey: "value",
      type: "number",
      placeholder: "0",
    },
  ],
  "constant.string": [
    {
      key: "value",
      labelKey: "value",
      type: "textarea",
      placeholder: "Enter text...",
    },
  ],
  "constant.boolean": [
    {
      key: "value",
      labelKey: "value",
      type: "boolean",
    },
  ],
  "constant.vector3": [
    {
      key: "x",
      labelKey: "x",
      type: "number",
      placeholder: "0",
    },
    {
      key: "y",
      labelKey: "y",
      type: "number",
      placeholder: "0",
    },
    {
      key: "z",
      labelKey: "z",
      type: "number",
      placeholder: "0",
    },
  ],

  // Flow control nodes
  "flow.loop": [
    {
      key: "count",
      labelKey: "loopCount",
      type: "number",
      placeholder: "10",
      min: 1,
    },
  ],
  "flow.gate": [
    {
      key: "open",
      labelKey: "open",
      type: "boolean",
    },
  ],
  "flow.debounce": [
    {
      key: "delay",
      labelKey: "delay",
      type: "number",
      placeholder: "100",
      min: 0,
      step: 10,
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
    case "block":
      return "text-cyan-500";
    case "item":
      return "text-pink-500";
    case "list":
      return "text-violet-500";
    case "any":
      return "text-gray-500";
    default:
      return "text-muted-foreground";
  }
}

interface FieldRendererProps {
  field: FieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  getFieldLabel: (key: string) => string;
  selectPlaceholder: string;
}

function FieldRenderer({
  field,
  value,
  onChange,
  getFieldLabel,
  selectPlaceholder,
}: FieldRendererProps) {
  const id = `field-${field.key}`;
  const label = getFieldLabel(field.labelKey);

  switch (field.type) {
    case "number":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{label}</Label>
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
          <Label htmlFor={id}>{label}</Label>
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
          <Label htmlFor={id}>{label}</Label>
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
          <Label htmlFor={id}>{label}</Label>
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
          <Label htmlFor={id}>{label}</Label>
          <Select
            value={(value as string) ?? field.options?.[0]?.value}
            onValueChange={onChange}
          >
            <SelectTrigger id={id} className="w-full">
              <SelectValue placeholder={selectPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {getFieldLabel(option.labelKey)}
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
  const { t } = useTranslation("instance");
  const { getNodeLabel, getFieldLabel, getPortLabel } = useNodeTranslations();
  const { getDefinition } = useNodeTypes();

  const nodeDefinition = useMemo(() => {
    if (!selectedNode) return null;
    return getDefinition(selectedNode.type);
  }, [selectedNode, getDefinition]);

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
          <h2 className="text-sm font-semibold">
            {t("scripts.editor.inspector.title")}
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-center text-sm text-muted-foreground">
            {t("scripts.editor.inspector.noSelection")}
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
        <h2 className="text-sm font-semibold">
          {t("scripts.editor.inspector.title")}
        </h2>
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
                  {getNodeLabel(nodeDefinition)}
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
            <Label className="text-xs text-muted-foreground">
              {t("scripts.editor.inspector.nodeId")}
            </Label>
            <code className="block rounded bg-muted px-2 py-1 text-xs">
              {selectedNode.id}
            </code>
          </div>

          {/* Editable Fields */}
          {fieldConfigs.length > 0 && (
            <Card size="sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("scripts.editor.inspector.properties")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {fieldConfigs.map((field) => (
                  <FieldRenderer
                    key={field.key}
                    field={field}
                    value={selectedNode.data[field.key]}
                    onChange={(value) => handleFieldChange(field.key, value)}
                    getFieldLabel={getFieldLabel}
                    selectPlaceholder={t(
                      "scripts.editor.inspector.selectPlaceholder",
                    )}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Inputs */}
          {nodeDefinition.inputs.length > 0 && (
            <Card size="sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("scripts.editor.inspector.inputs")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1">
                  {nodeDefinition.inputs.map((port) => (
                    <li
                      key={port.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span>{getPortLabel(port.id, port.label)}</span>
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
                <CardTitle className="text-sm">
                  {t("scripts.editor.inspector.outputs")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1">
                  {nodeDefinition.outputs.map((port) => (
                    <li
                      key={port.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span>{getPortLabel(port.id, port.label)}</span>
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
