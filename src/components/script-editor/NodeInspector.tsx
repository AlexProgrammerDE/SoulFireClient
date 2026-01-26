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
import { Switch } from "@/components/ui/switch.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { cn } from "@/lib/utils.tsx";
import { useNodeTypes } from "./NodeTypesContext";
import {
  getPortColor,
  type NodeDefinition,
  type PortDefinition,
  type PortType,
} from "./nodes/types";
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

/**
 * Derive editable field info from a port definition.
 * Only ports with defaultValue are considered editable.
 */
interface EditableField {
  key: string;
  label: string;
  portType: PortType;
  defaultValue: unknown;
  description?: string;
}

function getEditableFields(definition: NodeDefinition): EditableField[] {
  const fields: EditableField[] = [];

  for (const input of definition.inputs) {
    // Skip execution ports - they're not data fields
    if (input.type === "execution") continue;

    // Only include ports that have a default value (meaning they're configurable)
    if (input.defaultValue !== undefined) {
      // Extract field key from port id (e.g., "number-interval" -> "interval")
      const key = input.id.includes("-")
        ? input.id.split("-").slice(1).join("-")
        : input.id;

      // Parse the default value
      let defaultValue: unknown;
      try {
        defaultValue = JSON.parse(input.defaultValue);
      } catch {
        defaultValue = input.defaultValue;
      }

      fields.push({
        key,
        label: input.label,
        portType: input.type,
        defaultValue,
        description: input.description,
      });
    }
  }

  return fields;
}

interface FieldEditorProps {
  field: EditableField;
  value: unknown;
  onChange: (value: unknown) => void;
}

function FieldEditor({ field, value, onChange }: FieldEditorProps) {
  const id = `field-${field.key}`;

  // Determine the actual value (use current value or default)
  const currentValue = value ?? field.defaultValue;

  switch (field.portType) {
    case "number":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Input
            id={id}
            type="number"
            value={(currentValue as number) ?? ""}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              onChange(Number.isNaN(num) ? 0 : num);
            }}
            placeholder={String(field.defaultValue ?? "")}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      );

    case "string": {
      // Use textarea for longer strings, input for shorter ones
      const isLongText =
        typeof field.defaultValue === "string" &&
        (field.defaultValue.length > 30 || field.defaultValue.includes("\n"));

      if (isLongText) {
        return (
          <div className="space-y-1.5">
            <Label htmlFor={id}>{field.label}</Label>
            <Textarea
              id={id}
              value={(currentValue as string) ?? ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={String(field.defaultValue ?? "")}
              className="min-h-20 resize-none font-mono text-xs"
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            )}
          </div>
        );
      }

      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Input
            id={id}
            type="text"
            value={(currentValue as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={String(field.defaultValue ?? "")}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      );
    }

    case "boolean":
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor={id}>{field.label}</Label>
            <Switch
              id={id}
              checked={(currentValue as boolean) ?? false}
              onCheckedChange={onChange}
            />
          </div>
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      );

    case "vector3":
      // Vector3 fields are typically split into x, y, z
      // This handles a single component; the full vector is usually 3 separate fields
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Input
            id={id}
            type="number"
            value={(currentValue as number) ?? ""}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              onChange(Number.isNaN(num) ? 0 : num);
            }}
            placeholder={String(field.defaultValue ?? "0")}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      );

    default:
      // For other types (entity, bot, block, item, list, any), show as text input
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Input
            id={id}
            type="text"
            value={String(currentValue ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={String(field.defaultValue ?? "")}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      );
  }
}

interface PortListItemProps {
  port: PortDefinition;
  portLabel: string;
}

function PortListItem({ port, portLabel }: PortListItemProps) {
  const color = getPortColor(port.type);

  return (
    <li className="flex items-center justify-between text-xs">
      <span>{portLabel}</span>
      <span className="font-mono" style={{ color }}>
        {port.type}
      </span>
    </li>
  );
}

export function NodeInspector({
  selectedNode,
  onNodeDataChange,
  className,
}: NodeInspectorProps) {
  const { t } = useTranslation("instance");
  const { getNodeLabel, getPortLabel } = useNodeTranslations();
  const { getDefinition } = useNodeTypes();

  const nodeDefinition = useMemo(() => {
    if (!selectedNode) return null;
    return getDefinition(selectedNode.type);
  }, [selectedNode, getDefinition]);

  // Derive editable fields from port definitions
  const editableFields = useMemo(() => {
    if (!nodeDefinition) return [];
    return getEditableFields(nodeDefinition);
  }, [nodeDefinition]);

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
              {nodeDefinition.description && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {nodeDefinition.description}
                </p>
              )}
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

          {/* Editable Fields (derived from port definitions) */}
          {editableFields.length > 0 && (
            <Card size="sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("scripts.editor.inspector.properties")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {editableFields.map((field) => (
                  <FieldEditor
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
                <CardTitle className="text-sm">
                  {t("scripts.editor.inspector.inputs")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1">
                  {nodeDefinition.inputs.map((port) => (
                    <PortListItem
                      key={port.id}
                      port={port}
                      portLabel={getPortLabel(port.id, port.label)}
                    />
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
                    <PortListItem
                      key={port.id}
                      port={port}
                      portLabel={getPortLabel(port.id, port.label)}
                    />
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
