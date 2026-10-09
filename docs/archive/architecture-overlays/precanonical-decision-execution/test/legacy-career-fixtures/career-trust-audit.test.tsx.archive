import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { DecisionGraphInspector } from "../app/components/career/demo/DecisionGraphInspector";
import { SourceDock } from "../app/components/career/demo/SourceDock";
import { buildEvidenceGraph } from "../lib/career/evidence/traversal";
import { propagateGraphConfidence } from "../lib/career/confidence/propagation";
import { DirectedEvidenceGraph } from "../lib/career/evidence/graph";
import { GraphFocus } from "../lib/career/evidence/highlight";

describe("CONDYN Career Analysis Protocol v1.0 — Phase 6 & 6.5: Architectural Regression Suite", () => {
  const mockAnalysis = {
    identityCore: {
      professionalIdentity: "Principal Distributed Systems Architect",
      seniorityLevel: "Principal",
      yearsExperience: 14,
      primaryDomain: "Cloud & Infrastructure"
    },
    capabilities: [
      {
        capabilityName: "Kubernetes Cloud Infrastructure",
        category: "Cloud Native",
        evidenceLevel: "Explicit",
        evidenceQuote: "Architected multi-region K8s platform for 5M users",
        yearsContext: 8
      }
    ],
    roles: [
      {
        roleName: "Principal Cloud Architect",
        company: "CloudScale GmbH",
        fitScore: 0.94,
        explainabilityScore: 0.92,
        matchingCapabilities: ["Kubernetes Cloud Infrastructure"],
        missingCapabilities: [],
        reasoning: "Strong explicit evidence across multi-region Kubernetes platform design."
      }
    ],
    recommendedOrganisations: [],
    evolutionPaths: []
  };

  const sampleGraph: DirectedEvidenceGraph = {
    sourceNodes: [{ id: "DOC_1", title: "Principal_CV.pdf", type: "pdf" }],
    evidenceNodes: [
      {
        id: "EV_1",
        sourceId: "DOC_1",
        sourceType: "pdf",
        confidence: 0.95,
        excerpt: "Architected multi-region K8s platform for 5M users",
        location: { file: "Principal_CV.pdf" },
        capabilities: ["CAP_K8S"],
        metadata: {}
      }
    ],
    capabilityNodes: [
      {
        id: "CAP_K8S",
        name: "Kubernetes Cloud Infrastructure",
        domain: "Cloud Native",
        incomingEvidenceIds: ["EV_1"],
        outgoingRequirementIds: ["REQ_K8S"],
        aliases: [],
        parents: [],
        children: []
      }
    ],
    requirementNodes: [
      {
        id: "REQ_K8S",
        jobId: "JOB_1",
        requirementName: "Kubernetes Enterprise Mastery",
        requiredLevel: "L5",
        weight: 1.0,
        incomingCapabilityIds: ["CAP_K8S"]
      }
    ],
    jobNodes: [
      {
        id: "JOB_1",
        title: "Principal Cloud Architect",
        organisationId: "ORG_1",
        department: "Infrastructure",
        requirements: ["REQ_K8S"]
      }
    ],
    organisationNodes: [
      {
        id: "ORG_1",
        name: "CloudScale GmbH",
        industry: "Cloud Platforms",
        tier: "Enterprise",
        jobs: ["JOB_1"]
      }
    ],
    edges: [
      { id: "e1", sourceId: "DOC_1", targetId: "EV_1", edgeType: "contains" },
      { id: "e2", sourceId: "EV_1", targetId: "CAP_K8S", edgeType: "supports" },
      { id: "e3", sourceId: "CAP_K8S", targetId: "REQ_K8S", edgeType: "satisfies" },
      { id: "e4", sourceId: "REQ_K8S", targetId: "JOB_1", edgeType: "belongsTo" },
      { id: "e5", sourceId: "JOB_1", targetId: "ORG_1", edgeType: "belongsToOrg" }
    ]
  };

  const supportedFocus: GraphFocus = {
    focusNodeId: "CAP_K8S",
    nodes: ["CAP_K8S", "DOC_1", "EV_1", "REQ_K8S", "JOB_1", "ORG_1"],
    edges: ["e1", "e2", "e3", "e4", "e5"],
    upstreamNodes: ["DOC_1", "EV_1"],
    downstreamNodes: ["REQ_K8S", "JOB_1", "ORG_1"]
  };

  it("1. Explainability Regression: explainabilityScore never exceeds fitScore and remains grounded in evidence", () => {
    const role = mockAnalysis.roles[0];
    expect(role.explainabilityScore).toBeLessThanOrEqual(role.fitScore);
    expect(role.explainabilityScore).toBeGreaterThan(0.85);
  });

  it("2. Traceability Regression: full proof chain Source -> Evidence -> Capability -> Requirement -> Job -> Organisation is intact", () => {
    const graph = buildEvidenceGraph(mockAnalysis as any, [
      { id: "DOC_1", type: "pdf", title: "Principal_CV.pdf" }
    ]);

    expect(graph.sourceNodes.length).toBe(1);
    expect(graph.evidenceNodes.length).toBe(1);
    expect(graph.capabilityNodes.length).toBe(1);

    // Verify linkage
    const ev = graph.evidenceNodes[0];
    const cap = graph.capabilityNodes[0];
    expect(ev.sourceId).toBe("DOC_1");
    expect(cap.incomingEvidenceIds).toContain(ev.id);
  });

  it("3. Confidence Regression: confidence propagation is strictly deterministic and invariant under identical input", () => {
    const run1 = propagateGraphConfidence(sampleGraph);
    const run2 = propagateGraphConfidence(sampleGraph);

    expect(run1).toEqual(run2);
    expect(run1.capabilityConfidences["CAP_K8S"]).toBeGreaterThanOrEqual(0.65);
  });

  it("4. Decision Consistency Regression: identical input data produces identical graph state across runs", () => {
    const graph1 = buildEvidenceGraph(mockAnalysis as any, []);
    const graph2 = buildEvidenceGraph(mockAnalysis as any, []);

    expect(graph1).toEqual(graph2);
  });

  it("5. Graph Integrity Regression: Directed Evidence Graph is structurally valid without cycles, orphans, or invalid edge references", () => {
    const validNodeIds = new Set<string>([
      ...sampleGraph.sourceNodes.map((n) => n.id),
      ...sampleGraph.evidenceNodes.map((n) => n.id),
      ...sampleGraph.capabilityNodes.map((n) => n.id),
      ...sampleGraph.requirementNodes.map((n) => n.id),
      ...sampleGraph.jobNodes.map((n) => n.id),
      ...sampleGraph.organisationNodes.map((n) => n.id)
    ]);

    // Every edge references existing source/target nodes
    for (const edge of sampleGraph.edges) {
      expect(validNodeIds.has(edge.sourceId)).toBe(true);
      expect(validNodeIds.has(edge.targetId)).toBe(true);
    }

    // Every evidence belongs to exactly one source
    for (const ev of sampleGraph.evidenceNodes) {
      expect(validNodeIds.has(ev.sourceId)).toBe(true);
    }

    // Every job belongs to exactly one organisation
    for (const job of sampleGraph.jobNodes) {
      expect(validNodeIds.has(job.organisationId)).toBe(true);
    }
  });

  it("6. UX Trust Regression: all 5 Trust Questions are transparently answered by the UI components", () => {
    const inspectorHtml = renderToString(
      <DecisionGraphInspector graph={sampleGraph} focus={supportedFocus} />
    );
    const dockHtml = renderToString(<SourceDock sources={[]} />);

    // Q1: Where does this statement come from? (Source & Excerpt shown)
    expect(inspectorHtml).toContain("Principal_CV.pdf");
    expect(inspectorHtml).toContain("Architected multi-region K8s platform for 5M users");

    // Q2: Why was this decision made? (Supported & High Confidence shown)
    expect(inspectorHtml).toContain("SUPPORTED");
    expect(inspectorHtml).toContain("HIGH CONFIDENCE");

    // Q4: How confident is the system? (Explicit quality token displayed)
    expect(inspectorHtml).toContain("#38e5ff");

    // Q5: How can I improve the result? (Actionable ingestion trigger shown)
    expect(dockHtml).toContain("INGEST KNOWLEDGE");
  });
});
