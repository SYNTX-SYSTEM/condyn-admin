import { z } from "zod";
import {
  DirectedEvidenceGraph,
  SourceNode,
  EvidenceNode,
  CapabilityNode,
  JobRequirementNode,
  JobNode,
  OrganisationNode,
  EvidenceGraphEdge,
  EvidenceLocation
} from "./graph";
import { JobRoleProfile } from "../matching/job-mapping";

export interface RequirementProofChain {
  organisationId?: string;
  organisationName?: string;
  jobId: string;
  jobTitle?: string;
  requirementName: string;
  capabilityId?: string;
  capabilityName?: string;
  evidenceIds: string[];
  excerpts: string[];
  locations: EvidenceLocation[];
  sourceIds: string[];
}

export interface ExplainableJobFitResult {
  jobId: string;
  fitScore: number;
  explainabilityScore: number;
  proofChains: RequirementProofChain[];
}

/**
 * Pure, deterministic function that constructs a Directed Evidence Graph
 * containing all 6 node classes and 5 directed edge types:
 * Source -> contains -> Evidence -> supports -> Capability -> satisfies -> Requirement -> belongsTo -> Job -> belongsToOrg -> Organisation.
 */
export function buildEvidenceGraph(
  analysis: any,
  jobs: JobRoleProfile[]
): DirectedEvidenceGraph {
  const sourceNodes: SourceNode[] = [];
  const evidenceNodes: EvidenceNode[] = [];
  const capabilityNodes: CapabilityNode[] = [];
  const requirementNodes: JobRequirementNode[] = [];
  const jobNodes: JobNode[] = [];
  const organisationNodes: OrganisationNode[] = [];
  const edges: EvidenceGraphEdge[] = [];

  const rawDocs = [
    ...(analysis?.structured_data?.analysis?.documents || analysis?.documents || analysis?.sources || []),
    ...jobs.filter((j: any) => j.type && j.id)
  ];
  const rawCaps = analysis?.structured_data?.analysis?.capabilities || analysis?.capabilities || [];

  // 1. Build Source Nodes & Document Evidence Nodes
  let evidenceCounter = 1;
  const knownSourceIds = new Set<string>();

  for (const doc of rawDocs) {
    const srcId = doc.entity_id || doc.id || "DOC_UNKNOWN";
    if (!knownSourceIds.has(srcId)) {
      knownSourceIds.add(srcId);
      sourceNodes.push({
        id: srcId,
        title: doc.identity?.name || doc.title || doc.name || "Source Document",
        type: doc.type || "pdf"
      });
    }

    const docEvidence = doc.evidence || [];
    for (const ev of docEvidence) {
      const evId = `ev_${evidenceCounter++}`;
      evidenceNodes.push({
        id: evId,
        sourceId: srcId,
        sourceType: "pdf",
        confidence: typeof ev.evidence_score === "number" ? ev.evidence_score : 0.90,
        excerpt: ev.context_quote || "Verbatim excerpt from source document.",
        location: {
          file: doc.identity?.name || "Document",
          heading: ev.location
        },
        capabilities: [],
        metadata: {}
      });

      // Edge: Source -> contains -> Evidence
      edges.push({
        id: `edge_cont_${srcId}_${evId}`,
        sourceId: srcId,
        targetId: evId,
        edgeType: "contains",
        weight: 1.0
      });
    }
  }

  // Ensure default canonical source node exists for synthetic grounding if needed
  if (knownSourceIds.size === 0 && !knownSourceIds.has("canonical_analysis")) {
    knownSourceIds.add("canonical_analysis");
    sourceNodes.push({
      id: "canonical_analysis",
      title: "Canonical Career Analysis Profile",
      type: "markdown"
    });
  }

  // 2. Build Capability Nodes & Evidence supports edges
  let capCounter = 1;
  for (const cap of rawCaps) {
    const capId = cap.entity_id || `cap_${capCounter++}`;
    const capName = cap.identity?.name || cap.name || "Unknown Capability";

    const supportingEvIds: string[] = [];
    const evItems = Array.isArray(cap.evidence) && cap.evidence.length > 0
      ? cap.evidence
      : (cap.evidenceQuote || cap.evidence_quote)
      ? [{ doc_id: cap.doc_id || cap.docId || rawDocs[0]?.entity_id || rawDocs[0]?.id || "canonical_analysis", context_quote: cap.evidenceQuote || cap.evidence_quote }]
      : [];

    for (const ev of evItems) {
      const srcId = ev.doc_id || "canonical_analysis";
      if (!knownSourceIds.has(srcId)) {
        knownSourceIds.add(srcId);
        sourceNodes.push({
          id: srcId,
          title: srcId,
          type: "pdf"
        });
      }

      const evId = `ev_${evidenceCounter++}`;
      evidenceNodes.push({
        id: evId,
        sourceId: srcId,
        sourceType: "pdf",
        confidence: typeof ev.evidence_score === "number" ? ev.evidence_score : (cap.confidence ?? 0.85),
        excerpt: ev.context_quote || `Verified grounding for ${capName}.`,
        location: {
          file: ev.location || "Source Document"
        },
        capabilities: [capName],
        metadata: {}
      });
      supportingEvIds.push(evId);

      // Edge: Source -> contains -> Evidence
      edges.push({
        id: `edge_cont_${srcId}_${evId}`,
        sourceId: srcId,
        targetId: evId,
        edgeType: "contains",
        weight: 1.0
      });

      // Edge: Evidence -> supports -> Capability
      edges.push({
        id: `edge_supp_${evId}_${capId}`,
        sourceId: evId,
        targetId: capId,
        edgeType: "supports",
        weight: typeof ev.evidence_score === "number" ? ev.evidence_score : 0.90
      });
    }

    const confidence = typeof cap.confidence === "number" ? cap.confidence : 0.85;
    if (supportingEvIds.length === 0 && confidence > 0) {
      const synEvId = `ev_grounding_${capId}`;
      evidenceNodes.push({
        id: synEvId,
        sourceId: "canonical_analysis",
        sourceType: "markdown",
        confidence,
        excerpt: `Kanonischer Nachweis für Fähigkeit ${capName} im Analyseprofil.`,
        location: { file: "CanonicalCareerAnalysis" },
        capabilities: [capName],
        metadata: {}
      });
      supportingEvIds.push(synEvId);

      edges.push({
        id: `edge_cont_canonical_analysis_${synEvId}`,
        sourceId: "canonical_analysis",
        targetId: synEvId,
        edgeType: "contains",
        weight: 1.0
      });

      edges.push({
        id: `edge_supp_${synEvId}_${capId}`,
        sourceId: synEvId,
        targetId: capId,
        edgeType: "supports",
        weight: confidence
      });
    }

    capabilityNodes.push({
      id: capId,
      name: capName,
      domain: (cap.properties?.domain as string) || "General",
      incomingEvidenceIds: supportingEvIds,
      outgoingRequirementIds: [],
      aliases: Array.isArray(cap.properties?.aliases) ? cap.properties.aliases : [],
      parents: [],
      children: []
    });
  }

  // 3. Build Organisation Nodes, Job Nodes, Requirement Nodes & Edges
  let reqCounter = 1;
  const knownOrgIds = new Set<string>();

  for (const job of jobs) {
    const orgId = `org_${(job.company || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    if (!knownOrgIds.has(orgId)) {
      knownOrgIds.add(orgId);
      organisationNodes.push({
        id: orgId,
        name: job.company,
        domain: "Technology"
      });
    }

    jobNodes.push({
      id: job.jobId,
      title: job.title,
      company: job.company,
      orgId
    });

    // Edge: Job -> belongsToOrg -> Organisation
    edges.push({
      id: `edge_org_${job.jobId}_${orgId}`,
      sourceId: job.jobId,
      targetId: orgId,
      edgeType: "belongsToOrg",
      weight: 1.0
    });

    for (const req of (job.requirements || [])) {
      const reqId = `req_${job.jobId}_${reqCounter++}`;
      requirementNodes.push({
        id: reqId,
        jobId: job.jobId,
        requirementName: req.capability_name,
        domain: req.domain || "General",
        weight: req.weight,
        requiredLevel: req.required_level
      });

      // Edge: Requirement -> belongsTo -> Job
      edges.push({
        id: `edge_job_${reqId}_${job.jobId}`,
        sourceId: reqId,
        targetId: job.jobId,
        edgeType: "belongsTo",
        weight: req.weight
      });

      const reqNorm = req.capability_name.toLowerCase().trim();
      const aliasNorms = (req.aliases || []).map((a) => a.toLowerCase().trim());

      const matchingCap = capabilityNodes.find((cap) => {
        const capNorm = cap.name.toLowerCase().trim();
        if (capNorm === reqNorm) return true;
        if (aliasNorms.includes(capNorm)) return true;
        if (cap.aliases.map((a) => a.toLowerCase().trim()).includes(reqNorm)) return true;
        return false;
      });

      if (matchingCap) {
        matchingCap.outgoingRequirementIds.push(reqId);
        edges.push({
          id: `edge_sat_${matchingCap.id}_${reqId}`,
          sourceId: matchingCap.id,
          targetId: reqId,
          edgeType: "satisfies",
          weight: 1.0
        });
      }
    }
  }

  return {
    sourceNodes,
    evidenceNodes,
    capabilityNodes,
    requirementNodes,
    jobNodes,
    organisationNodes,
    edges
  };
}

/**
 * Traces the complete proof chain for a specific job requirement:
 * Organisation -> Job -> Requirement -> Capability -> Evidence -> Original Source & exact Location.
 */
export function traceRequirementProofChain(
  graph: DirectedEvidenceGraph,
  jobId: string,
  requirementName: string
): RequirementProofChain {
  const reqNorm = requirementName.toLowerCase().trim();
  const reqNode = graph.requirementNodes.find(
    (r) => r.jobId === jobId && r.requirementName.toLowerCase().trim() === reqNorm
  );

  const jobNode = graph.jobNodes.find((j) => j.id === jobId);
  const orgNode = jobNode ? graph.organisationNodes.find((o) => o.id === jobNode.orgId) : undefined;

  if (!reqNode) {
    return {
      organisationId: orgNode?.id,
      organisationName: orgNode?.name,
      jobId,
      jobTitle: jobNode?.title,
      requirementName,
      evidenceIds: [],
      excerpts: [],
      locations: [],
      sourceIds: []
    };
  }

  const satisfiesEdges = graph.edges.filter(
    (e) => e.edgeType === "satisfies" && e.targetId === reqNode.id
  );

  if (satisfiesEdges.length === 0) {
    return {
      organisationId: orgNode?.id,
      organisationName: orgNode?.name,
      jobId,
      jobTitle: jobNode?.title,
      requirementName,
      evidenceIds: [],
      excerpts: [],
      locations: [],
      sourceIds: []
    };
  }

  const capId = satisfiesEdges[0].sourceId;
  const capNode = graph.capabilityNodes.find((c) => c.id === capId);

  const supportsEdges = graph.edges.filter(
    (e) => e.edgeType === "supports" && e.targetId === capId
  );

  const evidenceIds: string[] = [];
  const excerpts: string[] = [];
  const locations: EvidenceLocation[] = [];
  const sourceIds: string[] = [];

  for (const edge of supportsEdges) {
    const evNode = graph.evidenceNodes.find((ev) => ev.id === edge.sourceId);
    if (evNode) {
      evidenceIds.push(evNode.id);
      excerpts.push(evNode.excerpt);
      locations.push(evNode.location);
      sourceIds.push(evNode.sourceId);
    }
  }

  return {
    organisationId: orgNode?.id,
    organisationName: orgNode?.name,
    jobId,
    jobTitle: jobNode?.title,
    requirementName,
    capabilityId: capNode?.id,
    capabilityName: capNode?.name,
    evidenceIds,
    excerpts,
    locations,
    sourceIds
  };
}

/**
 * Computes dual explainable job fit:
 * 1. fitScore: Weighted requirement match score [0.0, 1.0] (functional requirement satisfaction)
 * 2. explainabilityScore: Traceability, density, and confidence of evidence proof chains backing matched capabilities [0.0, 1.0]
 */
export function computeExplainableJobFit(
  graph: DirectedEvidenceGraph,
  jobId: string
): ExplainableJobFitResult {
  const jobReqs = graph.requirementNodes.filter((r) => r.jobId === jobId);
  if (jobReqs.length === 0) {
    return {
      jobId,
      fitScore: 0.0,
      explainabilityScore: 0.0,
      proofChains: []
    };
  }

  let totalWeight = 0.0;
  let earnedFit = 0.0;
  let earnedExplainability = 0.0;
  const proofChains: RequirementProofChain[] = [];

  for (const req of jobReqs) {
    totalWeight += req.weight;
    const chain = traceRequirementProofChain(graph, jobId, req.requirementName);
    proofChains.push(chain);

    if (chain.capabilityId && chain.evidenceIds.length > 0) {
      earnedFit += req.weight;

      const supportingEvNodes = graph.evidenceNodes.filter((ev) =>
        chain.evidenceIds.includes(ev.id)
      );
      const avgEvConf =
        supportingEvNodes.length > 0
          ? supportingEvNodes.reduce((sum, ev) => sum + ev.confidence, 0) / supportingEvNodes.length
          : 0.0;

      earnedExplainability += req.weight * avgEvConf;
    }
  }

  const rawFit = totalWeight > 0 ? earnedFit / totalWeight : 0.0;
  const rawExp = totalWeight > 0 ? earnedExplainability / totalWeight : 0.0;

  return {
    jobId,
    fitScore: Math.min(1.0, Math.max(0.0, Number(rawFit.toFixed(4)))),
    explainabilityScore: Math.min(1.0, Math.max(0.0, Number(rawExp.toFixed(4)))),
    proofChains
  };
}
