import type { NodeDefinition, PortDefinition } from "./types";

// Helper functions to create port definitions
// Port IDs use format "type-name" for connection validation (e.g., "number-a", "exec-out")
function execIn(): PortDefinition {
  return { id: "exec-in", label: "Exec", type: "execution" };
}

function execOut(name = "out", label = "Exec"): PortDefinition {
  return { id: `exec-${name}`, label, type: "execution" };
}

function port(
  name: string,
  label: string,
  type: PortDefinition["type"],
): PortDefinition {
  // Prefix ID with type for connection validation
  return { id: `${type}-${name}`, label, type };
}

// ============================================================================
// TRIGGER NODES
// ============================================================================

export const OnTickNode: NodeDefinition = {
  type: "OnTick",
  label: "On Tick",
  category: "trigger",
  icon: "Clock",
  inputs: [],
  outputs: [execOut(), port("bot", "Bot", "bot")],
};

export const OnJoinNode: NodeDefinition = {
  type: "OnJoin",
  label: "On Join",
  category: "trigger",
  icon: "LogIn",
  inputs: [],
  outputs: [
    execOut(),
    port("bot", "Bot", "bot"),
    port("server", "Server", "string"),
  ],
};

export const OnChatNode: NodeDefinition = {
  type: "OnChat",
  label: "On Chat",
  category: "trigger",
  icon: "MessageSquare",
  inputs: [],
  outputs: [
    execOut(),
    port("bot", "Bot", "bot"),
    port("message", "Message", "string"),
    port("sender", "Sender", "string"),
  ],
};

export const OnDamageNode: NodeDefinition = {
  type: "OnDamage",
  label: "On Damage",
  category: "trigger",
  icon: "Zap",
  inputs: [],
  outputs: [
    execOut(),
    port("bot", "Bot", "bot"),
    port("amount", "Amount", "number"),
    port("source", "Source", "entity"),
  ],
};

export const OnDeathNode: NodeDefinition = {
  type: "OnDeath",
  label: "On Death",
  category: "trigger",
  icon: "Skull",
  inputs: [],
  outputs: [
    execOut(),
    port("bot", "Bot", "bot"),
    port("killer", "Killer", "entity"),
  ],
};

export const OnHealthChangeNode: NodeDefinition = {
  type: "OnHealthChange",
  label: "On Health Change",
  category: "trigger",
  icon: "Heart",
  inputs: [],
  outputs: [
    execOut(),
    port("bot", "Bot", "bot"),
    port("health", "Health", "number"),
    port("maxHealth", "Max Health", "number"),
  ],
};

export const OnIntervalNode: NodeDefinition = {
  type: "OnInterval",
  label: "On Interval",
  category: "trigger",
  icon: "Timer",
  inputs: [port("interval", "Interval (ms)", "number")],
  outputs: [
    execOut(),
    port("bot", "Bot", "bot"),
    port("iteration", "Iteration", "number"),
  ],
  defaultData: { interval: 1000 },
};

// ============================================================================
// MATH NODES
// ============================================================================

export const AddNode: NodeDefinition = {
  type: "Add",
  label: "Add",
  category: "math",
  icon: "Plus",
  inputs: [port("a", "A", "number"), port("b", "B", "number")],
  outputs: [port("result", "Result", "number")],
};

export const SubtractNode: NodeDefinition = {
  type: "Subtract",
  label: "Subtract",
  category: "math",
  icon: "Minus",
  inputs: [port("a", "A", "number"), port("b", "B", "number")],
  outputs: [port("result", "Result", "number")],
};

export const MultiplyNode: NodeDefinition = {
  type: "Multiply",
  label: "Multiply",
  category: "math",
  icon: "X",
  inputs: [port("a", "A", "number"), port("b", "B", "number")],
  outputs: [port("result", "Result", "number")],
};

