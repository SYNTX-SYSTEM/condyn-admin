import { ProjectedSignal } from '../signals/projectedSignal';
import { NodeFieldState, GlobalPrimitiveMetrics, DensityMap, DensityCluster } from './fieldTopology';

/**
 * Spatial Kernel - Aggregation computation logic
 * 
 * Pure functions for aggregating signals into field topology.
 * No side effects, fully deterministic.
 */

export class SpatialKernel {
  
  /**
   * Aggregate signals by node
   * Groups all signals touching each node and computes averages
   */
  static aggregateByNode(signals: ProjectedSignal[]): Map<string, NodeFieldState> {
    const nodeMap = new Map<string, NodeFieldState>();
    const nodeSignals = new Map<string, ProjectedSignal[]>();
    
    // Group signals by nodes they touch (from_carrier and to_carrier)
    for (const signal of signals) {
      const fromId = signal.from_carrier.carrier_id;
      const toId = signal.to_carrier.carrier_id;
      
      // Add to from_node
      if (!nodeSignals.has(fromId)) {
        nodeSignals.set(fromId, []);
      }
      nodeSignals.get(fromId)!.push(signal);
      
      // Add to to_node
      if (!nodeSignals.has(toId)) {
        nodeSignals.set(toId, []);
      }
      nodeSignals.get(toId)!.push(signal);
    }
    
    // Calculate aggregated primitives for each node
    for (const [nodeId, nodeSigs] of nodeSignals.entries()) {
      const carrier = nodeSigs[0].from_carrier.carrier_id === nodeId 
        ? nodeSigs[0].from_carrier 
        : nodeSigs[0].to_carrier;
      
      // Average all primitive weights
      const avgPrimitives = this.averagePrimitives(nodeSigs);
      
      // Calculate centrality (normalized signal count)
      const centrality = Math.min(1.0, nodeSigs.length / signals.length * 10);
      
      nodeMap.set(nodeId, {
        node_id: nodeId,
        carrier_type: carrier.carrier_type,
        primitives: avgPrimitives,
        signal_count: nodeSigs.length,
        centrality
      });
    }
    
    return nodeMap;
  }
  
  /**
   * Average primitive weights across multiple signals
   */
  private static averagePrimitives(signals: ProjectedSignal[]) {
    const sum = {
      coupling: 0,
      decoupling: 0,
      density: 0,
      diffusion: 0,
      propagation: 0,
      delay: 0,
      drift: 0
    };
    
    for (const signal of signals) {
      const w = signal.primitive_weights;
      sum.coupling += w.coupling || 0;
      sum.decoupling += w.decoupling || 0;
      sum.density += w.density || 0;
      sum.diffusion += w.diffusion || 0;
      sum.propagation += w.propagation || 0;
      sum.delay += w.delay || 0;
      sum.drift += w.drift || 0;
    }
    
    const count = signals.length;
    return {
      coupling: sum.coupling / count,
      decoupling: sum.decoupling / count,
      density: sum.density / count,
      diffusion: sum.diffusion / count,
      propagation: sum.propagation / count,
      delay: sum.delay / count,
      drift: sum.drift / count
    };
  }
  
  /**
   * Calculate global field metrics
   * Network-wide statistics from node states
   */
  static calculateGlobalMetrics(nodes: NodeFieldState[]): GlobalPrimitiveMetrics {
    if (nodes.length === 0) {
      return {
        avg_propagation: 0,
        avg_density: 0,
        avg_coupling: 0,
        avg_decoupling: 0,
        max_delay: 0,
        drift_hotspots: 0,
        coupling_ratio: 0,
        stability_score: 1.0
      };
    }
    
    let sumPropagation = 0;
    let sumDensity = 0;
    let sumCoupling = 0;
    let sumDecoupling = 0;
    let sumDrift = 0;
    let maxDelay = 0;
    let driftHotspots = 0;
    
    for (const node of nodes) {
      sumPropagation += node.primitives.propagation;
      sumDensity += node.primitives.density;
      sumCoupling += node.primitives.coupling;
      sumDecoupling += node.primitives.decoupling;
      sumDrift += node.primitives.drift;
      
      if (node.primitives.delay > maxDelay) {
        maxDelay = node.primitives.delay;
      }
      
      // Drift hotspot: drift > 0.5
      if (node.primitives.drift > 0.5) {
        driftHotspots++;
      }
    }
    
    const count = nodes.length;
    const avgCoupling = sumCoupling / count;
    const avgDecoupling = sumDecoupling / count;
    
    return {
      avg_propagation: sumPropagation / count,
      avg_density: sumDensity / count,
      avg_coupling: avgCoupling,
      avg_decoupling: avgDecoupling,
      max_delay: maxDelay,
      drift_hotspots: driftHotspots,
      coupling_ratio: avgCoupling + avgDecoupling > 0 
        ? avgCoupling / (avgCoupling + avgDecoupling)
        : 0,
      stability_score: 1.0 - (sumDrift / count)
    };
  }
  
  /**
   * Build spatial density map
   * Identify high-activity nodes, isolated nodes, and clusters
   */
  static buildDensityMap(
    nodes: NodeFieldState[],
    signals: ProjectedSignal[]
  ): DensityMap {
    if (nodes.length === 0) {
      return {
        high_activity_nodes: [],
        isolated_nodes: [],
        density_clusters: []
      };
    }
    
    // Sort by signal count
    const sorted = [...nodes].sort((a, b) => b.signal_count - a.signal_count);
    
    // High activity: top 20% or signal_count > avg
    const avgSignals = nodes.reduce((s, n) => s + n.signal_count, 0) / nodes.length;
    const highActivity = sorted
      .filter(n => n.signal_count > avgSignals)
      .map(n => n.node_id);
    
    // Isolated: bottom 20% or signal_count = 1
    const isolated = sorted
      .filter(n => n.signal_count <= 1)
      .map(n => n.node_id);
    
    // Simple clustering: group nodes with high density primitive
    const densityClusters = this.findDensityClusters(nodes);
    
    return {
      high_activity_nodes: highActivity,
      isolated_nodes: isolated,
      density_clusters: densityClusters
    };
  }
  
  /**
   * Find density clusters
   * Simple clustering based on density primitive
   */
  private static findDensityClusters(nodes: NodeFieldState[]): DensityCluster[] {
    // Find nodes with high density (> 0.5)
    const denseNodes = nodes.filter(n => n.primitives.density > 0.5);
    
    if (denseNodes.length === 0) return [];
    
    // Sort by density
    denseNodes.sort((a, b) => b.primitives.density - a.primitives.density);
    
    // Create clusters around top density nodes
    const clusters: DensityCluster[] = [];
    const maxClusters = Math.min(3, denseNodes.length);
    
    for (let i = 0; i < maxClusters; i++) {
      const center = denseNodes[i];
      
      // Simple: cluster contains center + nearby dense nodes
      const members = denseNodes
        .slice(0, Math.min(5, denseNodes.length))
        .map(n => n.node_id);
      
      clusters.push({
        center: center.node_id,
        members,
        density_score: center.primitives.density
      });
    }
    
    return clusters;
  }
}
