export type PortType =
  | "execution"
  | "number"
  | "boolean"
  | "string"
  | "vector3"
  | "entity"
  | "bot"
  | "any";

export interface PortDefinition {
  id: string;
  label: string;
  type: PortType;
}

export interface NodeDefinition {
  type: string;
  label: string;
  category: "trigger" | "math" | "logic" | "action" | "data" | "flow";
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  defaultData?: Record<string, unknown>;
}

export const PORT_COLORS: Record<PortType, string> = {
  execution: "#ffffff",
  number: "#22c55e",
  boolean: "#ef4444",
  string: "#eab308",
  vector3: "#3b82f6",
  entity: "#a855f7",
  bot: "#f97316",
  any: "#6b7280",
};

export const CATEGORY_COLORS: Record<NodeDefinition["category"], string> = {
  trigger: "border-l-purple-500",
  math: "border-l-green-500",
  logic: "border-l-red-500",
  action: "border-l-blue-500",
  data: "border-l-yellow-500",
  flow: "border-l-orange-500",
};

export const CATEGORY_LABELS: Record<NodeDefinition["category"], string> = {
  trigger: "Trigger",
  math: "Math",
  logic: "Logic",
  action: "Action",
  data: "Data",
  flow: "Flow Control",
};
