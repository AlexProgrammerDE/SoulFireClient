import {
  type NodeTypeDefinition as ProtoNodeTypeDefinition,
  type PortDefinition as ProtoPortDefinition,
  PortType as ProtoPortType,
} from "@/generated/soulfire/script";

export type PortType =
  | "execution"
  | "number"
  | "boolean"
  | "string"
  | "vector3"
  | "entity"
  | "bot"
  | "block"
  | "item"
  | "list"
  | "any";

export type NodeCategory = string;

export interface PortDefinition {
  id: string;
  label: string;
  type: PortType;
  required?: boolean;
  defaultValue?: string;
  description?: string;
  elementType?: PortType;
}

export interface NodeDefinition {
  type: string;
  label: string;
  category: NodeCategory;
  icon: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  defaultData?: Record<string, unknown>;
  description?: string;
  isTrigger?: boolean;
  keywords?: string[];
  deprecated?: boolean;
  deprecationMessage?: string;
  color?: string;
}

/**
 * Convert proto PortType enum to local string type
 */
export function protoPortTypeToLocal(protoType: ProtoPortType): PortType {
  switch (protoType) {
    case ProtoPortType.ANY:
      return "any";
    case ProtoPortType.NUMBER:
      return "number";
    case ProtoPortType.STRING:
      return "string";
    case ProtoPortType.BOOLEAN:
      return "boolean";
    case ProtoPortType.VECTOR3:
      return "vector3";
    case ProtoPortType.BOT:
      return "bot";
    case ProtoPortType.LIST:
      return "list";
    case ProtoPortType.EXEC:
      return "execution";
    case ProtoPortType.BLOCK:
      return "block";
    case ProtoPortType.ENTITY:
      return "entity";
    case ProtoPortType.ITEM:
      return "item";
    default:
      return "any";
  }
}

/**
 * Convert proto PortDefinition to local PortDefinition
 */
export function protoPortToLocal(proto: ProtoPortDefinition): PortDefinition {
  return {
    id: proto.id,
    label: proto.displayName,
    type: protoPortTypeToLocal(proto.portType),
    required: proto.required || undefined,
    defaultValue: proto.defaultValue,
    description: proto.description || undefined,
    elementType:
      proto.elementType !== undefined
        ? protoPortTypeToLocal(proto.elementType)
        : undefined,
  };
}

/**
 * Convert proto NodeTypeDefinition to local NodeDefinition
 */
export function protoNodeTypeToLocal(
  proto: ProtoNodeTypeDefinition,
): NodeDefinition {
  // Parse default values from port definitions
  const defaultData: Record<string, unknown> = {};
  for (const input of proto.inputs) {
    if (input.defaultValue) {
      try {
        // Extract port name from id (e.g., "number-interval" -> "interval")
        const portName = input.id.includes("-")
          ? input.id.split("-").slice(1).join("-")
          : input.id;
        defaultData[portName] = JSON.parse(input.defaultValue);
      } catch {
        // If JSON parsing fails, use the raw string value
        const portName = input.id.includes("-")
          ? input.id.split("-").slice(1).join("-")
          : input.id;
        defaultData[portName] = input.defaultValue;
      }
    }
  }

  return {
    type: proto.type,
    label: proto.displayName,
    category: proto.category.toLowerCase(),
    icon: proto.icon || "Circle",
    inputs: proto.inputs.map(protoPortToLocal),
    outputs: proto.outputs.map(protoPortToLocal),
    defaultData: Object.keys(defaultData).length > 0 ? defaultData : undefined,
    description: proto.description || undefined,
    isTrigger: proto.isTrigger || undefined,
    keywords: proto.keywords.length > 0 ? proto.keywords : undefined,
    deprecated: proto.deprecated || undefined,
    deprecationMessage: proto.deprecationMessage || undefined,
    color: proto.color || undefined,
  };
}

export const PORT_COLORS: Record<PortType, string> = {
  execution: "#ffffff",
  number: "#22c55e",
  boolean: "#ef4444",
  string: "#eab308",
  vector3: "#3b82f6",
  entity: "#a855f7",
  bot: "#f97316",
  block: "#06b6d4",
  item: "#ec4899",
  list: "#8b5cf6",
  any: "#6b7280",
};

const CATEGORY_COLOR_MAP: Record<string, string> = {
  trigger: "border-l-purple-500",
  triggers: "border-l-purple-500",
  math: "border-l-green-500",
  logic: "border-l-red-500",
  action: "border-l-blue-500",
  actions: "border-l-blue-500",
  data: "border-l-yellow-500",
  flow: "border-l-orange-500",
  "flow control": "border-l-orange-500",
  constant: "border-l-cyan-500",
  constants: "border-l-cyan-500",
};

const DEFAULT_CATEGORY_COLOR = "border-l-gray-500";

/**
 * Get the border color class for a category
 */
export function getCategoryColor(category: string): string {
  return CATEGORY_COLOR_MAP[category.toLowerCase()] ?? DEFAULT_CATEGORY_COLOR;
}

// Keep for backward compatibility
export const CATEGORY_COLORS: Record<string, string> = new Proxy(
  CATEGORY_COLOR_MAP,
  {
    get(target, prop: string) {
      return target[prop.toLowerCase()] ?? DEFAULT_CATEGORY_COLOR;
    },
  },
);

const CATEGORY_INFO_MAP: Record<
  string,
  { name: string; icon: string; description: string }
> = {
  trigger: {
    name: "Triggers",
    icon: "Zap",
    description: "Events that start script execution",
  },
  triggers: {
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
  actions: {
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
  "flow control": {
    name: "Flow Control",
    icon: "Workflow",
    description: "Control script execution flow",
  },
  constant: {
    name: "Constants",
    icon: "Hash",
    description: "Constant values",
  },
  constants: {
    name: "Constants",
    icon: "Hash",
    description: "Constant values",
  },
};

const DEFAULT_CATEGORY_INFO = {
  name: "Other",
  icon: "Circle",
  description: "Other nodes",
};

/**
 * Get category info for a category name
 */
export function getCategoryInfo(category: string): {
  name: string;
  icon: string;
  description: string;
} {
  return (
    CATEGORY_INFO_MAP[category.toLowerCase()] ?? {
      ...DEFAULT_CATEGORY_INFO,
      name: category.charAt(0).toUpperCase() + category.slice(1),
    }
  );
}

// Keep for backward compatibility
export const CATEGORY_INFO: Record<
  string,
  { name: string; icon: string; description: string }
> = new Proxy(CATEGORY_INFO_MAP, {
  get(_target, prop: string) {
    return getCategoryInfo(prop);
  },
});

// Helper to get nodes by category from definitions record
export function getNodesByCategory(
  definitions: Record<string, NodeDefinition>,
  category: NodeCategory,
): NodeDefinition[] {
  return Object.values(definitions).filter((def) => def.category === category);
}
