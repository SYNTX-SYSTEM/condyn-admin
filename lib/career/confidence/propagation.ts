import { DirectedEvidenceGraph } from "../evidence/graph";
import { getSourceWeight } from "./weights";
import { aggregateCapabilityConfidence } from "./aggregation";

export interface NodeConfidenceState {
  nodeId: string;
  nodeType: "source" | "evidence" | "capability" | "requirement" | "job" | "organisation";
  confidence: number;
  score?: number;
}

export interface PropagatedGraphConfidence {
  evidenceConfidences: Record<string, number>;
  capabilityConfidences: Record<string, number>;
  requirementConfidences: Record<string, number>;
  jobScores: Record<string, number>;
  organisationScores: Record<string, number>;
  nodeStates: Record<string, NodeConfidenceState>;
}

/**
 * Pure Graph Physics engine that propagates confidence bottom-up along DirectedEvidenceGraph:
 * Evidence -> Capability -> Requirement -> Job -> Organisation
 */
export function propagateGraphConfidence(
  graph: DirectedEvidenceGraph
): PropagatedGraphConfidence {
  const evidenceConfidences: Record<string, number> = {};
  const capabilityConfidences: Record<string, number> = {};
  const requirementConfidences: Record<string, number> = {};
  const jobScores: Record<string, number> = {};
  const organisationScores: Record<string, number> = {};
  const nodeStates: Record<string, NodeConfidenceState> = {};

  // Map Source weights
  const sourceWeightMap: Record<string, number> = {};
  for (const src of graph.sourceNodes) {
    sourceWeightMap[src.id] = getSourceWeight(src.type);
    nodeStates[src.id] = {
      nodeId: src.id,
      nodeType: "source",
      confidence: sourceWeightMap[src.id]
    };
  }

  // 1. Evidence layer
  for (const ev of graph.evidenceNodes) {
    // Find upstream source via edge: Source -> contains -> Evidence
    const containsEdge = graph.edges.find(
      (e) => e.targetId === ev.id && e.edgeType === "contains"
    );
    const sourceWeight = containsEdge
      ? sourceWeightMap[containsEdge.sourceId] ?? getSourceWeight(ev.sourceType)
      : getSourceWeight(ev.sourceType);

    const propConf = Number((ev.confidence * sourceWeight).toFixed(4));
    evidenceConfidences[ev.id] = propConf;
    nodeStates[ev.id] = {
      nodeId: ev.id,
      nodeType: "evidence",
      confidence: propConf
    };
  }

  // 2. Capability layer
  for (const cap of graph.capabilityNodes) {
    // Find connected evidence via edge: Evidence -> supports -> Capability
    const supportingEdges = graph.edges.filter(
      (e) => e.targetId === cap.id && e.edgeType === "supports"
    );

    let capConfidence: number;
    if (supportingEdges.length > 0) {
      const aggregationInputs = supportingEdges.map((edge) => {
        const evNode = graph.evidenceNodes.find((n) => n.id === edge.sourceId);
        const containsEdge = graph.edges.find(
          (e) => e.targetId === edge.sourceId && e.edgeType === "contains"
        );
        const sourceNode = containsEdge
          ? graph.sourceNodes.find((s) => s.id === containsEdge.sourceId)
          : undefined;
        const sourceWeight = getSourceWeight(sourceNode?.type || evNode?.sourceType);

        return {
          evidenceScore: evNode?.confidence ?? 0.70,
          sourceWeight
        };
      });
      capConfidence = aggregateCapabilityConfidence(aggregationInputs);
    } else {
      capConfidence = 0;
    }

    capabilityConfidences[cap.id] = capConfidence;
    nodeStates[cap.id] = {
      nodeId: cap.id,
      nodeType: "capability",
      confidence: capConfidence
    };
  }

  // 3. Requirement layer
  for (const req of graph.requirementNodes) {
    // Find supporting capability via edge: Capability -> satisfies -> Requirement
    const satisfyingEdges = graph.edges.filter(
      (e) => e.targetId === req.id && e.edgeType === "satisfies"
    );

    let reqConf = 0;
    if (satisfyingEdges.length > 0) {
      const confs = satisfyingEdges.map(
        (edge) => capabilityConfidences[edge.sourceId] ?? 0
      );
      reqConf = Number(Math.max(...confs).toFixed(4));
    }

    requirementConfidences[req.id] = reqConf;
    nodeStates[req.id] = {
      nodeId: req.id,
      nodeType: "requirement",
      confidence: reqConf
    };
  }

  // 4. Job layer
  for (const job of graph.jobNodes) {
    // Find requirements belonging to job via edge: Requirement -> belongsTo -> Job
    const reqEdges = graph.edges.filter(
      (e) => e.targetId === job.id && e.edgeType === "belongsTo"
    );

    let totalScore = 0;
    let totalWeight = 0;

    for (const edge of reqEdges) {
      const reqNode = graph.requirementNodes.find((r) => r.id === edge.sourceId);
      const weight = reqNode?.weight ?? 0.5;
      const fulfillment = requirementConfidences[edge.sourceId] ?? 0;

      totalScore += fulfillment * weight;
      totalWeight += weight;
    }

    const jobScore =
      totalWeight > 0
        ? Number((totalScore / totalWeight).toFixed(4))
        : 0;

    jobScores[job.id] = jobScore;
    nodeStates[job.id] = {
      nodeId: job.id,
      nodeType: "job",
      confidence: jobScore,
      score: jobScore
    };
  }

  // 5. Organisation layer
  for (const org of graph.organisationNodes) {
    // Find jobs belonging to org via edge: Job -> belongsToOrg -> Organisation
    const jobEdges = graph.edges.filter(
      (e) => e.targetId === org.id && e.edgeType === "belongsToOrg"
    );

    let orgScore = 0;
    if (jobEdges.length > 0) {
      const scores = jobEdges.map((e) => jobScores[e.sourceId] ?? 0);
      orgScore = Number(Math.max(...scores).toFixed(4));
    }

    organisationScores[org.id] = orgScore;
    nodeStates[org.id] = {
      nodeId: org.id,
      nodeType: "organisation",
      confidence: orgScore,
      score: orgScore
    };
  }

  return {
    evidenceConfidences,
    capabilityConfidences,
    requirementConfidences,
    jobScores,
    organisationScores,
    nodeStates
  };
}
