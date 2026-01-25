export type PortType =
  | "execution"
  | "number"
  | "boolean"
  | "string"
  | "vector3"
  | "entity"
  | "bot"
  | "any";

export type NodeCategory =
  | "trigger"
  | "math"
  | "logic"
  | "action"
  | "data"
  | "flow";

export interface PortDefinition {
  id: string;
  label: string;
  type: PortType;
}

export interface NodeDefinition {
  type: string;
  label: string;
  category: NodeCategory;
  icon: string;
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

export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  trigger: "Trigger",
  math: "Math",
  logic: "Logic",
  action: "Action",
  data: "Data",
  flow: "Flow Control",
};

export const CATEGORY_INFO: Record<
  NodeCategory,
  { name: string; icon: string; description: string }
> = {
  trigger: {
    name: "Triggers",
    icon: "Zap",
    description: "Events that start script execution",
  },
  math: {
    name: "Math",
    icon: "Calculator",
    description: "Mathematical operations",
  },
  logic: {
    name: "Logic",
    icon: "GitBranch",
    description: "Boolean logic operations",
  },
  action: {
    name: "Actions",
    icon: "Play",
    description: "Actions the bot can perform",
  },
  data: {
    name: "Data",
    icon: "Database",
    description: "Data values and variables",
  },
  flow: {
    name: "Flow Control",
    icon: "Workflow",
    description: "Control script execution flow",
  },
};

// Helper to get nodes by category from definitions record
export function getNodesByCategory(
  definitions: Record<string, NodeDefinition>,
  category: NodeCategory,
): NodeDefinition[] {
  return Object.values(definitions).filter((def) => def.category === category);
}
