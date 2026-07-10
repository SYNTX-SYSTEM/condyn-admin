import { describe, it, expect } from "vitest";
import { buildEvidenceGraph } from "../lib/career/evidence/traversal";
import { computeGraphFocus, getEvidenceHeatmapToken } from "../lib/career/evidence/highlight";
import { JobRoleProfile } from "../lib/career/matching/job-mapping";

describe("CONDYN Career Analysis Protocol v1.0 — Step 24b: Graph Focus Engine & Heatmap Tokens", () => {
  const sampleAnalysis: any = {
    structured_data: {
      analysis: {
        documents: [
          {
            entity_id: "DOC_SIEMENS_REF",
            identity: { name: "Siemens_Architecture_Project.pdf", type: "document" },
            evidence: [
              {
                doc_id: "DOC_SIEMENS_REF",
                location: "Page 14, Section 3.2",
                context_quote: "Designed and operated multi-cluster Kubernetes orchestration with 99.99% SLA across 40 nodes.",
                evidence_score: 0.98
              }
            ]
          }
        ],
        capabilities: [
          {
            entity_id: "CAP_K8S",
            identity: { name: "Kubernetes Orchestration" },
            confidence: 0.95,
            properties: { domain: "DevOps" },
            evidence: [
              {
                doc_id: "DOC_SIEMENS_REF",
                location: "Page 14, Section 3.2",
                context_quote: "Designed and operated multi-cluster Kubernetes orchestration with 99.99% SLA across 40 nodes.",
                evidence_score: 0.98
              }
            ]
          }
        ]
      }
    }
  };

  const sampleJobs: JobRoleProfile[] = [
    {
      jobId: "job_siemens_lead",
      title: "Principal Cloud Architect",
      company: "Siemens AG",
      requirements: [
        {
          capability_name: "Kubernetes Orchestration",
          domain: "DevOps",
          weight: 0.6,
          required_level: "L5"
        }
      ]
    }
  ];

  it("1. should compute bidirectional GraphFocus around a Capability node (upstream to Evidence/Source, downstream to Requirement/Job/Org)", () => {
    const graph = buildEvidenceGraph(sampleAnalysis, sampleJobs);
    const focus = computeGraphFocus(graph, "CAP_K8S");

    expect(focus.focusNodeId).toBe("CAP_K8S");
    expect(focus.upstreamNodes.length).toBeGreaterThan(0);
    expect(focus.downstreamNodes.length).toBeGreaterThan(0);

    // Verify upstream contains source and evidence
    const hasSource = focus.upstreamNodes.some((id) => id === "DOC_SIEMENS_REF");
    expect(hasSource).toBe(true);

    // Verify downstream contains job and organisation
    const hasJob = focus.downstreamNodes.some((id) => id === "job_siemens_lead");
    expect(hasJob).toBe(true);
  });

  it("2. should compute GraphFocus around a Job node correctly traversing upstream requirements and downstream organisation", () => {
    const graph = buildEvidenceGraph(sampleAnalysis, sampleJobs);
    const focus = computeGraphFocus(graph, "job_siemens_lead");

    expect(focus.focusNodeId).toBe("job_siemens_lead");
    expect(focus.upstreamNodes.length).toBeGreaterThan(0);
    expect(focus.downstreamNodes).toContain("org_siemens_ag");
  });

  it("3. should resolve semantic heatmap tokens across High, Medium, Weak, and Missing evidence levels", () => {
    expect(getEvidenceHeatmapToken(0.95).level).toBe("high");
    expect(getEvidenceHeatmapToken(0.95).colorHex).toBe("#38e5ff");

    expect(getEvidenceHeatmapToken(0.75).level).toBe("medium");
    expect(getEvidenceHeatmapToken(0.75).colorHex).toBe("#5ca8ff");

    expect(getEvidenceHeatmapToken(0.40).level).toBe("weak");
    expect(getEvidenceHeatmapToken(0.40).colorHex).toBe("#ffb338");

    expect(getEvidenceHeatmapToken(0.0, true).level).toBe("missing");
    expect(getEvidenceHeatmapToken(0.0, true).colorHex).toBe("#ff5555");
  });
});
