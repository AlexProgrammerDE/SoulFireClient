import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import { queryOptions } from "@tanstack/react-query";
import type { Edge, MarkerType, Node } from "@xyflow/react";
import type { Value } from "@/generated/google/protobuf/struct";
import {
  EdgeType,
  type GetNodeTypesRequest,
  type GetNodeTypesResponse,
  type NodeTypeDefinition,
  PortType,
  type PortDefinition as ProtoPortDefinition,
  type ScriptData,
  type ScriptEdge,
  type ScriptNode,
} from "@/generated/soulfire/script";
import { ScriptServiceClient } from "@/generated/soulfire/script.client";

// Re-export for convenience
export { EdgeType, PortType };
export type {
  GetNodeTypesRequest,
  GetNodeTypesResponse,
  NodeTypeDefinition,
  ProtoPortDefinition,
  ScriptData,
  ScriptNode,
  ScriptEdge,
};

/**
 * Query options for listing all scripts in an instance
 */
export function scriptListQueryOptions(
  transport: RpcTransport | null,
  instanceId: string,
) {
  return queryOptions({
    queryKey: ["scripts", instanceId],
    queryFn: async ({ signal }) => {
      if (!transport) {
        return { scripts: [] };
      }
      const client = new ScriptServiceClient(transport);
      const result = await client.listScripts(
        { instanceId },
        { abort: signal },
      );
      return result.response;
    },
    refetchInterval: 10_000,
  });
}

/**
 * Query options for getting a single script by ID
 */
export function scriptQueryOptions(
  transport: RpcTransport | null,
  instanceId: string,
  scriptId: string,
) {
  return queryOptions({
    queryKey: ["script", instanceId, scriptId],
    queryFn: async ({ signal }) => {
      if (!transport) {
        return null;
      }
      const client = new ScriptServiceClient(transport);
      const result = await client.getScript(
        { instanceId, scriptId },
        { abort: signal },
      );
      return result.response.script;
    },
    enabled: scriptId !== "new",
  });
}

/**
 * Query options for getting script execution status
 */
export function scriptStatusQueryOptions(
  transport: RpcTransport | null,
  instanceId: string,
  scriptId: string,
) {
  return queryOptions({
    queryKey: ["script-status", instanceId, scriptId],
    queryFn: async ({ signal }) => {
      if (!transport) {
        return null;
      }
      const client = new ScriptServiceClient(transport);
      const result = await client.getScriptStatus(
        { instanceId, scriptId },
        { abort: signal },
      );
      return result.response.status;
    },
    enabled: scriptId !== "new",
    refetchInterval: 2_000,
  });
}

/**
 * Query options for getting all available node types.
 * Node types are cacheable - they only change between server versions.
 */
