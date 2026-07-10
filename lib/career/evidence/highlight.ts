import { DirectedEvidenceGraph } from "./graph";

export interface GraphFocus {
  focusNodeId: string;
  nodes: string[];
  edges: string[];
  upstreamNodes: string[];
  downstreamNodes: string[];
}

export interface EvidenceHeatmapToken {
  level: "high" | "medium" | "weak" | "missing" | "unanalysed";
  colorHex: string;
  label: string;
}

/**
 * Pure, deterministic function that computes the local bidirectional proof subgraph around any node.
 * Upstream walks towards Evidence and Sources.
 * Downstream walks towards Requirements, Jobs, and Organisations.
 */
export function computeGraphFocus(
  graph: DirectedEvidenceGraph,
  focusNodeId: string
): GraphFocus {
  const upstreamNodes = new Set<string>();
  const downstreamNodes = new Set<string>();
  const activeEdges = new Set<string>();

  // 1. Upstream BFS (follow edges where targetId === current)
  const upQueue: string[] = [focusNodeId];
  const upVisited = new Set<string>([focusNodeId]);

  while (upQueue.length > 0) {
    const current = upQueue.shift()!;
    for (const edge of graph.edges) {
      if (edge.targetId === current) {
        activeEdges.add(edge.id);
        if (!upVisited.has(edge.sourceId)) {
          upVisited.add(edge.sourceId);
          upstreamNodes.add(edge.sourceId);
          upQueue.push(edge.sourceId);
        }
      }
    }
  }

  // 2. Downstream BFS (follow edges where sourceId === current)
  const downQueue: string[] = [focusNodeId];
  const downVisited = new Set<string>([focusNodeId]);

  while (downQueue.length > 0) {
    const current = downQueue.shift()!;
    for (const edge of graph.edges) {
      if (edge.sourceId === current) {
        activeEdges.add(edge.id);
        if (!downVisited.has(edge.targetId)) {
          downVisited.add(edge.targetId);
          downstreamNodes.add(edge.targetId);
          downQueue.push(edge.targetId);
        }
      }
    }
  }

  const allNodes = new Set<string>([
    focusNodeId,
    ...Array.from(upstreamNodes),
    ...Array.from(downstreamNodes)
  ]);

  return {
    focusNodeId,
    nodes: Array.from(allNodes),
    edges: Array.from(activeEdges),
    upstreamNodes: Array.from(upstreamNodes),
    downstreamNodes: Array.from(downstreamNodes)
  };
}

/**
 * Pure helper returning semantic SIL v3.0 heatmap color token and label based on confidence.
 */
export function getEvidenceHeatmapToken(
  confidence: number,
  isMissing?: boolean
): EvidenceHeatmapToken {
  if (isMissing || confidence <= 0) {
    return {
      level: "missing",
      colorHex: "#ff5555",
      label: "MISSING EVIDENCE"
    };
  }

  if (confidence > 0.85) {
    return {
      level: "high",
      colorHex: "#38e5ff",
      label: "HIGH CONFIDENCE"
    };
  }

  if (confidence >= 0.71) {
    return {
      level: "medium",
      colorHex: "#5ca8ff",
      label: "MEDIUM CONFIDENCE"
    };
  }

  if (confidence > 0) {
    return {
      level: "weak",
      colorHex: "#ffb338",
      label: "WEAK EVIDENCE"
    };
  }

  return {
    level: "unanalysed",
    colorHex: "#6e7f8e",
    label: "UNANALYSED"
  };
}
