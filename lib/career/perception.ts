import { VerifiedCareerAnalysis } from "./types";

export interface ProjectedNode {
  id: string;
  type: string;
  label: string;
  ringName: string;
  ringIndex: number;
  colorToken: string;
  priorityGroup?: string;
  weight: number;
  position: { x: number; y: number };
}

export interface ProjectedEdge {
  id: string;
  source: string;
  target: string;
  interactionForce: number;
  relationType?: string;
}

export interface TopologyProjection {
  analysisId: string;
  centerNodeId: string;
  nodes: ProjectedNode[];
  edges: ProjectedEdge[];
}

/**
 * Transforms a VERIFIED canonical career analysis into a decoupled TopologyProjection
 * suitable for ReactFlow or D3-Force rendering.
 * Enforces Stamp Guard, 1:1 immutability, and deterministic circular coordinates.
 */
export function projectTopology(analysis: VerifiedCareerAnalysis): TopologyProjection {
  const state = analysis?.structured_data?.analysis?.metadata?.validation_state;
  if (state !== "VERIFIED") {
    throw new Error(`ERR_UNVERIFIED_ANALYSIS_PROJECTION: Cannot project analysis with state "${state}". Only VERIFIED analyses may be projected.`);
  }

  const meta = analysis.structured_data.analysis.metadata;
  const presentation = analysis.structured_data.presentation;
  const uiLayout = presentation.ui_layout;
  const semanticGraph = presentation.semantic_graph;

  // Build entity lookup map for label resolution
  const entityMap = new Map<string, { label: string; type: string }>();
  const relationMap = new Map<string, string>();

  const register = (arr?: Array<{ entity_id: string; identity: { name?: string; title?: string; type: string }; relationships?: Array<{ target_id: string; relation_type: string }> }>) => {
    if (!arr) return;
    for (const item of arr) {
      const label = item.identity?.name || item.identity?.title || item.entity_id;
      entityMap.set(item.entity_id, { label, type: item.identity?.type || "UNKNOWN" });
      if (item.relationships) {
        for (const rel of item.relationships) {
          relationMap.set(`${item.entity_id}->${rel.target_id}`, rel.relation_type);
          relationMap.set(`${rel.target_id}->${item.entity_id}`, rel.relation_type);
        }
      }
    }
  };

  const domainAnalysis = analysis.structured_data.analysis;
  register(domainAnalysis.capabilities as any);
  register(domainAnalysis.domains as any);
  register(domainAnalysis.organization_classes as any);
  register(domainAnalysis.organizations as any);
  register(domainAnalysis.roles as any);
  register(domainAnalysis.opportunities as any);
  register(domainAnalysis.strategies as any);
  register(domainAnalysis.search_queries as any);
  register(domainAnalysis.documents as any);

  // Map ring lookup
  const ringMap = new Map<string, { ringIndex: number; name: string }>();
  for (const ring of uiLayout.concentric_rings) {
    for (const nodeId of ring.node_ids) {
      ringMap.set(nodeId, { ringIndex: ring.ring_index, name: ring.name });
    }
  }

  // Map priority group lookup
  const priorityMap = new Map<string, string>();
  if (uiLayout.priority_groups) {
    for (const grp of uiLayout.priority_groups) {
      for (const nodeId of grp.node_ids) {
        priorityMap.set(nodeId, grp.label);
      }
    }
  }

  // Group nodes by ringIndex to calculate deterministic circular angles
  const nodesByRing = new Map<number, string[]>();
  for (const node of semanticGraph.nodes) {
    const ringInfo = ringMap.get(node.node_id) || { ringIndex: 0, name: "Core" };
    if (!nodesByRing.has(ringInfo.ringIndex)) {
      nodesByRing.set(ringInfo.ringIndex, []);
    }
    nodesByRing.get(ringInfo.ringIndex)!.push(node.node_id);
  }

  // Sort node IDs within each ring to guarantee 100% determinism regardless of input order
  for (const [_, idList] of nodesByRing.entries()) {
    idList.sort();
  }

  // Calculate coordinates and build ProjectedNodes
  const projectedNodes: ProjectedNode[] = [];
  for (const node of semanticGraph.nodes) {
    const entityInfo = entityMap.get(node.node_id) || { label: node.node_id, type: node.entity_type };
    const ringInfo = ringMap.get(node.node_id) || { ringIndex: 0, name: "Core" };
    const colorToken = (uiLayout.color_tokens as any)[node.entity_type] || "#808080";
    const priorityGroup = priorityMap.get(node.node_id);

    let position = { x: 0, y: 0 };
    if (ringInfo.ringIndex > 0) {
      const ringNodes = nodesByRing.get(ringInfo.ringIndex) || [node.node_id];
      const indexInRing = ringNodes.indexOf(node.node_id);
      const count = ringNodes.length;
      const radius = ringInfo.ringIndex * 250;
      // Angle starting at top (-pi/2) and distributing clockwise
      const angle = (2 * Math.PI * indexInRing) / count - Math.PI / 2;
      position = {
        x: Math.round(radius * Math.cos(angle)),
        y: Math.round(radius * Math.sin(angle))
      };
    }

    projectedNodes.push({
      id: node.node_id,
      type: entityInfo.type,
      label: entityInfo.label,
      ringName: ringInfo.name,
      ringIndex: ringInfo.ringIndex,
      colorToken,
      priorityGroup,
      weight: node.weight,
      position
    });
  }

  // Build ProjectedEdges
  const projectedEdges: ProjectedEdge[] = semanticGraph.edges.map(edge => ({
    id: `edge-${edge.source_id}-${edge.target_id}`,
    source: edge.source_id,
    target: edge.target_id,
    interactionForce: edge.interaction_force,
    relationType: (edge as any).relation_type || relationMap.get(`${edge.source_id}->${edge.target_id}`) || undefined
  }));

  return {
    analysisId: meta.analysis_id || "UNKNOWN",
    centerNodeId: uiLayout.center_node_id,
    nodes: projectedNodes,
    edges: projectedEdges
  };
}
