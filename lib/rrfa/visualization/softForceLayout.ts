/**
 * Soft Force Layout
 * 
 * Positions nodes using gentle d3-force simulation.
 * 
 * NOT: Explosive chaos physics
 * NOT: Random bouncing
 * NOT: Frantic realtime shifting
 * 
 * BUT: Stable breathing topology
 *      Langsam, träge, organisch
 *      Semiotisch lesbar
 * 
 * This creates Feldwahrnehmung, not videogame physics.
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

/**
 * Apply soft force layout to nodes
 * 
 * Creates organic positioning with gentle forces
 * Never fully settles (breathing effect)
 */
export function applySoftForceLayout(
  nodes: any[],
  edges: any[],
  width: number = 800,
  height: number = 600
): any[] {
  
  // Create mutable copies for d3-force
  const layoutNodes: LayoutNode[] = nodes.map(n => ({ ...n }));
  const layoutEdges: LayoutEdge[] = edges.map(e => ({ ...e }));
  
  // SOFT force simulation (not explosive!)
  const simulation = forceSimulation(layoutNodes)
    .force('charge', forceManyBody()
      .strength(-100)  // Gentle repulsion (NOT -1000!)
    )
    .force('center', forceCenter(width / 2, height / 2))
    .force('link', forceLink(layoutEdges)
      .id((d: any) => d.id)
      .distance(100)   // Comfortable spacing
      .strength(0.3)   // Soft attraction (not rigid!)
    )
    .force('collision', forceCollide()
      .radius(30)      // Prevent overlap
      .strength(0.5)   // Soft collision avoidance
    )
    .alpha(0.3)        // Slow initial movement
    .alphaTarget(0.05) // Never fully stops (breathing!)
    .velocityDecay(0.7); // Heavy damping (träge!)
  
  // Run simulation for initial stable layout
  // (200 ticks gives good stability without over-cooking)
  for (let i = 0; i < 200; i++) {
    simulation.tick();
  }
  
  // Return positioned nodes
  return layoutNodes.map(node => ({
    ...nodes.find(n => n.id === node.id),
    position: { 
      x: node.x || 0, 
      y: node.y || 0 
    }
  }));
}

/**
 * Force Layout Parameters Explained
 * 
 * charge.strength = -100
 *   Nodes repel each other gently
 *   NOT -1000 (explosive chaos!)
 *   BUT -100 (comfortable spacing)
 * 
 * link.strength = 0.3
 *   Edges pull connected nodes together softly
 *   NOT 1.0 (rigid constraints!)
 *   BUT 0.3 (organic flexibility)
 * 
 * alpha = 0.3
 *   Initial simulation energy
 *   Lower = slower, more stable
 * 
 * alphaTarget = 0.05
 *   Simulation never fully stops
 *   Creates "breathing" effect
 *   Field stays alive, not frozen
 * 
 * velocityDecay = 0.7
 *   Heavy damping (träge!)
 *   Nodes move slowly, deliberately
 *   NOT bouncy chaos
 * 
 * Result:
 *   Stable, organic, breathing topology
 *   Feldwahrnehmung, not videogame
 */
