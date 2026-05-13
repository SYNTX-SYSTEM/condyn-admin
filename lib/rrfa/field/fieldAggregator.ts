import { ProjectedSignal } from '../signals/projectedSignal';
import { FieldTopology } from './fieldTopology';
import { SpatialKernel } from './spatialKernel';

/**
 * Field Aggregator - Main orchestration
 * 
 * Transforms individual projected signals into emergent field topology.
 * This is where local primitive weights become global field state.
 * 
 * Phase 2: The first step toward living topology
 */

export class FieldAggregator {
  
  /**
   * Aggregate projected signals into field topology
   * 
   * This is the main entry point for Phase 2.
   * Takes 300 individual signals and computes emergent field state.
   * 
   * @param signals - Array of projected signals with primitive weights
   * @param companyId - Company identifier
   * @returns Complete field topology with node states and global metrics
   */
  static aggregate(
    signals: ProjectedSignal[],
    companyId: string
  ): FieldTopology {
    
    if (signals.length === 0) {
      return this.emptyTopology(companyId);
    }
    
    // STEP 1: Aggregate signals by node
    // Groups all signals touching each node and computes average primitive weights
    const nodeMap = SpatialKernel.aggregateByNode(signals);
    const nodes = Array.from(nodeMap.values());
    
    // STEP 2: Calculate global field metrics
    // Network-wide statistics from node-level aggregations
    const globalMetrics = SpatialKernel.calculateGlobalMetrics(nodes);
    
    // STEP 3: Build spatial density map
    // Identify high-activity nodes, isolated nodes, and density clusters
    const densityMap = SpatialKernel.buildDensityMap(nodes, signals);
    
    // STEP 4: Assemble complete field topology
    return {
      company_id: companyId,
      timestamp: Date.now(),
      
      nodes,
      global_primitives: globalMetrics,
      spatial_density: densityMap,
      
      metadata: {
        signal_count: signals.length,
        aggregation_method: 'node_average',
        generated_at: new Date().toISOString()
      }
    };
  }
  
  /**
   * Create empty topology for zero signals
   */
  private static emptyTopology(companyId: string): FieldTopology {
    return {
      company_id: companyId,
      timestamp: Date.now(),
      
      nodes: [],
      
      global_primitives: {
        avg_propagation: 0,
        avg_density: 0,
        avg_coupling: 0,
        avg_decoupling: 0,
        max_delay: 0,
        drift_hotspots: 0,
        coupling_ratio: 0,
        stability_score: 1.0
      },
      
      spatial_density: {
        high_activity_nodes: [],
        isolated_nodes: [],
        density_clusters: []
      },
      
      metadata: {
        signal_count: 0,
        aggregation_method: 'node_average',
        generated_at: new Date().toISOString()
      }
    };
  }
}
