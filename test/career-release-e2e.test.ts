import { describe, it, expect } from "vitest";
import { buildEvidenceGraph } from "../lib/career/evidence/traversal";
import { computeGraphFocus } from "../lib/career/evidence/highlight";
import { propagateGraphConfidence } from "../lib/career/confidence/propagation";
import { simulateEvidenceImpact, createCurrentGraphState } from "../lib/career/confidence/graph-state";
import { aggregateCapabilityConfidence } from "../lib/career/confidence/aggregation";
import { getSourceWeight } from "../lib/career/confidence/weights";
import { JobRoleProfile } from "../lib/career/matching/job-mapping";

describe("CONDYN Career Analysis Protocol v1.0 — Phase 2: Release E2E Complete Scenario Suite", () => {
  const multiSourceAnalysis: any = {
    structured_data: {
      analysis: {
        documents: [
          {
            entity_id: "DOC_PDF",
            identity: { name: "Senior_Architect_CV.pdf", type: "document" },
            evidence: [
              {
                doc_id: "DOC_PDF",
                location: "Page 1",
                context_quote: "Architected distributed event-driven systems.",
                evidence_score: 0.85
              }
            ]
          },
          {
            entity_id: "DOC_GH",
            identity: { name: "kafka-event-mesh", type: "github" },
            evidence: [
              {
                doc_id: "DOC_GH",
                location: "README.md",
                context_quote: "Production event mesh handling 1M events/sec.",
                evidence_score: 0.95
              }
            ]
          }
        ],
        capabilities: [
          {
            entity_id: "CAP_ED_ARCH",
            identity: { name: "Event-Driven Architecture" },
            confidence: 0.90,
            evidence: [
              {
                doc_id: "DOC_PDF",
                location: "Page 1",
                context_quote: "Architected distributed event-driven systems.",
                evidence_score: 0.85
              },
              {
                doc_id: "DOC_GH",
                location: "README.md",
                context_quote: "Production event mesh handling 1M events/sec.",
                evidence_score: 0.95
              }
            ]
          }
        ]
      }
    }
  };

  const targetJobs: JobRoleProfile[] = [
    {
      jobId: "job_event_arch",
      title: "Lead Event-Driven Systems Architect",
      company: "Bosch Global",
      requirements: [
        {
          capability_name: "Event-Driven Architecture",
          domain: "Architecture",
          weight: 1.0,
          required_level: "L5"
        }
      ]
    }
  ];

  it("1. Complete E2E Flow: Multi-Source Ingestion -> Directed Evidence Graph -> Propagated Confidence -> Graph Focus HUD", () => {
    // Step 1: Build graph
    const graph = buildEvidenceGraph(multiSourceAnalysis, targetJobs);
    expect(graph.sourceNodes.length).toBeGreaterThanOrEqual(2);
    expect(graph.capabilityNodes.length).toBe(1);
    expect(graph.jobNodes.length).toBe(1);

    // Step 2: Propagate confidence along the graph
    const propagated = propagateGraphConfidence(graph);
    expect(propagated.capabilityConfidences["CAP_ED_ARCH"]).toBeGreaterThan(0.85);
    expect(propagated.jobScores["job_event_arch"]).toBeGreaterThan(0.85);
    expect(propagated.organisationScores["org_bosch_global"]).toBeGreaterThan(0.85);

    // Step 3: Compute graph focus for Decision Graph Inspector HUD
    const focus = computeGraphFocus(graph, "CAP_ED_ARCH");
    expect(focus.focusNodeId).toBe("CAP_ED_ARCH");
    expect(focus.upstreamNodes.length).toBeGreaterThanOrEqual(1);
    expect(focus.downstreamNodes.length).toBeGreaterThanOrEqual(1);
  });

  it("2. Complete E2E What-If Simulation Flow: Testing interactive Decision Laboratory deltas", () => {
    const baseGraph = buildEvidenceGraph(multiSourceAnalysis, targetJobs);
    const baseState = createCurrentGraphState(baseGraph);

    const simulation = simulateEvidenceImpact(baseGraph, {
      sourceTitle: "production-kafka-operator-repo",
      sourceType: "github",
      targetCapabilityId: "CAP_ED_ARCH",
      evidenceExcerpt: "Kafka operator codebase with 100% test coverage.",
      evidenceScore: 0.99
    });

    expect(simulation.after.jobScores["job_event_arch"]).toBeGreaterThanOrEqual(
      simulation.before.jobScores["job_event_arch"]
    );
    expect(simulation.deltas).toBeDefined();
  });

  it("3. Multi-Source Weighting & Aggregation verification across PDF + GitHub + Website sources", () => {
    const pdfWeight = getSourceWeight("pdf");
    const githubWeight = getSourceWeight("github");
    const websiteWeight = getSourceWeight("website");

    const aggregated = aggregateCapabilityConfidence([
      { evidenceScore: 0.85, sourceWeight: pdfWeight },
      { evidenceScore: 0.95, sourceWeight: githubWeight },
      { evidenceScore: 0.75, sourceWeight: websiteWeight }
    ]);

    expect(aggregated).toBeGreaterThan(0.90);
    expect(aggregated).toBeLessThanOrEqual(1.0);
  });
});
