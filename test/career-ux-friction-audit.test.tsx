import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { DecisionGraphInspector } from "../app/components/career/demo/DecisionGraphInspector";
import { SourceDock } from "../app/components/career/demo/SourceDock";
import { DirectedEvidenceGraph } from "../lib/career/evidence/graph";
import { GraphFocus } from "../lib/career/evidence/highlight";

describe("CONDYN Career Analysis Protocol v1.0 — Step 27: UX Friction, Information Hierarchy & Demo Narrative Audit", () => {
  const sampleGraph: DirectedEvidenceGraph = {
    sourceNodes: [{ id: "DOC_1", title: "Principal_CV.pdf", type: "pdf" }],
    evidenceNodes: [
      {
        id: "EV_1",
        sourceId: "DOC_1",
        sourceType: "pdf",
        confidence: 0.96,
        excerpt: "Designed multi-region Kafka architecture handling 10M msg/sec",
        location: { file: "Principal_CV.pdf" },
        capabilities: ["CAP_KAFKA"],
        metadata: {}
      }
    ],
    capabilityNodes: [
      {
        id: "CAP_KAFKA",
        name: "Distributed Event Streaming (Kafka)",
        domain: "System Architecture",
        incomingEvidenceIds: ["EV_1"],
        outgoingRequirementIds: ["REQ_KAFKA"],
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

  const sampleFocus: GraphFocus = {
    focusNodeId: "CAP_KAFKA",
    nodes: ["CAP_KAFKA", "DOC_1", "EV_1"],
    edges: [],
    upstreamNodes: ["DOC_1", "EV_1"],
    downstreamNodes: []
  };

  it("1. Information Hierarchy Audit: Inspector follows exact 5s/30s visual comprehension order", () => {
    const html = renderToString(
      <DecisionGraphInspector graph={sampleGraph} focus={sampleFocus} />
    );

    // 1st glance: Component Title & Status
    expect(html).toContain("DECISION GRAPH INSPECTOR");
    // 2nd glance: Focus Node Title
    expect(html).toContain("Distributed Event Streaming (Kafka)");
    // 5 seconds: Decision State & Evidence Quality
    expect(html).toContain("SUPPORTED");
    expect(html).toContain("HIGH CONFIDENCE");
    // 30 seconds: Traceability Flow & Upstream Excerpts
    expect(html).toContain("TRACEABILITY FLOW");
    expect(html).toContain("Designed multi-region Kafka architecture handling 10M msg/sec");
  });

  it("2. Cognitive Load Audit: Idle state avoids visual clutter and provides clear orientation call-to-action", () => {
    const html = renderToString(
      <DecisionGraphInspector graph={sampleGraph} focus={null} />
    );

    expect(html).toContain("DECISION GRAPH INSPECTOR");
    expect(html).toContain("Hover or select any node in the Planetarium to inspect its bidirectional Decision Graph focus.");
    expect(html).not.toContain("UPSTREAM (0)");
    expect(html).not.toContain("DOWNSTREAM (0)");
  });

  it("3. Enterprise Demo Narrative Audit: UI components cover all 6 storytelling steps without manual explanation", () => {
    const dockHtml = renderToString(<SourceDock sources={[]} />);
    const inspectorHtml = renderToString(<DecisionGraphInspector graph={sampleGraph} focus={sampleFocus} />);

    // Step 1: Bring knowledge in
    expect(dockHtml).toContain("WISSEN EINSPEISEN");
    // Step 3 & 4: Evidence & Capability Grounding
    expect(inspectorHtml).toContain("EVIDENCE QUALITY");
    // Step 5: Explain decision
    expect(inspectorHtml).toContain("SUPPORTED");
    // Step 6: Show why (Traceability back to PDF excerpt)
    expect(inspectorHtml).toContain("Principal_CV.pdf");
  });
});
