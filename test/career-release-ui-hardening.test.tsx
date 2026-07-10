import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { DecisionGraphInspector } from "../app/components/career/demo/DecisionGraphInspector";
import { GraphFocus } from "../lib/career/evidence/highlight";
import { DirectedEvidenceGraph } from "../lib/career/evidence/graph";

describe("CONDYN Career Analysis Protocol v1.0 — Phase 5: SIL v3.0 Demo & UI Hardening Suite", () => {
  const dummyGraph: DirectedEvidenceGraph = {
    sourceNodes: [{ id: "DOC_1", title: "Architecture.pdf", type: "pdf" }],
    evidenceNodes: [
      {
        id: "EV_1",
        sourceId: "DOC_1",
        sourceType: "pdf",
        confidence: 0.95,
        excerpt: "Managed K8s cluster",
        location: { file: "Architecture.pdf" },
        capabilities: ["CAP_K8S"],
        metadata: {}
      }
    ],
    capabilityNodes: [
      {
        id: "CAP_K8S",
        name: "Kubernetes Orchestration",
        domain: "DevOps",
        incomingEvidenceIds: ["EV_1"],
        outgoingRequirementIds: [],
        aliases: [],
        parents: [],
        children: []
      },
      {
        id: "CAP_QUANTUM",
        name: "Quantum Computing",
        domain: "Research",
        incomingEvidenceIds: [],
        outgoingRequirementIds: [],
        aliases: [],
        parents: [],
        children: []
      }
    ],
    requirementNodes: [],
    jobNodes: [],
    organisationNodes: [],
    edges: []
  };

  const supportedFocus: GraphFocus = {
    focusNodeId: "CAP_K8S",
    nodes: ["CAP_K8S", "DOC_1", "EV_1", "REQ_1", "JOB_1"],
    edges: [],
    upstreamNodes: ["DOC_1", "EV_1"],
    downstreamNodes: ["REQ_1", "JOB_1"]
  };

  const blockedFocus: GraphFocus = {
    focusNodeId: "CAP_QUANTUM",
    nodes: ["CAP_QUANTUM", "REQ_Q"],
    edges: [],
    upstreamNodes: [],
    downstreamNodes: ["REQ_Q"]
  };

  it("1. UI Hardening: renders all 6 SIL v3.0 sections cleanly without runtime exceptions", () => {
    const html = renderToString(<DecisionGraphInspector graph={dummyGraph} focus={supportedFocus} />);

    expect(html).toContain("FOCUS NODE");
    expect(html).toContain("DECISION STATE");
    expect(html).toContain("EVIDENCE QUALITY");
    expect(html).toContain("TRACEABILITY");
    expect(html).toContain("UPSTREAM");
    expect(html).toContain("DOWNSTREAM");
  });

  it("2. UI Hardening: renders SUPPORTED decision state badge when evidence grounding meets confidence threshold", () => {
    const html = renderToString(<DecisionGraphInspector graph={dummyGraph} focus={supportedFocus} />);

    expect(html).toContain("SUPPORTED");
    expect(html).toContain("Kubernetes Orchestration");
    expect(html).toContain("Architecture.pdf");
  });

  it("3. UI Hardening: renders BLOCKED decision state badge when evidence grounding is missing or weak", () => {
    const html = renderToString(<DecisionGraphInspector graph={dummyGraph} focus={blockedFocus} />);

    expect(html).toContain("BLOCKED");
    expect(html).toContain("Quantum Computing");
  });

  it("4. UI Hardening: handles null focus gracefully without throwing or breaking layout", () => {
    const html = renderToString(<DecisionGraphInspector graph={dummyGraph} focus={null} />);
    expect(html).toContain("DECISION GRAPH INSPECTOR");
    expect(html).toContain("Hover or select any node in the Planetarium");
  });
});
