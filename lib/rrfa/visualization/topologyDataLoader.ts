import { FieldTopology, NodeFieldState } from '../field/fieldTopology';
import { ProjectedSignal } from '../signals/projectedSignal';
import { PrimitiveWeights } from '../signals/projectedSignal';
import { VisualTier, PrimitiveVisuals } from './primitiveVisuals';
import { computeTiers, getEdgeTier } from './perceptualHierarchy';
import { reduceEdges } from './edgeReducer';

export interface ReactFlowNode {
  id: string;
  type: string;
  data: {
    label: string;
    primitives: any;
    signal_count: number;
    centrality: number;
    carrier_type: string;
    tier?: VisualTier;
  };
  position: { x: number; y: number };
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data: {
    primitives: Partial<PrimitiveWeights>;
    signal_count: number;
    source_tier?: VisualTier;
    target_tier?: VisualTier;
    edge_tier?: VisualTier;
    source_color?: string;
    target_color?: string;
  };
}

export class TopologyDataLoader {

  static async loadFieldTopology(companyId: string) {
    const response = await fetch(`/api/topology/${companyId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load topology');
    }

    const data = await response.json();
    const topology: FieldTopology = data.topology;
    const signals: ProjectedSignal[] = data.signals;

    const tierMap = computeTiers(
      topology.nodes.map(n => ({ id: n.node_id, centrality: n.centrality, signal_count: n.signal_count }))
    );

    // Map node_id → carrier color for edge injection
    const colorMap = new Map<string, string>();
    for (const n of topology.nodes) {
      colorMap.set(n.node_id, PrimitiveVisuals.carrierTypeToColor(n.carrier_type));
    }

    return {
      nodes: this.transformNodes(topology.nodes, tierMap),
      edges: reduceEdges(this.buildEdgesFromSignals(signals, tierMap, colorMap)).kept,
      globals: topology.global_primitives
    };
  }

  private static transformNodes(
    nodes: NodeFieldState[],
    tierMap: Map<string, VisualTier>
  ): ReactFlowNode[] {
    return nodes.map(node => ({
      id: node.node_id,
      type: 'field',
      data: {
        label: node.node_id,
        primitives: node.primitives,
        signal_count: node.signal_count,
        centrality: node.centrality,
        carrier_type: node.carrier_type,
        tier: tierMap.get(node.node_id) ?? 'midground'
      },
      position: { x: 0, y: 0 }
    }));
  }

  private static buildEdgesFromSignals(
    signals: ProjectedSignal[],
    tierMap: Map<string, VisualTier>,
    colorMap: Map<string, string>
  ): ReactFlowEdge[] {
    const edgeMap = new Map<string, { signals: ProjectedSignal[] }>();

    for (const signal of signals) {
      const fromId = signal.from_carrier.carrier_id;
      const toId = signal.to_carrier.carrier_id;
      const edgeId = `${fromId}->${toId}`;

      if (!edgeMap.has(edgeId)) {
        edgeMap.set(edgeId, { signals: [] });
      }
      edgeMap.get(edgeId)!.signals.push(signal);
    }

    const edges: ReactFlowEdge[] = [];

    for (const [edgeId, data] of edgeMap) {
      const [fromId, toId] = edgeId.split('->');
      const avgPrimitives = this.averagePrimitives(data.signals.map(s => s.primitive_weights));

      const sourceTier = tierMap.get(fromId) ?? 'midground';
      const targetTier = tierMap.get(toId) ?? 'midground';
      const edgeTier = getEdgeTier(sourceTier, targetTier);

      edges.push({
        id: edgeId,
        source: fromId,
        target: toId,
        type: 'field',
        data: {
          primitives: avgPrimitives,
          signal_count: data.signals.length,
          source_tier: sourceTier,
          target_tier: targetTier,
          edge_tier: edgeTier,
          source_color: colorMap.get(fromId) ?? '#64c8ff',
          target_color: colorMap.get(toId) ?? '#64c8ff'
        }
      });
    }

    return edges;
  }

  private static averagePrimitives(weights: PrimitiveWeights[]): Partial<PrimitiveWeights> {
    if (weights.length === 0) return {};

    const sum: any = { coupling: 0, decoupling: 0, propagation: 0, delay: 0, drift: 0 };

    for (const w of weights) {
      sum.coupling += w.coupling || 0;
      sum.decoupling += w.decoupling || 0;
      sum.propagation += w.propagation || 0;
      sum.delay += w.delay || 0;
      sum.drift += w.drift || 0;
    }

    const count = weights.length;
    return {
      coupling: sum.coupling / count,
      decoupling: sum.decoupling / count,
      propagation: sum.propagation / count,
      delay: sum.delay / count,
      drift: sum.drift / count
    };
  }
}
