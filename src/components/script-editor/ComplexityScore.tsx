import { useMemo } from "react";
import { getNodeDefinition } from "@/components/script-editor/nodes/types";
import { useScriptEditorStore } from "@/stores/script-editor-store";

/**
 * Computes and displays a complexity score for the current script.
 * Score: nodeCount * 1 + edgeCount * 0.5 + loopNodes * 3 + maxFanOut * 2
 */
export function ComplexityScore() {
  const nodes = useScriptEditorStore((s) => s.nodes);
  const edges = useScriptEditorStore((s) => s.edges);

  const { score, color } = useMemo(() => {
    let loopNodes = 0;
    let maxFanOut = 0;

    const fanOutCount: Record<string, number> = {};
    for (const edge of edges) {
      fanOutCount[edge.source] = (fanOutCount[edge.source] ?? 0) + 1;
    }
    for (const count of Object.values(fanOutCount)) {
      if (count > maxFanOut) maxFanOut = count;
    }

    for (const node of nodes) {
      if (!node.type) continue;
      const def = getNodeDefinition(node.type);
      if (!def) continue;
      const hasLoopPort = def.outputs.some((p) => p.id === "exec_loop");
      if (hasLoopPort) loopNodes++;
    }

    const s =
      nodes.length * 1 + edges.length * 0.5 + loopNodes * 3 + maxFanOut * 2;
    const c =
      s < 50 ? "text-green-500" : s < 100 ? "text-yellow-500" : "text-red-500";
    return { score: Math.round(s), color: c };
  }, [nodes, edges]);

  if (nodes.length === 0) return null;

  return (
    <span
      className={`text-xs font-mono ${color}`}
      title="Script complexity score"
    >
      {score}
    </span>
  );
}
