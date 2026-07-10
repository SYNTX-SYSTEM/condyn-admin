import { describe, it, expect } from "vitest";
import { getSourceWeight } from "../lib/career/confidence/weights";
import { aggregateCapabilityConfidence } from "../lib/career/confidence/aggregation";
import { propagateGraphConfidence } from "../lib/career/confidence/propagation";
import { createCurrentGraphState, simulateEvidenceImpact } from "../lib/career/confidence/graph-state";
import { buildEvidenceGraph } from "../lib/career/evidence/traversal";
import { JobRoleProfile } from "../lib/career/matching/job-mapping";

describe("CONDYN Career Analysis Protocol v1.0 — Step 25: Confidence Propagation Engine & Decision Laboratory", () => {
  const sampleAnalysis: any = {
    structured_data: {
      analysis: {
        documents: [
          {
            entity_id: "DOC_1",
            identity: { name: "Project_Architecture.pdf", type: "document" },
            evidence: [
              {
                doc_id: "DOC_1",
                location: "Page 4",
                context_quote: "Managed K8s cluster",
                evidence_score: 0.80
              }
            ]
          }
        ],
        capabilities: [
          {
            entity_id: "CAP_K8S",
            identity: { name: "Kubernetes Orchestration" },
            confidence: 0.80,
            evidence: [
              {
                doc_id: "DOC_1",
                location: "Page 4",
                context_quote: "Managed K8s cluster",
                evidence_score: 0.80
              }
            ]
          }
        ]
      }
    }
  };

  const sampleJobs: JobRoleProfile[] = [
    {
      jobId: "job_cloud_arch",
      title: "Principal Cloud Architect",
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

  it("1. should resolve deterministic source weights (github=1.0, pdf=0.85, website=0.70, linkedin=0.40)", () => {
    expect(getSourceWeight("github")).toBe(1.0);
    expect(getSourceWeight("pdf")).toBe(0.85);
    expect(getSourceWeight("website")).toBe(0.70);
    expect(getSourceWeight("linkedin")).toBe(0.40);
    expect(getSourceWeight(undefined)).toBe(0.60);
  });

  it("2. should aggregate multiple evidence items robustly with damped accumulation without linear overshoot", () => {
    const single = aggregateCapabilityConfidence([
      { evidenceScore: 0.80, sourceWeight: 0.85 }
    ]);
    const multiple = aggregateCapabilityConfidence([
      { evidenceScore: 0.80, sourceWeight: 0.85 },
      { evidenceScore: 0.90, sourceWeight: 1.0 }
    ]);

    expect(single).toBeGreaterThan(0.60);
    expect(multiple).toBeGreaterThan(single);
    expect(multiple).toBeLessThanOrEqual(1.0);
  });

  it("3. should ensure GitHub/code evidence impacts capability confidence more strongly than LinkedIn profile evidence", () => {
    const githubResult = aggregateCapabilityConfidence([
      { evidenceScore: 0.90, sourceWeight: getSourceWeight("github") }
    ]);
    const linkedinResult = aggregateCapabilityConfidence([
      { evidenceScore: 0.90, sourceWeight: getSourceWeight("linkedin") }
    ]);

    expect(githubResult).toBeGreaterThan(linkedinResult);
  });

  it("4. should propagate graph confidence bottom-up across Evidence -> Capability -> Requirement -> Job -> Organisation", () => {
    const graph = buildEvidenceGraph(sampleAnalysis, sampleJobs);
    const propagated = propagateGraphConfidence(graph);

    expect(propagated.evidenceConfidences).toBeDefined();
    expect(propagated.capabilityConfidences["CAP_K8S"]).toBeGreaterThan(0);
    expect(propagated.jobScores["job_cloud_arch"]).toBeGreaterThan(0);
    expect(propagated.organisationScores["org_siemens_ag"]).toBeGreaterThan(0);
  });

  it("5. should generate CurrentGraphState containing graph, propagated confidence, and timestamp", () => {
    const graph = buildEvidenceGraph(sampleAnalysis, sampleJobs);
    const state = createCurrentGraphState(graph);

    expect(state.graph).toBeDefined();
    expect(state.propagated).toBeDefined();
    expect(state.timestamp).toBeDefined();
  });

  it("6. What-If Simulation: should increase capability and job score when simulated high-value GitHub evidence is added, without mutating baseGraph", () => {
    const baseGraph = buildEvidenceGraph(sampleAnalysis, sampleJobs);
    const baseNodeCount = baseGraph.evidenceNodes.length;

    const simulation = simulateEvidenceImpact(baseGraph, {
      sourceTitle: "kubernetes-production-operator-repo",
      sourceType: "github",
      targetCapabilityId: "CAP_K8S",
      evidenceExcerpt: "Production operator controlling 100+ clusters.",
      evidenceScore: 0.98
    });

    // Ensure deltas demonstrate score improvement
    const capDelta = simulation.deltas.find((d) => d.nodeId === "CAP_K8S");
    const jobDelta = simulation.deltas.find((d) => d.nodeId === "job_cloud_arch");

    expect(capDelta).toBeDefined();
    expect(capDelta!.delta).toBeGreaterThan(0);
    expect(jobDelta).toBeDefined();
    expect(jobDelta!.delta).toBeGreaterThan(0);

    // Verify immutability of baseGraph
    expect(baseGraph.evidenceNodes.length).toBe(baseNodeCount);
  });
});
