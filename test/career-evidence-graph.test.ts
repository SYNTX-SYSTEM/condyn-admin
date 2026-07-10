import { describe, it, expect } from "vitest";
import {
  SourceNodeSchema,
  EvidenceNodeSchema,
  CapabilityNodeSchema,
  JobRequirementNodeSchema,
  JobNodeSchema,
  OrganisationNodeSchema,
  DirectedEvidenceGraphSchema
} from "../lib/career/evidence/graph";
import {
  buildEvidenceGraph,
  traceRequirementProofChain,
  computeExplainableJobFit
} from "../lib/career/evidence/traversal";
import { JobRoleProfile } from "../lib/career/matching/job-mapping";

describe("CONDYN Career Analysis Protocol v1.0 — Step 24a: Directed Evidence Graph Engine Core", () => {
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
            evidence: []
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

  it("1. should validate all 6 Node schemas (Source, Evidence, Capability, Requirement, Job, Organisation)", () => {
    expect(() =>
      SourceNodeSchema.parse({
        id: "DOC_SIEMENS_REF",
        title: "Siemens_Architecture_Project.pdf",
        type: "pdf"
      })
    ).not.toThrow();

    expect(() =>
      EvidenceNodeSchema.parse({
        id: "ev_101",
        sourceId: "DOC_SIEMENS_REF",
        sourceType: "pdf",
        confidence: 0.98,
        excerpt: "Designed and operated multi-cluster Kubernetes orchestration...",
        location: { page: 14, heading: "Section 3.2" },
        capabilities: ["Kubernetes Orchestration"],
        metadata: {}
      })
    ).not.toThrow();

    expect(() =>
      CapabilityNodeSchema.parse({
        id: "CAP_K8S",
        name: "Kubernetes Orchestration",
        domain: "DevOps",
        incomingEvidenceIds: ["ev_101"],
        outgoingRequirementIds: ["req_101"],
        aliases: ["k8s"],
        parents: [],
        children: []
      })
    ).not.toThrow();

    expect(() =>
      JobRequirementNodeSchema.parse({
        id: "req_101",
        jobId: "job_siemens_lead",
        requirementName: "Kubernetes Orchestration",
        domain: "DevOps",
        weight: 0.6,
        requiredLevel: "L5"
      })
    ).not.toThrow();

    expect(() =>
      JobNodeSchema.parse({
        id: "job_siemens_lead",
        title: "Principal Cloud Architect",
        company: "Siemens AG",
        orgId: "org_siemens_ag"
      })
    ).not.toThrow();

    expect(() =>
      OrganisationNodeSchema.parse({
        id: "org_siemens_ag",
        name: "Siemens AG",
        domain: "Technology"
      })
    ).not.toThrow();
  });

  it("2. should construct directed graph containing all 6 node classes and all 5 edge types (contains, supports, satisfies, belongsTo, belongsToOrg)", () => {
    const graph = buildEvidenceGraph(sampleAnalysis, sampleJobs);

    expect(() => DirectedEvidenceGraphSchema.parse(graph)).not.toThrow();
    expect(graph.sourceNodes.length).toBeGreaterThan(0);
    expect(graph.evidenceNodes.length).toBeGreaterThan(0);
    expect(graph.capabilityNodes).toHaveLength(2);
    expect(graph.requirementNodes).toHaveLength(2);
    expect(graph.jobNodes).toHaveLength(1);
    expect(graph.organisationNodes).toHaveLength(1);

    const containsEdges = graph.edges.filter((e) => e.edgeType === "contains");
    const supportEdges = graph.edges.filter((e) => e.edgeType === "supports");
    const satisfyEdges = graph.edges.filter((e) => e.edgeType === "satisfies");
    const belongEdges = graph.edges.filter((e) => e.edgeType === "belongsTo");
    const belongOrgEdges = graph.edges.filter((e) => e.edgeType === "belongsToOrg");

    expect(containsEdges.length).toBeGreaterThanOrEqual(2);
    expect(supportEdges.length).toBeGreaterThanOrEqual(2);
    expect(satisfyEdges).toHaveLength(2);
    expect(belongEdges).toHaveLength(2);
    expect(belongOrgEdges).toHaveLength(1);
  });

  it("3. should trace complete proof chain: Organisation -> Job -> Requirement -> Capability -> Evidence -> Source & exact Location", () => {
    const graph = buildEvidenceGraph(sampleAnalysis, sampleJobs);
    const chain = traceRequirementProofChain(graph, "job_siemens_lead", "Kubernetes Orchestration");

    expect(chain.organisationName).toBe("Siemens AG");
    expect(chain.jobId).toBe("job_siemens_lead");
    expect(chain.jobTitle).toBe("Principal Cloud Architect");
    expect(chain.requirementName).toBe("Kubernetes Orchestration");
    expect(chain.capabilityName).toBe("Kubernetes Orchestration");
    expect(chain.evidenceIds.length).toBeGreaterThan(0);
    expect(chain.excerpts[0]).toContain("Designed and operated multi-cluster Kubernetes orchestration");
    expect(chain.sourceIds[0]).toBe("DOC_SIEMENS_REF");
    expect(chain.locations[0]).toBeDefined();
  });

  it("4. should compute dual scoring independently (fitScore vs explainabilityScore)", () => {
    const graph = buildEvidenceGraph(sampleAnalysis, sampleJobs);
    const fitResult = computeExplainableJobFit(graph, "job_siemens_lead");

    expect(fitResult.jobId).toBe("job_siemens_lead");
    expect(fitResult.fitScore).toBe(1.0); // 100% functional requirement match
    expect(fitResult.explainabilityScore).toBeGreaterThanOrEqual(0.92);
    expect(fitResult.proofChains).toHaveLength(2);
    expect(fitResult.proofChains[0].organisationName).toBe("Siemens AG");
  });

  it("5. should lower explainabilityScore when evidence is sparse/low confidence without altering functional fitScore", () => {
    const sparseAnalysis = {
      structured_data: {
        analysis: {
          documents: [],
          capabilities: [
            {
              entity_id: "CAP_K8S",
              identity: { name: "Kubernetes Orchestration" },
              confidence: 0.45,
              evidence: []
            },
            {
              entity_id: "CAP_DIST_SYS",
              identity: { name: "Distributed Systems Architecture" },
              confidence: 0.40,
              evidence: []
            }
          ]
        }
      }
    };

    const highGraph = buildEvidenceGraph(sampleAnalysis, sampleJobs);
    const lowGraph = buildEvidenceGraph(sparseAnalysis, sampleJobs);

    const highRes = computeExplainableJobFit(highGraph, "job_siemens_lead");
    const lowRes = computeExplainableJobFit(lowGraph, "job_siemens_lead");

    expect(lowRes.fitScore).toBe(highRes.fitScore); // Both match the functional capabilities
    expect(lowRes.explainabilityScore).toBeLessThan(highRes.explainabilityScore); // But traceability/evidence quality is much lower
  });

  it("6. should guarantee immutability of input analysis and job role profiles", () => {
    const frozenAnalysis = Object.freeze(JSON.parse(JSON.stringify(sampleAnalysis)));
    const frozenJobs = Object.freeze(JSON.parse(JSON.stringify(sampleJobs)));

    expect(() => buildEvidenceGraph(frozenAnalysis, frozenJobs)).not.toThrow();
  });
});