export function nodeTypesQueryOptions(
  transport: RpcTransport | null,
  options?: {
    category?: string;
    includeDeprecated?: boolean;
  },
) {
  return queryOptions({
    queryKey: [
      "node-types",
      options?.category ?? null,
      options?.includeDeprecated ?? false,
    ],
    queryFn: async ({ signal }) => {
      if (!transport) {
        return { nodeTypes: [], categories: [], portTypeMetadata: [] };
      }
      const client = new ScriptServiceClient(transport);
      const result = await client.getNodeTypes(
        {
          category: options?.category,
          includeDeprecated: options?.includeDeprecated ?? false,
        },
        { abort: signal },
      );
      return result.response;
    },
    // Node types rarely change, so use a long stale time
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Query options for getting Minecraft registry data.
 * Registry data is cacheable - it only changes between server versions.
 */
export function registryDataQueryOptions(
  transport: RpcTransport | null,
  registry?: string,
) {
  return queryOptions({
    queryKey: ["registry-data", registry ?? "all"],
    queryFn: async ({ signal }) => {
      if (!transport) {
        return { blocks: [], entities: [], items: [], biomes: [] };
      }
      const client = new ScriptServiceClient(transport);
      const result = await client.getRegistryData(
        { registry },
        { abort: signal },
      );
      return result.response;
    },
    // Registry data rarely changes, so use a long stale time
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

// =============================================================================
// Data Conversion Helpers
// =============================================================================

/**
 * Convert a JavaScript value to a protobuf Value
 */
function toProtoValue(value: unknown): Value {
  if (value === null || value === undefined) {
    return { kind: { oneofKind: "nullValue", nullValue: 0 } };
  }
  if (typeof value === "boolean") {
    return { kind: { oneofKind: "boolValue", boolValue: value } };
  }
  if (typeof value === "number") {
    return { kind: { oneofKind: "numberValue", numberValue: value } };
  }
  if (typeof value === "string") {
    return { kind: { oneofKind: "stringValue", stringValue: value } };
  }
  if (Array.isArray(value)) {
    return {
      kind: {
        oneofKind: "listValue",
        listValue: { values: value.map(toProtoValue) },
      },
    };
  }
  if (typeof value === "object") {
    const fields: { [key: string]: Value } = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = toProtoValue(v);
    }
    return { kind: { oneofKind: "structValue", structValue: { fields } } };
  }
  return { kind: { oneofKind: "nullValue", nullValue: 0 } };
}

/**
 * Convert a protobuf Value to a JavaScript value
 */
function fromProtoValue(value: Value): unknown {
  if (!value.kind) return null;
  switch (value.kind.oneofKind) {
    case "nullValue":
      return null;
    case "boolValue":
      return value.kind.boolValue;
    case "numberValue":
      return value.kind.numberValue;
    case "stringValue":
      return value.kind.stringValue;
    case "listValue":
      return value.kind.listValue.values.map(fromProtoValue);
    case "structValue": {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value.kind.structValue.fields)) {
        result[k] = fromProtoValue(v);
      }
      return result;
    }
    default:
      return null;
  }
}

/**
 * Convert React Flow nodes to proto ScriptNodes
 */
export function nodesToProto(nodes: Node[]): ScriptNode[] {
  return nodes.map((node) => {
    const data: { [key: string]: Value } = {};
    const nodeData = node.data as Record<string, unknown>;
    if (nodeData && typeof nodeData === "object") {
      for (const [key, value] of Object.entries(nodeData)) {
        // Skip internal fields that are handled separately
        if (
          [
            "muted",
            "collapsed",
            "label",
            "containedNodes",
            "resolvedType",
            "parentFrameId",
          ].includes(key)
        ) {
          continue;
        }
        data[key] = toProtoValue(value);
      }
    }
    return {
      id: node.id,
      type: node.type ?? "unknown",
      position: {
        x: node.position.x,
        y: node.position.y,
      },
      data,
      muted: (nodeData?.muted as boolean) ?? false,
      collapsed: (nodeData?.collapsed as boolean) ?? false,
      label: (nodeData?.label as string) ?? "",
      containedNodes: (nodeData?.containedNodes as string[]) ?? [],
      parentFrameId: (nodeData?.parentFrameId as string) ?? "",
      width: node.measured?.width,
      height: node.measured?.height,
      resolvedType: nodeData?.resolvedType as PortType | undefined,
    };
  });
}

/**
 * Convert proto ScriptNodes to React Flow nodes
 */
export function protoToNodes(nodes: ScriptNode[]): Node[] {
  return nodes.map((node) => {
    const data: Record<string, unknown> = {};
    if (node.data) {
      for (const [key, value] of Object.entries(node.data)) {
        data[key] = fromProtoValue(value);
      }
    }
    return {
      id: node.id,
      type: node.type,
      position: {
        x: node.position?.x ?? 0,
        y: node.position?.y ?? 0,
      },
      data,
    };
  });
}

/**
 * Convert React Flow edges to proto ScriptEdges
 * Edge type is determined from the edge's type or data fields,
 * which are set when the edge is created based on port type lookup.
 */
export function edgesToProto(edges: Edge[]): ScriptEdge[] {
  return edges.map((edge) => {
    // Determine edge type from the edge's type or data
    // Port IDs are now simple names, so we rely on edge metadata
    const isExecution =
      edge.type === "execution" ||
      (edge.data as { edgeType?: string })?.edgeType === "execution";

    return {
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourceHandle ?? "",
      target: edge.target,
      targetHandle: edge.targetHandle ?? "",
      edgeType: isExecution ? EdgeType.EXECUTION : EdgeType.DATA,
    };
  });
}

/**
 * Convert proto ScriptEdges to React Flow edges
 */
export function protoToEdges(edges: ScriptEdge[]): Edge[] {
  return edges.map((edge) => {
    const isExecution = edge.edgeType === EdgeType.EXECUTION;
    return {
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourceHandle || undefined,
      target: edge.target,
      targetHandle: edge.targetHandle || undefined,
      type: isExecution ? "execution" : "data",
      data: { edgeType: isExecution ? "execution" : "data" },
      ...(isExecution && {
        markerEnd: {
          type: "arrowclosed" as unknown as MarkerType,
          width: 16,
          height: 16,
        },
      }),
    };
  });
}

/**
 * Convert full ScriptData to store format
 */
export function scriptDataToStore(script: ScriptData) {
  return {
    id: script.id,
    name: script.name,
    description: script.description,
    paused: script.paused,
    nodes: protoToNodes(script.nodes),
    edges: protoToEdges(script.edges),
  };
}
