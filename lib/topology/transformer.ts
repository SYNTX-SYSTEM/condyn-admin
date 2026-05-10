import type { TopologyData, ReactFlowNode, ReactFlowEdge } from '@/types/topology';
import { getNodeFieldState, getLinkFieldState } from './fieldStates';

interface TransformResult {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

export function transformToReactFlow(data: TopologyData): TransformResult {
  const { network, links } = data;
  
  const nodes: ReactFlowNode[] = network.nodes.map((nodeId, idx) => {
    const fieldState = getNodeFieldState(nodeId);
    
    const gridSize = 5;
    const spacing = 200;
    const x = 100 + (idx % gridSize) * spacing;
    const y = 100 + Math.floor(idx / gridSize) * spacing;
    
    let nodeType: 'signal' | 'event' | 'kpi' | 'artifact' = 'artifact';
    if (nodeId.startsWith('SIG')) nodeType = 'signal';
    else if (nodeId.startsWith('EVT')) nodeType = 'event';
    else if (nodeId.startsWith('KPI')) nodeType = 'kpi';
    
    return {
      id: nodeId,
      position: { x, y },
      data: {
        label: nodeId,
        nodeType,
      },
      style: {
        background: fieldState.background,
        border: `2px solid ${fieldState.border}`,
        borderRadius: '8px',
        padding: '12px 16px',
        color: fieldState.text,
        fontSize: '11px',
        fontWeight: '600',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    };
  });
  
  const edges: ReactFlowEdge[] = links.map((link) => {
    const linkState = getLinkFieldState(link.weight);
    
    return {
      id: link.link_id,
      source: link.source,
      target: link.target,
      animated: link.weight > 0.8,
      style: {
        stroke: linkState,
        strokeWidth: 1 + link.weight * 2,
      },
    };
  });
  
  return { nodes, edges };
}
