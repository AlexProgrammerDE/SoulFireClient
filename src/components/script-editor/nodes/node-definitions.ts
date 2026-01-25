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
  type: "trigger.on_tick",
  label: "On Tick",
  category: "trigger",
  icon: "Clock",
  inputs: [],
  outputs: [execOut(), port("bot", "Bot", "bot")],
};

export const OnJoinNode: NodeDefinition = {
  type: "trigger.on_join",
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
  type: "trigger.on_chat",
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
  type: "trigger.on_damage",
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
  type: "trigger.on_death",
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
  type: "trigger.on_health_change",
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
  type: "trigger.on_interval",
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
  type: "math.add",
  label: "Add",
  category: "math",
  icon: "Plus",
  inputs: [port("a", "A", "number"), port("b", "B", "number")],
  outputs: [port("result", "Result", "number")],
};

export const SubtractNode: NodeDefinition = {
  type: "math.subtract",
  label: "Subtract",
  category: "math",
  icon: "Minus",
  inputs: [port("a", "A", "number"), port("b", "B", "number")],
  outputs: [port("result", "Result", "number")],
};

export const MultiplyNode: NodeDefinition = {
  type: "math.multiply",
  label: "Multiply",
  category: "math",
  icon: "X",
  inputs: [port("a", "A", "number"), port("b", "B", "number")],
  outputs: [port("result", "Result", "number")],
};

export const DivideNode: NodeDefinition = {
  type: "math.divide",
  label: "Divide",
  category: "math",
  icon: "Divide",
  inputs: [port("a", "A", "number"), port("b", "B", "number")],
  outputs: [port("result", "Result", "number")],
};

export const ModuloNode: NodeDefinition = {
  type: "math.modulo",
  label: "Modulo",
  category: "math",
  icon: "Percent",
  inputs: [port("a", "A", "number"), port("b", "B", "number")],
  outputs: [port("result", "Result", "number")],
};

export const FormulaNode: NodeDefinition = {
  type: "math.formula",
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
  type: "math.random",
  label: "Random",
  category: "math",
  icon: "Shuffle",
  inputs: [port("min", "Min", "number"), port("max", "Max", "number")],
  outputs: [port("result", "Result", "number")],
  defaultData: { min: 0, max: 100 },
};

export const ClampNode: NodeDefinition = {
  type: "math.clamp",
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
  type: "math.lerp",
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
  type: "math.bspline",
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
  type: "logic.compare",
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
  type: "logic.and",
  label: "And",
  category: "logic",
  icon: "Circle",
  inputs: [port("a", "A", "boolean"), port("b", "B", "boolean")],
  outputs: [port("result", "Result", "boolean")],
};

export const OrNode: NodeDefinition = {
  type: "logic.or",
  label: "Or",
  category: "logic",
  icon: "CircleDot",
  inputs: [port("a", "A", "boolean"), port("b", "B", "boolean")],
  outputs: [port("result", "Result", "boolean")],
};

export const NotNode: NodeDefinition = {
  type: "logic.not",
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
  type: "action.set_rotation",
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
  type: "action.look_at",
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
  type: "action.sneak",
  label: "Sneak",
  category: "action",
  icon: "ChevronDown",
  inputs: [execIn(), port("enabled", "Enabled", "boolean")],
  outputs: [execOut()],
  defaultData: { enabled: true },
};

export const SprintNode: NodeDefinition = {
  type: "action.sprint",
  label: "Sprint",
  category: "action",
  icon: "Zap",
  inputs: [execIn(), port("enabled", "Enabled", "boolean")],
  outputs: [execOut()],
  defaultData: { enabled: true },
};

export const JumpNode: NodeDefinition = {
  type: "action.jump",
  label: "Jump",
  category: "action",
  icon: "ArrowUp",
  inputs: [execIn()],
  outputs: [execOut()],
};

