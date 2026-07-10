import { DirectedEvidenceGraph, SourceNode, EvidenceNode, EvidenceGraphEdge } from "../evidence/graph";
import { propagateGraphConfidence, PropagatedGraphConfidence } from "./propagation";

export interface CurrentGraphState {
  graph: DirectedEvidenceGraph;
  propagated: PropagatedGraphConfidence;
  timestamp: string;
}

export interface SimulatedEvidenceInput {
  sourceTitle: string;
  sourceType: "github" | "pdf" | "website" | "linkedin";
  targetCapabilityId: string;
  evidenceExcerpt: string;
  evidenceScore: number;
}

export interface DeltaDetail {
  nodeId: string;
  nodeType: string;
  titleOrName: string;
  before: number;
  after: number;
  delta: number;
}

export interface SimulationResult {
  before: PropagatedGraphConfidence;
  after: PropagatedGraphConfidence;
  deltas: DeltaDetail[];
  simulatedGraphState: CurrentGraphState;
}

/**
 * Creates the active, fully propagated Current Graph State.
 */
export function createCurrentGraphState(
  graph: DirectedEvidenceGraph
): CurrentGraphState {
  const propagated = propagateGraphConfidence(graph);
  return {
    graph,
    propagated,
    timestamp: new Date().toISOString()
  };
}

/**
 * What-If Simulation Engine ("Decision Laboratory").
 * Simulates adding a new piece of evidence pointing to targetCapabilityId.
 * Never mutates baseGraph. Strictly pure and deterministic.
 */
export function simulateEvidenceImpact(
  baseGraph: DirectedEvidenceGraph,
  simulatedEvidence: SimulatedEvidenceInput
): SimulationResult {
  const before = propagateGraphConfidence(baseGraph);

  // Deep clone node & edge arrays to guarantee immutability
  const clonedGraph: DirectedEvidenceGraph = {
    sourceNodes: [...baseGraph.sourceNodes],
    evidenceNodes: [...baseGraph.evidenceNodes],
    capabilityNodes: [...baseGraph.capabilityNodes],
    requirementNodes: [...baseGraph.requirementNodes],
    jobNodes: [...baseGraph.jobNodes],
    organisationNodes: [...baseGraph.organisationNodes],
    edges: [...baseGraph.edges]
  };

  const simSourceId = `sim_source_${clonedGraph.sourceNodes.length + 1}`;
  const simEvidenceId = `sim_evidence_${clonedGraph.evidenceNodes.length + 1}`;

  const newSource: SourceNode = {
    id: simSourceId,
    title: simulatedEvidence.sourceTitle,
    type: simulatedEvidence.sourceType
  };

  const newEvidence: EvidenceNode = {
    id: simEvidenceId,
    sourceId: simSourceId,
    sourceType: simulatedEvidence.sourceType,
    excerpt: simulatedEvidence.evidenceExcerpt,
    confidence: simulatedEvidence.evidenceScore,
    location: { file: simulatedEvidence.sourceTitle },
    capabilities: [simulatedEvidence.targetCapabilityId],
    metadata: {}
  };

  const containsEdge: EvidenceGraphEdge = {
    id: `edge_${simSourceId}_contains_${simEvidenceId}`,
    sourceId: simSourceId,
    targetId: simEvidenceId,
    edgeType: "contains",
    weight: 1.0
  };

  const supportsEdge: EvidenceGraphEdge = {
    id: `edge_${simEvidenceId}_supports_${simulatedEvidence.targetCapabilityId}`,
    sourceId: simEvidenceId,
    targetId: simulatedEvidence.targetCapabilityId,
    edgeType: "supports",
    weight: simulatedEvidence.evidenceScore
  };

  clonedGraph.sourceNodes.push(newSource);
  clonedGraph.evidenceNodes.push(newEvidence);
  clonedGraph.edges.push(containsEdge, supportsEdge);

  const after = propagateGraphConfidence(clonedGraph);

  const deltas: DeltaDetail[] = [];

  // Compare capabilities
  for (const cap of baseGraph.capabilityNodes) {
    const b = before.capabilityConfidences[cap.id] ?? 0;
    const a = after.capabilityConfidences[cap.id] ?? 0;
    const diff = Number((a - b).toFixed(4));
    if (Math.abs(diff) > 0.0001) {
      deltas.push({
        nodeId: cap.id,
        nodeType: "capability",
        titleOrName: cap.name,
        before: b,
        after: a,
        delta: diff
      });
    }
  }

  // Compare requirements
  for (const req of baseGraph.requirementNodes) {
    const b = before.requirementConfidences[req.id] ?? 0;
    const a = after.requirementConfidences[req.id] ?? 0;
    const diff = Number((a - b).toFixed(4));
    if (Math.abs(diff) > 0.0001) {
      deltas.push({
        nodeId: req.id,
        nodeType: "requirement",
        titleOrName: req.requirementName,
        before: b,
        after: a,
        delta: diff
      });
    }
  }

  // Compare jobs
  for (const job of baseGraph.jobNodes) {
    const b = before.jobScores[job.id] ?? 0;
    const a = after.jobScores[job.id] ?? 0;
    const diff = Number((a - b).toFixed(4));
    if (Math.abs(diff) > 0.0001) {
      deltas.push({
        nodeId: job.id,
        nodeType: "job",
        titleOrName: job.title,
        before: b,
        after: a,
        delta: diff
      });
    }
  }

  // Compare organisations
  for (const org of baseGraph.organisationNodes) {
    const b = before.organisationScores[org.id] ?? 0;
    const a = after.organisationScores[org.id] ?? 0;
    const diff = Number((a - b).toFixed(4));
    if (Math.abs(diff) > 0.0001) {
      deltas.push({
        nodeId: org.id,
        nodeType: "organisation",
        titleOrName: org.name,
        before: b,
        after: a,
        delta: diff
      });
    }
  }

  return {
    before,
    after,
    deltas,
    simulatedGraphState: {
      graph: clonedGraph,
      propagated: after,
      timestamp: new Date().toISOString()
    }
  };
}