export const DivideNode: NodeDefinition = {
  type: "Divide",
  label: "Divide",
  category: "math",
  icon: "Divide",
  inputs: [port("a", "A", "number"), port("b", "B", "number")],
  outputs: [port("result", "Result", "number")],
};

export const ModuloNode: NodeDefinition = {
  type: "Modulo",
  label: "Modulo",
  category: "math",
  icon: "Percent",
  inputs: [port("a", "A", "number"), port("b", "B", "number")],
  outputs: [port("result", "Result", "number")],
};

export const FormulaNode: NodeDefinition = {
  type: "Formula",
  label: "Formula",
  category: "math",
  icon: "Calculator",
  inputs: [
    port("formula", "Formula", "string"),
    port("vars", "Variables", "any"),
  ],
  outputs: [port("result", "Result", "number")],
  defaultData: { formula: "a + b * 2" },
};

export const RandomNode: NodeDefinition = {
  type: "Random",
  label: "Random",
  category: "math",
  icon: "Shuffle",
  inputs: [port("min", "Min", "number"), port("max", "Max", "number")],
  outputs: [port("result", "Result", "number")],
  defaultData: { min: 0, max: 100 },
};

export const ClampNode: NodeDefinition = {
  type: "Clamp",
  label: "Clamp",
  category: "math",
  icon: "Minimize2",
  inputs: [
    port("value", "Value", "number"),
    port("min", "Min", "number"),
    port("max", "Max", "number"),
  ],
  outputs: [port("result", "Result", "number")],
};

export const LerpNode: NodeDefinition = {
  type: "Lerp",
  label: "Lerp",
  category: "math",
  icon: "TrendingUp",
  inputs: [
    port("a", "A", "number"),
    port("b", "B", "number"),
    port("t", "T", "number"),
  ],
  outputs: [port("result", "Result", "number")],
};

export const BSplineNode: NodeDefinition = {
  type: "BSpline",
  label: "B-Spline",
  category: "math",
  icon: "Spline",
  inputs: [
    port("points", "Points", "any"),
    port("t", "T", "number"),
    port("degree", "Degree", "number"),
  ],
  outputs: [
    port("position", "Position", "vector3"),
    port("tangent", "Tangent", "vector3"),
  ],
  defaultData: { degree: 3 },
};

// ============================================================================
// LOGIC NODES
// ============================================================================

export const CompareNode: NodeDefinition = {
  type: "Compare",
  label: "Compare",
  category: "logic",
  icon: "Scale",
  inputs: [
    port("a", "A", "any"),
    port("b", "B", "any"),
    port("operator", "Operator", "string"),
  ],
  outputs: [port("result", "Result", "boolean")],
  defaultData: { operator: "==" },
};

export const AndNode: NodeDefinition = {
  type: "And",
  label: "And",
  category: "logic",
  icon: "Circle",
  inputs: [port("a", "A", "boolean"), port("b", "B", "boolean")],
  outputs: [port("result", "Result", "boolean")],
};

export const OrNode: NodeDefinition = {
  type: "Or",
  label: "Or",
  category: "logic",
  icon: "CircleDot",
  inputs: [port("a", "A", "boolean"), port("b", "B", "boolean")],
  outputs: [port("result", "Result", "boolean")],
};

export const NotNode: NodeDefinition = {
  type: "Not",
  label: "Not",
  category: "logic",
  icon: "Ban",
  inputs: [port("value", "Value", "boolean")],
  outputs: [port("result", "Result", "boolean")],
};

// ============================================================================
// ACTION NODES
// ============================================================================

export const SetRotationNode: NodeDefinition = {
  type: "SetRotation",
  label: "Set Rotation",
  category: "action",
  icon: "RotateCw",
  inputs: [
    execIn(),
    port("yaw", "Yaw", "number"),
    port("pitch", "Pitch", "number"),
    port("smooth", "Smooth", "boolean"),
  ],
  outputs: [execOut()],
  defaultData: { smooth: true },
};