export const AttackNode: NodeDefinition = {
  type: "action.attack",
  label: "Attack",
  category: "action",
  icon: "Sword",
  inputs: [execIn(), port("entity", "Entity", "entity")],
  outputs: [execOut()],
};

export const UseItemNode: NodeDefinition = {
  type: "action.use_item",
  label: "Use Item",
  category: "action",
  icon: "Hand",
  inputs: [execIn(), port("hand", "Hand", "string")],
  outputs: [execOut()],
  defaultData: { hand: "main" },
};

export const PathfindToNode: NodeDefinition = {
  type: "action.pathfind_to",
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
  type: "action.break_block",
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
  type: "action.place_block",
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
  type: "action.select_slot",
  label: "Select Slot",
  category: "action",
  icon: "Grid3X3",
  inputs: [execIn(), port("slot", "Slot", "number")],
  outputs: [execOut()],
  defaultData: { slot: 0 },
};

export const SendChatNode: NodeDefinition = {
  type: "action.send_chat",
  label: "Send Chat",
  category: "action",
  icon: "Send",
  inputs: [execIn(), port("message", "Message", "string")],
  outputs: [execOut()],
};

export const WaitNode: NodeDefinition = {
  type: "action.wait",
  label: "Wait",
  category: "action",
  icon: "Clock",
  inputs: [execIn(), port("ticks", "Ticks", "number")],
  outputs: [execOut()],
  defaultData: { ticks: 20 },
};

export const PrintNode: NodeDefinition = {
  type: "action.print",
  label: "Print",
  category: "action",
  icon: "MessageSquareText",
  inputs: [execIn(), port("message", "Message", "any")],
  outputs: [execOut()],
  defaultData: { level: "info" },
};

export const SetVariableNode: NodeDefinition = {
  type: "action.set_variable",
  label: "Set Variable",
  category: "action",
  icon: "Upload",
  inputs: [execIn(), port("value", "Value", "any")],
  outputs: [execOut()],
  defaultData: { variableName: "myVar" },
};

// ============================================================================
// DATA NODES
// ============================================================================

export const GetPositionNode: NodeDefinition = {
  type: "data.get_position",
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
  type: "data.get_rotation",
  label: "Get Rotation",
  category: "data",
  icon: "Compass",
  inputs: [port("bot", "Bot", "bot")],
  outputs: [port("yaw", "Yaw", "number"), port("pitch", "Pitch", "number")],
};

export const GetHealthNode: NodeDefinition = {
  type: "data.get_health",
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
  type: "data.get_hunger",
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
  type: "data.get_inventory",
  label: "Get Inventory",
  category: "data",
  icon: "Package",
  inputs: [port("bot", "Bot", "bot"), port("slot", "Slot", "number")],
  outputs: [port("item", "Item", "any"), port("count", "Count", "number")],
};

