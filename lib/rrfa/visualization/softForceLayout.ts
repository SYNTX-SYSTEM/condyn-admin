/**
 * Soft Force Layout v5 - wide spread for label+halo visibility
 *
 * Halos are now 45px blur radius and labels extend above/below the node.
 * Need ~120px+ effective spacing between node centers.
 */

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  SimulationNodeDatum,
  SimulationLinkDatum
} from 'd3-force';

interface LayoutNode extends SimulationNodeDatum {
  id: string;
  [key: string]: any;
}

interface LayoutEdge extends SimulationLinkDatum<LayoutNode> {
  source: string | LayoutNode;
  target: string | LayoutNode;
  [key: string]: any;
}

export function applySoftForceLayout(
  nodes: any[],
  edges: any[],
  width: number = 1200,
  height: number = 800
): any[] {

  const layoutNodes: LayoutNode[] = nodes.map(n => ({ ...n }));
  const layoutEdges: LayoutEdge[] = edges.map(e => ({ ...e }));

  const simulation = forceSimulation(layoutNodes)
    .force('charge', forceManyBody()
      .strength(-550)              // strong spread
      .distanceMax(700)
    )
    .force('center', forceCenter(width / 2, height / 2)
      .strength(0.05)
    )
    .force('link', forceLink(layoutEdges)
      .id((d: any) => d.id)
      .distance(240)               // generous edge length
      .strength(0.18)
    )
    .force('collision', forceCollide()
      .radius(85)                  // accounts for node + halo + label
      .strength(0.9)
    )
    .alpha(0.7)
    .alphaTarget(0.02)
    .velocityDecay(0.55);

  for (let i = 0; i < 400; i++) {
    simulation.tick();
  }

  return layoutNodes.map(node => ({
    ...nodes.find(n => n.id === node.id),
    position: {
      x: node.x || 0,
      y: node.y || 0
    }
  }));
}