export const LookAtNode: NodeDefinition = {
  type: "LookAt",
  label: "Look At",
  category: "action",
  icon: "Eye",
  inputs: [
    execIn(),
    port("x", "X", "number"),
    port("y", "Y", "number"),
    port("z", "Z", "number"),
    port("smooth", "Smooth", "boolean"),
  ],
  outputs: [execOut()],
  defaultData: { smooth: true },
};

export const SneakNode: NodeDefinition = {
  type: "Sneak",
  label: "Sneak",
  category: "action",
  icon: "ChevronDown",
  inputs: [execIn(), port("enabled", "Enabled", "boolean")],
  outputs: [execOut()],
  defaultData: { enabled: true },
};

export const SprintNode: NodeDefinition = {
  type: "Sprint",
  label: "Sprint",
  category: "action",
  icon: "Zap",
  inputs: [execIn(), port("enabled", "Enabled", "boolean")],
  outputs: [execOut()],
  defaultData: { enabled: true },
};

export const JumpNode: NodeDefinition = {
  type: "Jump",
  label: "Jump",
  category: "action",
  icon: "ArrowUp",
  inputs: [execIn()],
  outputs: [execOut()],
};

export const AttackNode: NodeDefinition = {
  type: "Attack",
  label: "Attack",
  category: "action",
  icon: "Sword",
  inputs: [execIn(), port("entity", "Entity", "entity")],
  outputs: [execOut()],
};

export const UseItemNode: NodeDefinition = {
  type: "UseItem",
  label: "Use Item",
  category: "action",
  icon: "Hand",
  inputs: [execIn(), port("hand", "Hand", "string")],
  outputs: [execOut()],
  defaultData: { hand: "main" },
};

export const PathfindToNode: NodeDefinition = {
  type: "PathfindTo",
  label: "Pathfind To",
  category: "action",
  icon: "Navigation",
  inputs: [
    execIn(),
    port("x", "X", "number"),
    port("y", "Y", "number"),
    port("z", "Z", "number"),
  ],
  outputs: [
    execOut(),
    execOut("completed", "Completed"),
    execOut("failed", "Failed"),
  ],
};

export const BreakBlockNode: NodeDefinition = {
  type: "BreakBlock",
  label: "Break Block",
  category: "action",
  icon: "Pickaxe",
  inputs: [
    execIn(),
    port("x", "X", "number"),
    port("y", "Y", "number"),
    port("z", "Z", "number"),
  ],
  outputs: [execOut(), execOut("completed", "Completed")],
};

export const PlaceBlockNode: NodeDefinition = {
  type: "PlaceBlock",
  label: "Place Block",
  category: "action",
  icon: "Box",
  inputs: [
    execIn(),
    port("x", "X", "number"),
    port("y", "Y", "number"),
    port("z", "Z", "number"),
    port("face", "Face", "string"),
  ],
  outputs: [execOut(), execOut("completed", "Completed")],
  defaultData: { face: "up" },
};

export const SelectSlotNode: NodeDefinition = {
  type: "SelectSlot",
  label: "Select Slot",
  category: "action",
  icon: "Grid3X3",
  inputs: [execIn(), port("slot", "Slot", "number")],
  outputs: [execOut()],
  defaultData: { slot: 0 },
};

export const SendChatNode: NodeDefinition = {
  type: "SendChat",
  label: "Send Chat",
  category: "action",
  icon: "Send",
  inputs: [execIn(), port("message", "Message", "string")],
  outputs: [execOut()],
};

export const WaitNode: NodeDefinition = {
  type: "Wait",
  label: "Wait",
  category: "action",
  icon: "Clock",
  inputs: [execIn(), port("ticks", "Ticks", "number")],
  outputs: [execOut()],
  defaultData: { ticks: 20 },
};

// ============================================================================
// DATA NODES
// ============================================================================

