import { describe, it, expect } from "vitest";
import {
  EvidenceNodeSchema,
  CapabilityNodeSchema,
  DirectedEvidenceGraphSchema
} from "../lib/career/evidence/graph";
import {
  buildEvidenceGraph,
  traceRequirementProofChain,
  computeExplainableJobFit
} from "../lib/career/evidence/traversal";
import { JobRoleProfile } from "../lib/career/matching/job-mapping";

describe("CONDYN Career Analysis Protocol v1.0 — Step 24: Directed Evidence Graph Engine", () => {
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
          },
          {
            entity_id: "CAP_DIST_SYS",
            identity: { name: "Distributed Systems Architecture" },
            confidence: 0.92,
            properties: { domain: "Systems" },
            evidence: [] // No explicit verbatim evidence items -> synthetic grounding
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
        },
        {
          capability_name: "Distributed Systems Architecture",
          domain: "Systems",
          weight: 0.4,
          required_level: "L5"
        }
      ]
    }
  ];

  it("1. should validate EvidenceNode, CapabilityNode, and DirectedEvidenceGraph schemas", () => {
    const validEvNode = {
      id: "ev_101",
      sourceId: "DOC_SIEMENS_REF",
      sourceType: "pdf" as const,
      confidence: 0.98,
      excerpt: "Designed and operated multi-cluster Kubernetes orchestration...",
      location: { page: 14, heading: "Section 3.2" },
      capabilities: ["Kubernetes Orchestration"],
      metadata: {}
    };

    expect(() => EvidenceNodeSchema.parse(validEvNode)).not.toThrow();

    const validCapNode = {
      id: "CAP_K8S",
      name: "Kubernetes Orchestration",
      domain: "DevOps",
      incomingEvidenceIds: ["ev_101"],
      outgoingRequirementIds: ["req_101"],
      aliases: ["k8s"],
      parents: [],
      children: []
    };

    expect(() => CapabilityNodeSchema.parse(validCapNode)).not.toThrow();
  });

  it("2. should construct directed graph containing explicit supports, satisfies, and belongsTo edges", () => {
    const graph = buildEvidenceGraph(sampleAnalysis, sampleJobs);

    expect(() => DirectedEvidenceGraphSchema.parse(graph)).not.toThrow();
    expect(graph.evidenceNodes.length).toBeGreaterThan(0);
    expect(graph.capabilityNodes).toHaveLength(2);
    expect(graph.requirementNodes).toHaveLength(2);

    const supportEdges = graph.edges.filter((e) => e.edgeType === "supports");
    const satisfyEdges = graph.edges.filter((e) => e.edgeType === "satisfies");
    const belongEdges = graph.edges.filter((e) => e.edgeType === "belongsTo");

    expect(supportEdges.length).toBeGreaterThanOrEqual(2);
    expect(satisfyEdges).toHaveLength(2);
    expect(belongEdges).toHaveLength(2);
  });

  it("3. should trace full proof chain: Requirement -> Capability -> Evidence -> Source location & excerpt", () => {
    const graph = buildEvidenceGraph(sampleAnalysis, sampleJobs);
    const chain = traceRequirementProofChain(graph, "job_siemens_lead", "Kubernetes Orchestration");

    expect(chain.jobId).toBe("job_siemens_lead");
    expect(chain.capabilityName).toBe("Kubernetes Orchestration");
    expect(chain.evidenceIds.length).toBeGreaterThan(0);
    expect(chain.excerpts[0]).toContain("Designed and operated multi-cluster Kubernetes orchestration");
    expect(chain.sourceIds[0]).toBe("DOC_SIEMENS_REF");
  });

  it("4. should compute dual scoring (fitScore & explainabilityScore) reflecting dense verbatim evidence", () => {
    const graph = buildEvidenceGraph(sampleAnalysis, sampleJobs);
    const fitResult = computeExplainableJobFit(graph, "job_siemens_lead");

    expect(fitResult.jobId).toBe("job_siemens_lead");
    expect(fitResult.fitScore).toBe(1.0); // Both requirements satisfied
    expect(fitResult.explainabilityScore).toBeGreaterThanOrEqual(0.92);
    expect(fitResult.proofChains).toHaveLength(2);
  });

  it("5. should reflect lower explainabilityScore when evidence is sparse compared to dense verbatim evidence", () => {
    // Analysis where capabilities have lower confidence evidence
    const lowEvidenceAnalysis = {
      structured_data: {
        analysis: {
          documents: [],
          capabilities: [
            {
              entity_id: "CAP_K8S",
              identity: { name: "Kubernetes Orchestration" },
              confidence: 0.50, // low confidence
              evidence: []
            },
            {
              entity_id: "CAP_DIST_SYS",
              identity: { name: "Distributed Systems Architecture" },
              confidence: 0.40, // low confidence
              evidence: []
            }
          ]
        }
      }
    };

    const highGraph = buildEvidenceGraph(sampleAnalysis, sampleJobs);
    const lowGraph = buildEvidenceGraph(lowEvidenceAnalysis, sampleJobs);

    const highRes = computeExplainableJobFit(highGraph, "job_siemens_lead");
    const lowRes = computeExplainableJobFit(lowGraph, "job_siemens_lead");

    expect(highRes.explainabilityScore).toBeGreaterThan(lowRes.explainabilityScore);
  });

  it("6. should guarantee immutability of input analysis and job role profiles", () => {
    const frozenAnalysis = Object.freeze(JSON.parse(JSON.stringify(sampleAnalysis)));
    const frozenJobs = Object.freeze(JSON.parse(JSON.stringify(sampleJobs)));

    expect(() => buildEvidenceGraph(frozenAnalysis, frozenJobs)).not.toThrow();
  });
});
