import { CareerViewModel, ViewNode, ViewEdge, ViewGroup } from "./view-model";

export interface LayoutNode extends ViewNode {
  x: number;
  y: number;
}

export interface LayoutEdge extends ViewEdge {}

export interface CareerLayoutModel {
  analysisId: string;
  centerNodeId: string;
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  groups: ViewGroup[];
}

/**
 * Transforms a framework-independent View Model into an engine-neutral Radial Layout Model.
 * Positions centerNodeId strictly at { x: 0, y: 0 } and distributes non-center nodes
 * deterministically along concentric ring circles (radius = ringIndex * 250).
 * Excludes any ReactFlow or D3 specific keys (position, data, sourceHandle, targetHandle, fx, fy).
 */
export function buildRadialLayout(viewModel: CareerViewModel): CareerLayoutModel {
  // Group nodes by ringIndex to calculate circular angles
  const nodesByRing = new Map<number, string[]>();
  for (const node of viewModel.nodes) {
    if (!nodesByRing.has(node.ringIndex)) {
      nodesByRing.set(node.ringIndex, []);
    }
    nodesByRing.get(node.ringIndex)!.push(node.id);
  }

  // Sort IDs within each ring to ensure 100% determinism
  for (const [_, idList] of nodesByRing.entries()) {
    idList.sort();
  }

  const nodes: LayoutNode[] = viewModel.nodes.map(node => {
    let x = 0;
    let y = 0;

    if (node.id !== viewModel.centerNodeId && node.ringIndex > 0) {
      const ringNodes = nodesByRing.get(node.ringIndex) || [node.id];
      const indexInRing = ringNodes.indexOf(node.id);
      const count = ringNodes.length;
      const radius = node.ringIndex * 250;
      // Angle starting at top (-pi/2) and distributing clockwise
      const angle = (2 * Math.PI * indexInRing) / count - Math.PI / 2;
      x = Math.round(radius * Math.cos(angle));
      y = Math.round(radius * Math.sin(angle));
    }

    // Return pure copy with x and y added, ensuring no ReactFlow/D3 keys exist
    return {
      ...node,
      x,
      y
    };
  });

  return {
    analysisId: viewModel.analysisId,
    centerNodeId: viewModel.centerNodeId,
    nodes,
    edges: viewModel.edges.map(e => ({ ...e })),
    groups: viewModel.groups.map(g => ({ ...g }))
  };
}