export const GetPositionNode: NodeDefinition = {
  type: "GetPosition",
  label: "Get Position",
  category: "data",
  icon: "MapPin",
  inputs: [port("bot", "Bot", "bot")],
  outputs: [
    port("x", "X", "number"),
    port("y", "Y", "number"),
    port("z", "Z", "number"),
  ],
};

export const GetRotationNode: NodeDefinition = {
  type: "GetRotation",
  label: "Get Rotation",
  category: "data",
  icon: "Compass",
  inputs: [port("bot", "Bot", "bot")],
  outputs: [port("yaw", "Yaw", "number"), port("pitch", "Pitch", "number")],
};

export const GetHealthNode: NodeDefinition = {
  type: "GetHealth",
  label: "Get Health",
  category: "data",
  icon: "Heart",
  inputs: [port("bot", "Bot", "bot")],
  outputs: [
    port("health", "Health", "number"),
    port("maxHealth", "Max Health", "number"),
  ],
};

export const GetHungerNode: NodeDefinition = {
  type: "GetHunger",
  label: "Get Hunger",
  category: "data",
  icon: "Utensils",
  inputs: [port("bot", "Bot", "bot")],
  outputs: [
    port("food", "Food", "number"),
    port("saturation", "Saturation", "number"),
  ],
};

export const GetInventoryNode: NodeDefinition = {
  type: "GetInventory",
  label: "Get Inventory",
  category: "data",
  icon: "Package",
  inputs: [port("bot", "Bot", "bot"), port("slot", "Slot", "number")],
  outputs: [port("item", "Item", "any"), port("count", "Count", "number")],
};

export const GetBlockNode: NodeDefinition = {
  type: "GetBlock",
  label: "Get Block",
  category: "data",
  icon: "Square",
  inputs: [
    port("x", "X", "number"),
    port("y", "Y", "number"),
    port("z", "Z", "number"),
  ],
  outputs: [
    port("blockType", "Block Type", "string"),
    port("blockState", "Block State", "any"),
  ],
};

export const FindEntityNode: NodeDefinition = {
  type: "FindEntity",
  label: "Find Entity",
  category: "data",
  icon: "Search",
  inputs: [
    port("bot", "Bot", "bot"),
    port("type", "Type", "string"),
    port("range", "Range", "number"),
  ],
  outputs: [
    port("entity", "Entity", "entity"),
    port("distance", "Distance", "number"),
  ],
  defaultData: { range: 16 },
};

export const FindBlockNode: NodeDefinition = {
  type: "FindBlock",
  label: "Find Block",
  category: "data",
  icon: "Scan",
  inputs: [
    port("bot", "Bot", "bot"),
    port("type", "Type", "string"),
    port("range", "Range", "number"),
  ],
  outputs: [
    port("x", "X", "number"),
    port("y", "Y", "number"),
    port("z", "Z", "number"),
    port("distance", "Distance", "number"),
  ],
  defaultData: { range: 32 },
};

// ============================================================================
// FLOW CONTROL NODES
// ============================================================================

export const BranchNode: NodeDefinition = {
  type: "Branch",
  label: "Branch",
  category: "flow",
  icon: "GitBranch",
  inputs: [execIn(), port("condition", "Condition", "boolean")],
  outputs: [execOut("true", "True"), execOut("false", "False")],
};

export const SwitchNode: NodeDefinition = {
  type: "Switch",
  label: "Switch",
  category: "flow",
  icon: "GitMerge",
  inputs: [execIn(), port("value", "Value", "any")],
  outputs: [
    execOut("default", "Default"),
    execOut("case1", "Case 1"),
    execOut("case2", "Case 2"),
    execOut("case3", "Case 3"),
  ],
};

export const LoopNode: NodeDefinition = {
  type: "Loop",
  label: "Loop",
  category: "flow",
  icon: "Repeat",
  inputs: [execIn(), port("count", "Count", "number")],
  outputs: [
    execOut("body", "Body"),
    execOut("completed", "Completed"),
    port("index", "Index", "number"),
  ],
  defaultData: { count: 10 },
};

