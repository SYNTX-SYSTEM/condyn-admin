/**
 * Field Topology - Aggregated field state
 * 
 * Phase 2: Emergent topology from primitive weights
 * 
 * This represents the GLOBAL field state computed from
 * individual signal primitive weights.
 */

/**
 * Node-level field state
 * Aggregated primitives for a single node in the topology
 */
export interface NodeFieldState {
  node_id: string;
  carrier_type: string;
  
  // Aggregated primitive weights for this node
  primitives: {
    coupling: number;       // avg coupling involving this node
    decoupling: number;     // avg decoupling
    density: number;        // avg activity density at node
    diffusion: number;      // avg activity diffusion
    propagation: number;    // avg propagation quality
    delay: number;          // avg delay
    drift: number;          // avg structural drift
  };
  
  // Node statistics
  signal_count: number;     // how many signals touch this node
  centrality: number;       // how central is this node (0.0-1.0)
}

/**
 * Global field metrics
 * Network-wide aggregated measures
 */
export interface GlobalPrimitiveMetrics {
  // Network-wide primitive averages
  avg_propagation: number;
  avg_density: number;
  avg_coupling: number;
  avg_decoupling: number;
  
  // Network health indicators
  max_delay: number;              // worst delay in network
  drift_hotspots: number;         // count of high-drift nodes
  coupling_ratio: number;         // coupling / (coupling + decoupling)
  stability_score: number;        // 1 - avg_drift
}

/**
 * Spatial density distribution
 */
export interface DensityMap {
  high_activity_nodes: string[];  // nodes with high signal count
  isolated_nodes: string[];       // nodes with low connectivity
  density_clusters: DensityCluster[];
}

export interface DensityCluster {
  center: string;                 // central node ID
  members: string[];              // nodes in cluster
  density_score: number;          // cluster density (0.0-1.0)
}

/**
 * Complete field topology
 * The emergent state of the relational field
 */
export interface FieldTopology {
  company_id: string;
  timestamp: number;
  
  // Node-level field states
  nodes: NodeFieldState[];
  
  // Global field metrics
  global_primitives: GlobalPrimitiveMetrics;
  
  // Spatial distribution
  spatial_density: DensityMap;
  
  // Metadata
  metadata: {
    signal_count: number;
    aggregation_method: string;
    generated_at: string;
  };
}
