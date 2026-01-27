import { memo } from "react";
import { cn } from "@/lib/utils";
import type { PortType } from "./types";

interface InlineEditorProps {
  type: PortType;
  value: unknown;
  defaultValue: unknown;
  onChange: (value: unknown) => void;
  className?: string;
}

/**
 * Inline editor component for node port values.
 * Renders different input types based on port type.
 * Used directly on nodes for Blender-style inline editing.
 */
function InlineEditorComponent({
  type,
  value,
  defaultValue,
  onChange,
  className,
}: InlineEditorProps) {
  // Use value if defined, otherwise fall back to default
  const currentValue = value ?? defaultValue;

  // Common input props to prevent node dragging/selection when editing
  const inputProps = {
    className: cn(
      "nodrag nopan bg-muted/80 text-foreground border border-border/50 rounded px-1.5 py-0.5 text-xs",
      "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
      "hover:border-border",
      className,
    ),
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
  };

  switch (type) {
    case "number":
      return (
        <input
          type="number"
          value={(currentValue as number) ?? 0}
          onChange={(e) => {
            const num = parseFloat(e.target.value);
            onChange(Number.isNaN(num) ? 0 : num);
          }}
          {...inputProps}
          className={cn(inputProps.className, "w-16 text-right")}
        />
      );

    case "string":
      return (
        <input
          type="text"
          value={(currentValue as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="..."
          {...inputProps}
          className={cn(inputProps.className, "w-24")}
        />
      );

    case "boolean":
      return (
        <input
          type="checkbox"
          checked={(currentValue as boolean) ?? false}
          onChange={(e) => onChange(e.target.checked)}
          {...inputProps}
          className={cn(
            "nodrag nopan w-4 h-4 rounded border-border accent-primary cursor-pointer",
          )}
        />
      );

    case "vector3":
      // Vector3 is typically handled as separate x, y, z fields
      // For inline, we just show a compact number input
      return (
        <input
          type="number"
          value={(currentValue as number) ?? 0}
          onChange={(e) => {
            const num = parseFloat(e.target.value);
            onChange(Number.isNaN(num) ? 0 : num);
          }}
          {...inputProps}
          className={cn(inputProps.className, "w-14 text-right")}
        />
      );

    default:
      // For other types (entity, bot, block, item, list, any), show as text
      return (
        <input
          type="text"
          value={String(currentValue ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder="..."
          {...inputProps}
          className={cn(inputProps.className, "w-20")}
        />
      );
  }
}

export const InlineEditor = memo(InlineEditorComponent);

/**
 * Vector3 inline editor with x, y, z fields
 */
interface Vector3EditorProps {
  value: { x?: number; y?: number; z?: number } | undefined;
  defaultValue: { x?: number; y?: number; z?: number } | undefined;
  onChange: (value: { x: number; y: number; z: number }) => void;
}

function Vector3EditorComponent({
  value,
  defaultValue,
  onChange,
}: Vector3EditorProps) {
  const current = value ?? defaultValue ?? { x: 0, y: 0, z: 0 };

  const inputProps = {
    className: cn(
      "nodrag nopan bg-muted/80 text-foreground border border-border/50 rounded px-1 py-0.5 text-xs w-10 text-right",
      "focus:outline-none focus:ring-1 focus:ring-primary",
    ),
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
  };

  const handleChange = (axis: "x" | "y" | "z", val: string) => {
    const num = parseFloat(val);
    onChange({
      x: current.x ?? 0,
      y: current.y ?? 0,
      z: current.z ?? 0,
      [axis]: Number.isNaN(num) ? 0 : num,
    });
  };

  return (
    <div className="flex items-center gap-0.5">
      <input
        type="number"
        value={current.x ?? 0}
        onChange={(e) => handleChange("x", e.target.value)}
        {...inputProps}
      />
      <input
        type="number"
        value={current.y ?? 0}
        onChange={(e) => handleChange("y", e.target.value)}
        {...inputProps}
      />
      <input
        type="number"
        value={current.z ?? 0}
        onChange={(e) => handleChange("z", e.target.value)}
        {...inputProps}
      />
    </div>
  );
}

export const Vector3Editor = memo(Vector3EditorComponent);

/**
 * Dropdown select editor for ports with predefined options
 */
interface SelectEditorProps {
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function SelectEditorComponent({
  value,
  options,
  onChange,
}: SelectEditorProps) {
  const inputProps = {
    className: cn(
      "nodrag nopan bg-muted/80 text-foreground border border-border/50 rounded px-1.5 py-0.5 text-xs",
      "focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer",
    ),
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
  };

  return (
    <select
      value={value ?? options[0]?.value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      {...inputProps}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export const SelectEditor = memo(SelectEditorComponent);
