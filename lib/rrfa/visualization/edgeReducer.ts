/**
 * Edge Reducer v4 - structural suppression
 *
 * 70% of edges silent. Only dominant signal paths survive.
 * The graph should feel sparse — space between structures
 * carries as much meaning as the structures themselves.
 */

export interface EdgeForReduction {
  source: string;
  target: string;
  data?: {
    primitives?: { coupling?: number; propagation?: number; drift?: number; };
    edge_tier?: string;
  };
}

export interface ReductionStats { total: number; kept: number; dropped: number; }

const DEFAULT_MIN_WEIGHT = 0.45;
const DEFAULT_TOP_K_PER_SOURCE = 3;

function getEdgeWeight<E extends EdgeForReduction>(e: E): number {
  const p = e.data?.primitives ?? {};
  return Math.max(p.propagation ?? 0, p.coupling ?? 0, p.drift ?? 0);
}

export function reduceEdges<E extends EdgeForReduction>(
  edges: E[],
  minWeight: number = DEFAULT_MIN_WEIGHT,
  topKPerSource: number = DEFAULT_TOP_K_PER_SOURCE
): { kept: E[]; stats: ReductionStats } {
  const total = edges.length;
  const aboveThreshold = edges.filter(e => getEdgeWeight(e) >= minWeight);

  const bySource = new Map<string, E[]>();
  for (const e of aboveThreshold) {
    if (!bySource.has(e.source)) bySource.set(e.source, []);
    bySource.get(e.source)!.push(e);
  }

  const kept: E[] = [];
  for (const [, sourceEdges] of bySource) {
    sourceEdges.sort((a, b) => getEdgeWeight(b) - getEdgeWeight(a));
    kept.push(...sourceEdges.slice(0, topKPerSource));
  }

  return { kept, stats: { total, kept: kept.length, dropped: total - kept.length } };
}
