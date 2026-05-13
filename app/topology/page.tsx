/**
 * Topology Page
 * 
 * RRFA Field Topology Visualization
 * 
 * Shows emergent field structure from field_topology.json
 * Real edges from signal flow, not fake connections
 * Soft force layout, breathing nodes, flow animation
 * 
 * This is perception, not dashboard.
 */

import FieldTopologyView from './FieldTopologyView';

export default function TopologyPage() {
  return <FieldTopologyView />;
}
