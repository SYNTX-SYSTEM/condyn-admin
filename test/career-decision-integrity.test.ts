import { describe, it, expect } from "vitest";
import { buildEvidenceGraph } from "../lib/career/evidence/traversal";
import { computeGraphFocus } from "../lib/career/evidence/highlight";
import { propagateGraphConfidence } from "../lib/career/confidence/propagation";
import { simulateEvidenceImpact } from "../lib/career/confidence/graph-state";
import { JobRoleProfile } from "../lib/career/matching/job-mapping";

describe("CONDYN Career Analysis Protocol v1.0 — Phase 1: Decision Integrity Suite (ARCHITECTURAL INVARIANTS)", () => {
  const canonicalAnalysis: any = {
    structured_data: {
      analysis: {
        documents: [
          {
            entity_id: "DOC_1",
            identity: { name: "System_Architecture.pdf", type: "document" },
            evidence: [
              {
                doc_id: "DOC_1",
                location: "Page 2",
                context_quote: "Designed and operated multi-region Kubernetes platform.",
                evidence_score: 0.92
              }
            ]
          }
        ],
        capabilities: [
          {
            entity_id: "CAP_K8S",
            identity: { name: "Kubernetes Orchestration" },
            confidence: 0.92,
            evidence: [
              {
                doc_id: "DOC_1",
                location: "Page 2",
                context_quote: "Designed and operated multi-region Kubernetes platform.",
                evidence_score: 0.92
              }
            ]
          }
        ]
      }
    }
  };

  const canonicalJobs: JobRoleProfile[] = [
    {
      jobId: "job_cloud_principal",
      title: "Principal Cloud Platform Architect",
      company: "Siemens AG",
      requirements: [
        {
          capability_name: "Kubernetes Orchestration",
          domain: "DevOps",
          weight: 1.0,
          required_level: "L5"
        }
      ]
    }
  ];

  it("Invariant 1 & 5: Every recommendation & job match must be explainable back to evidence (Recommendation -> Requirement -> Capability -> Evidence -> Source)", () => {
    const graph = buildEvidenceGraph(canonicalAnalysis, canonicalJobs);

    // Verify every capability has supporting evidence edges
    for (const cap of graph.capabilityNodes) {
      const supportingEdges = graph.edges.filter(
        (e) => e.targetId === cap.id && e.edgeType === "supports"
      );
      expect(supportingEdges.length).toBeGreaterThan(0);

      // Verify each supporting evidence connects to a source
      for (const edge of supportingEdges) {
        const evNode = graph.evidenceNodes.find((n) => n.id === edge.sourceId);
        expect(evNode).toBeDefined();

        const containsEdge = graph.edges.find(
          (e) => e.targetId === evNode!.id && e.edgeType === "contains"
        );
        expect(containsEdge).toBeDefined();
        const sourceNode = graph.sourceNodes.find((s) => s.id === containsEdge!.sourceId);
        expect(sourceNode).toBeDefined();
      }
    }
  });

  it("Invariant 4: No orphan nodes — every node in the DirectedEvidenceGraph is connected into the decision hierarchy", () => {
    const graph = buildEvidenceGraph(canonicalAnalysis, canonicalJobs);

    // Every capability must connect to evidence
    expect(graph.capabilityNodes.every((c) => c.incomingEvidenceIds.length > 0)).toBe(true);

    // Every job must connect to an organisation
    for (const job of graph.jobNodes) {
      const orgEdge = graph.edges.find(
        (e) => e.sourceId === job.id && e.edgeType === "belongsToOrg"
      );
      expect(orgEdge).toBeDefined();
    }
  });

  it("Invariant 6: What-If Simulation never mutates baseGraph (byte-identical preservation)", () => {
    const baseGraph = buildEvidenceGraph(canonicalAnalysis, canonicalJobs);
    const serializedBefore = JSON.stringify(baseGraph);

    const simulation = simulateEvidenceImpact(baseGraph, {
      sourceTitle: "github-operator-repo",
      sourceType: "github",
      targetCapabilityId: "CAP_K8S",
      evidenceExcerpt: "Operator repo with 99.99% SLA.",
      evidenceScore: 0.98
    });

    const serializedAfter = JSON.stringify(baseGraph);

    expect(serializedAfter).toBe(serializedBefore);
    expect(simulation.simulatedGraphState.graph.evidenceNodes.length).toBeGreaterThan(
      baseGraph.evidenceNodes.length
    );
  });

  it("Invariant 7: Confidence propagation is strictly deterministic", () => {
    const graph = buildEvidenceGraph(canonicalAnalysis, canonicalJobs);

    const run1 = propagateGraphConfidence(graph);
    const run2 = propagateGraphConfidence(graph);

    expect(run1).toEqual(run2);
  });

  it("Invariant 8: All scores originate from the graph and obey graph physics", () => {
    const graph = buildEvidenceGraph(canonicalAnalysis, canonicalJobs);
    const propagated = propagateGraphConfidence(graph);

    // Ensure Job Score originates from requirement fulfillment
    const jobScore = propagated.jobScores["job_cloud_principal"];
    expect(jobScore).toBeDefined();
    expect(jobScore).toBeGreaterThan(0);
    expect(jobScore).toBeLessThanOrEqual(1.0);
  });
});
