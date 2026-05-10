export interface Company {
  company_id: string;
  name: string;
  industry: string;
  size: number;
  region: string;
  simulation: boolean;
  created_at: string;
}

export interface TopologyCharacteristics {
  authority_centralization: number;
  workflow_instability: number;
  turnover_pressure: number;
  signal_density: number;
  bottleneck_probability: number;
}

export interface Network {
  network_id: string;
  company_id: string;
  nodes: string[];
  edges: string[];
  topology_characteristics: TopologyCharacteristics;
  generated_at: string;
  network_type: string;
}

export interface Signal {
  signal_id: string;
  company_id: string;
  signal_type: string;
  confidence: number;
  linked_artifacts?: string[];
  linked_roles?: string[];
  detected_at: string;
  description?: string;
}

export interface Link {
  link_id: string;
  company_id: string;
  source: string;
  target: string;
  relation: string;
  weight: number;
  timestamp: string;
}

export interface Event {
  event_id: string;
  company_id: string;
  timestamp: string;
  event_type: string;
  source_artifact: string;
  trigger: string;
  affected_roles: string[];
  structural_changes: any[];
}

export interface TopologyData {
  company: Company;
  network: Network;
  signals: Signal[];
  links: Link[];
  events: Event[];
}

export interface ReactFlowNode {
  id: string;
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType: 'signal' | 'event' | 'kpi' | 'artifact';
  };
  style?: any;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: any;
}