export const ForEachNode: NodeDefinition = {
  type: "ForEach",
  label: "For Each",
  category: "flow",
  icon: "List",
  inputs: [execIn(), port("items", "Items", "any")],
  outputs: [
    execOut("body", "Body"),
    execOut("completed", "Completed"),
    port("item", "Item", "any"),
    port("index", "Index", "number"),
  ],
};

export const SequenceNode: NodeDefinition = {
  type: "Sequence",
  label: "Sequence",
  category: "flow",
  icon: "ListOrdered",
  inputs: [execIn()],
  outputs: [
    execOut("1", "1"),
    execOut("2", "2"),
    execOut("3", "3"),
    execOut("4", "4"),
  ],
};

export const GateNode: NodeDefinition = {
  type: "Gate",
  label: "Gate",
  category: "flow",
  icon: "DoorOpen",
  inputs: [execIn(), port("open", "Open", "boolean")],
  outputs: [execOut()],
  defaultData: { open: true },
};

export const DebounceNode: NodeDefinition = {
  type: "Debounce",
  label: "Debounce",
  category: "flow",
  icon: "Timer",
  inputs: [execIn(), port("delay", "Delay (ms)", "number")],
  outputs: [execOut()],
  defaultData: { delay: 100 },
};

// ============================================================================
// ALL NODE DEFINITIONS
// ============================================================================

export const NODE_DEFINITIONS: Record<string, NodeDefinition> = {
  // Trigger nodes
  OnTick: OnTickNode,
  OnJoin: OnJoinNode,
  OnChat: OnChatNode,
  OnDamage: OnDamageNode,
  OnDeath: OnDeathNode,
  OnHealthChange: OnHealthChangeNode,
  OnInterval: OnIntervalNode,

  // Math nodes
  Add: AddNode,
  Subtract: SubtractNode,
  Multiply: MultiplyNode,
  Divide: DivideNode,
  Modulo: ModuloNode,
  Formula: FormulaNode,
  Random: RandomNode,
  Clamp: ClampNode,
  Lerp: LerpNode,
  BSpline: BSplineNode,

  // Logic nodes
  Compare: CompareNode,
  And: AndNode,
  Or: OrNode,
  Not: NotNode,

  // Action nodes
  SetRotation: SetRotationNode,
  LookAt: LookAtNode,
  Sneak: SneakNode,
  Sprint: SprintNode,
  Jump: JumpNode,
  Attack: AttackNode,
  UseItem: UseItemNode,
  PathfindTo: PathfindToNode,
  BreakBlock: BreakBlockNode,
  PlaceBlock: PlaceBlockNode,
  SelectSlot: SelectSlotNode,
  SendChat: SendChatNode,
  Wait: WaitNode,

  // Data nodes
  GetPosition: GetPositionNode,
  GetRotation: GetRotationNode,
  GetHealth: GetHealthNode,
  GetHunger: GetHungerNode,
  GetInventory: GetInventoryNode,
  GetBlock: GetBlockNode,
  FindEntity: FindEntityNode,
  FindBlock: FindBlockNode,

  // Flow control nodes
  Branch: BranchNode,
  Switch: SwitchNode,
  Loop: LoopNode,
  ForEach: ForEachNode,
  Sequence: SequenceNode,
  Gate: GateNode,
  Debounce: DebounceNode,
};

// Group definitions by category for UI purposes
export const NODE_DEFINITIONS_BY_CATEGORY = Object.values(
  NODE_DEFINITIONS,
).reduce(
  (acc, def) => {
    if (!acc[def.category]) {
      acc[def.category] = [];
    }
    acc[def.category].push(def);
    return acc;
  },
  {} as Record<NodeDefinition["category"], NodeDefinition[]>,
);
