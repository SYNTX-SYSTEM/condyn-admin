import { TopologyProjection } from "./perception";

export interface ViewStyle {
  colorToken: string;
  shape: string;
  borderWidth: number;
  opacity: number;
}

export interface ViewNode {
  id: string;
  label: string;
  type: string;
  ringName: string;
  ringIndex: number;
  priorityGroup?: string;
  weight: number;
  tooltip: string;
  isCollapsible: boolean;
  isExpandedByDefault: boolean;
  style: ViewStyle;
}

export interface ViewEdgeStyle {
  strokeWidth: number;
  strokeColor: string;
  strokeStyle: "SOLID" | "DASHED" | "DOTTED";
  animated: boolean;
}

export interface ViewEdge {
  id: string;
  source: string;
  target: string;
  interactionForce: number;
  tooltip: string;
  style: ViewEdgeStyle;
}

export interface ViewGroup {
  id: string;
  label: string;
  type: "RING" | "PRIORITY";
  nodeIds: string[];
}

export interface CareerViewModel {
  analysisId: string;
  centerNodeId: string;
  nodes: ViewNode[];
  edges: ViewEdge[];
  groups: ViewGroup[];
}

/**
 * Transforms a TopologyProjection into a framework-independent JSON View Model.
 * Strictly excludes any engine-specific layout or position variables (no x, y, fx, fy, position, etc.).
 * Derives visual semantics, tooltips, and collapse flags deterministically without adding new business logic.
 */
export function buildViewModel(projection: TopologyProjection): CareerViewModel {
  const nodes: ViewNode[] = projection.nodes.map(node => {
    let shape = "CIRCLE";
    if (node.type === "CAPABILITY") shape = "HEXAGON";
    else if (node.type === "CONCRETE_ORGANIZATION" || node.type === "ORGANIZATION_CLASS") shape = "RECTANGLE";
    else if (node.type === "ROLE") shape = "PILL";

    const isCenter = node.id === projection.centerNodeId;
    const isCollapsible = node.ringIndex > 0;
    const isExpandedByDefault = node.ringIndex <= 1;

    return {
      id: node.id,
      label: node.label,
      type: node.type,
      ringName: node.ringName,
      ringIndex: node.ringIndex,
      priorityGroup: node.priorityGroup,
      weight: node.weight,
      tooltip: `${node.label} (${node.type}) — Weight: ${(node.weight * 100).toFixed(0)}%`,
      isCollapsible,
      isExpandedByDefault,
      style: {
        colorToken: node.colorToken,
        shape,
        borderWidth: isCenter ? 3 : 1,
        opacity: 1.0
      }
    };
  });

  const edges: ViewEdge[] = projection.edges.map(edge => {
    const isStrong = edge.interactionForce >= 0.9;
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      interactionForce: edge.interactionForce,
      tooltip: `Connection force: ${(edge.interactionForce * 100).toFixed(0)}%`,
      style: {
        strokeWidth: isStrong ? 2 : 1,
        strokeColor: "#999999",
        strokeStyle: isStrong ? "SOLID" : "DASHED",
        animated: edge.interactionForce >= 0.95
      }
    };
  });

  const ringGroupMap = new Map<number, { name: string; nodeIds: string[] }>();
  const prioGroupMap = new Map<string, string[]>();

  for (const node of projection.nodes) {
    if (!ringGroupMap.has(node.ringIndex)) {
      ringGroupMap.set(node.ringIndex, { name: node.ringName, nodeIds: [] });
    }
    ringGroupMap.get(node.ringIndex)!.nodeIds.push(node.id);

    if (node.priorityGroup) {
      if (!prioGroupMap.has(node.priorityGroup)) {
        prioGroupMap.set(node.priorityGroup, []);
      }
      prioGroupMap.get(node.priorityGroup)!.push(node.id);
    }
  }

  const groups: ViewGroup[] = [];

  // Add ring groups sorted deterministically by ringIndex
  const sortedRings = Array.from(ringGroupMap.entries()).sort((a, b) => a[0] - b[0]);
  for (const [ringIdx, ringData] of sortedRings) {
    groups.push({
      id: `group-ring-${ringIdx}`,
      label: ringData.name,
      type: "RING",
      nodeIds: ringData.nodeIds.sort()
    });
  }

  // Add priority groups sorted deterministically by group label
  const sortedPrios = Array.from(prioGroupMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [label, idList] of sortedPrios) {
    groups.push({
      id: `group-prio-${label.toLowerCase().replace(/\s+/g, "-")}`,
      label,
      type: "PRIORITY",
      nodeIds: idList.sort()
    });
  }

  return {
    analysisId: projection.analysisId,
    centerNodeId: projection.centerNodeId,
    nodes,
    edges,
    groups
  };
}
