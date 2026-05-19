import { VisualTier } from './primitiveVisuals';

/**
 * Perceptual Hierarchy v5 - target-image match
 *
 * Tier multipliers are now SOFT - all nodes visible and labeled.
 * Differentiation purely through size+glow modulation.
 */

export interface NodeLike {
  id: string;
  centrality: number;
  signal_count?: number;
}

export function computeTiers(nodes: NodeLike[]): Map<string, VisualTier> {
  const tierMap = new Map<string, VisualTier>();
  if (nodes.length === 0) return tierMap;

  const sorted = [...nodes].sort((a, b) => {
    if (b.centrality !== a.centrality) return b.centrality - a.centrality;
    return (b.signal_count ?? 0) - (a.signal_count ?? 0);
  });

  const n = sorted.length;
  const isSmallGraph = n <= 10;

  const primaryFraction   = isSmallGraph ? 0.40 : 0.25;
  const midgroundFraction = isSmallGraph ? 0.60 : 0.50;

  const primaryCount = Math.max(1, Math.ceil(n * primaryFraction));
  const midgroundEnd = primaryCount + Math.ceil(n * midgroundFraction);

  sorted.forEach((node, idx) => {
    if (idx < primaryCount) tierMap.set(node.id, 'primary');
    else if (idx < midgroundEnd) tierMap.set(node.id, 'midground');
    else tierMap.set(node.id, 'background');
  });

  return tierMap;
}

export interface TierMultipliers {
  size: number;
  glow: number;
  opacity: number;
}

/**
 * All tiers visible.
 * Differentiation: 1.0 / 0.85 / 0.70 — subtle.
 */
export function getTierMultipliers(tier: VisualTier): TierMultipliers {
  if (tier === 'primary')   return { size: 1.0,  glow: 1.0,  opacity: 1.0 };
  if (tier === 'midground') return { size: 0.85, glow: 0.85, opacity: 0.95 };
  return                          { size: 0.70, glow: 0.60, opacity: 0.85 };
}

export function getEdgeTier(sourceTier: VisualTier, targetTier: VisualTier): VisualTier {
  if (sourceTier === 'primary' || targetTier === 'primary') return 'primary';
  if (sourceTier === 'background' && targetTier === 'background') return 'background';
  return 'midground';
}

export function getEdgeOpacityMultiplier(tier: VisualTier): number {
  if (tier === 'primary') return 1.0;
  if (tier === 'midground') return 0.70;
  return 0.35;
}

/**
 * Particles on all visible edges - only pure background-background skips.
 */
export function shouldRenderParticles(edgeTier: VisualTier): boolean {
  return edgeTier !== 'background';
}