export const GetBlockNode: NodeDefinition = {
  type: "data.get_block",
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
  type: "data.find_entity",
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
  type: "data.find_block",
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

export const GetVariableNode: NodeDefinition = {
  type: "data.get_variable",
  label: "Get Variable",
  category: "data",
  icon: "Download",
  inputs: [],
  outputs: [port("value", "Value", "any")],
  defaultData: { variableName: "myVar" },
};

// ============================================================================
// CONSTANT NODES
// ============================================================================

export const NumberConstantNode: NodeDefinition = {
  type: "constant.number",
  label: "Number",
  category: "data",
  icon: "Hash",
  inputs: [],
  outputs: [port("value", "Value", "number")],
  defaultData: { value: 0 },
};

export const StringConstantNode: NodeDefinition = {
  type: "constant.string",
  label: "String",
  category: "data",
  icon: "Type",
  inputs: [],
  outputs: [port("value", "Value", "string")],
  defaultData: { value: "" },
};

export const BooleanConstantNode: NodeDefinition = {
  type: "constant.boolean",
  label: "Boolean",
  category: "data",
  icon: "ToggleLeft",
  inputs: [],
  outputs: [port("value", "Value", "boolean")],
  defaultData: { value: false },
};

export const Vector3ConstantNode: NodeDefinition = {
  type: "constant.vector3",
  label: "Vector3",
  category: "data",
  icon: "Move3D",
  inputs: [],
  outputs: [
    port("x", "X", "number"),
    port("y", "Y", "number"),
    port("z", "Z", "number"),
  ],
  defaultData: { x: 0, y: 0, z: 0 },
};

// ============================================================================
// FLOW CONTROL NODES
// ============================================================================

export const BranchNode: NodeDefinition = {
  type: "flow.branch",
  label: "Branch",
  category: "flow",
  icon: "GitBranch",
  inputs: [execIn(), port("condition", "Condition", "boolean")],
  outputs: [execOut("true", "True"), execOut("false", "False")],
};

export const SwitchNode: NodeDefinition = {
  type: "flow.switch",
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
  type: "flow.loop",
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
  type: "flow.for_each",
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
  type: "flow.sequence",
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
  type: "flow.gate",
  label: "Gate",
  category: "flow",
  icon: "DoorOpen",
  inputs: [execIn(), port("open", "Open", "boolean")],
  outputs: [execOut()],
  defaultData: { open: true },
};

export const DebounceNode: NodeDefinition = {
  type: "flow.debounce",
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
  "trigger.on_tick": OnTickNode,
  "trigger.on_join": OnJoinNode,
  "trigger.on_chat": OnChatNode,
  "trigger.on_damage": OnDamageNode,
  "trigger.on_death": OnDeathNode,
  "trigger.on_health_change": OnHealthChangeNode,
  "trigger.on_interval": OnIntervalNode,

  // Math nodes
  "math.add": AddNode,
  "math.subtract": SubtractNode,
  "math.multiply": MultiplyNode,
  "math.divide": DivideNode,
  "math.modulo": ModuloNode,
  "math.formula": FormulaNode,
  "math.random": RandomNode,
  "math.clamp": ClampNode,
  "math.lerp": LerpNode,
  "math.bspline": BSplineNode,

  // Logic nodes
  "logic.compare": CompareNode,
  "logic.and": AndNode,
  "logic.or": OrNode,
  "logic.not": NotNode,

  // Action nodes
  "action.set_rotation": SetRotationNode,
  "action.look_at": LookAtNode,
  "action.sneak": SneakNode,
  "action.sprint": SprintNode,
  "action.jump": JumpNode,
  "action.attack": AttackNode,
  "action.use_item": UseItemNode,
  "action.pathfind_to": PathfindToNode,
  "action.break_block": BreakBlockNode,
  "action.place_block": PlaceBlockNode,
  "action.select_slot": SelectSlotNode,
  "action.send_chat": SendChatNode,
  "action.wait": WaitNode,
  "action.print": PrintNode,
  "action.set_variable": SetVariableNode,

  // Data nodes
  "data.get_position": GetPositionNode,
  "data.get_rotation": GetRotationNode,
  "data.get_health": GetHealthNode,
  "data.get_hunger": GetHungerNode,
  "data.get_inventory": GetInventoryNode,
  "data.get_block": GetBlockNode,
  "data.find_entity": FindEntityNode,
  "data.find_block": FindBlockNode,
  "data.get_variable": GetVariableNode,

  // Constant nodes
  "constant.number": NumberConstantNode,
  "constant.string": StringConstantNode,
  "constant.boolean": BooleanConstantNode,
  "constant.vector3": Vector3ConstantNode,

  // Flow control nodes
  "flow.branch": BranchNode,
  "flow.switch": SwitchNode,
  "flow.loop": LoopNode,
  "flow.for_each": ForEachNode,
  "flow.sequence": SequenceNode,
  "flow.gate": GateNode,
  "flow.debounce": DebounceNode,
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
