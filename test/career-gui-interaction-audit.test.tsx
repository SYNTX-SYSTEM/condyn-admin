import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { SourceDock } from "../app/components/career/demo/SourceDock";
import { DecisionGraphInspector } from "../app/components/career/demo/DecisionGraphInspector";
import { InferenceTelemetryHUD } from "../app/components/career/demo/InferenceTelemetryHUD";
import { DirectedEvidenceGraph } from "../lib/career/evidence/graph";
import { GraphFocus } from "../lib/career/evidence/highlight";

describe("CONDYN Career Analysis Protocol v1.0 — Step 27: Complete Interaction Audit Suite", () => {
  const dummyGraph: DirectedEvidenceGraph = {
    sourceNodes: [
      { id: "DOC_1", title: "Architecture.pdf", type: "pdf" },
      { id: "SRC_GH", title: "kafka-operator", type: "github" }
    ],
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
        outgoingRequirementIds: ["REQ_1"],
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

  const activeFocus: GraphFocus = {
    focusNodeId: "CAP_K8S",
    nodes: ["CAP_K8S", "DOC_1", "EV_1", "REQ_1", "JOB_1"],
    edges: [],
    upstreamNodes: ["DOC_1", "EV_1"],
    downstreamNodes: ["REQ_1", "JOB_1"]
  };

  it("1. SourceDock Audit: renders all multi-source ingestion action buttons (PDF, GitHub, Website, Markdown)", () => {
    const html = renderToString(
      <SourceDock
        sources={[]}
        onAddSource={() => {}}
        onRemoveSource={() => {}}
        onAnalyze={() => {}}
        isAnalyzing={false}
      />
    );

    expect(html).toContain("PDF DOKUMENT HOCHLADEN");
    expect(html).toContain("GITHUB URL");
    expect(html).toContain("WEBSITE URL");
    expect(html).toContain("TEXT / MARKDOWN EINGEBEN");
  });

  it("2. SourceDock Audit: renders ANALYSE LÄUFT... state when analysis trigger is active", () => {
    const html = renderToString(
      <SourceDock
        sources={[]}
        initialStagedDocs={[
          {
            id: "doc-1",
            name: "Architecture.pdf",
            type: "pdf",
            size: 1024,
            status: "ready"
          }
        ]}
        onAddSource={() => {}}
        onRemoveSource={() => {}}
        onAnalyze={() => {}}
        isAnalyzing={true}
      />
    );

    expect(html).toContain("ANALYSE LÄUFT...");
  });

  it("3. DecisionGraphInspector Audit: renders interactive Upstream & Downstream navigation lists", () => {
    const html = renderToString(
      <DecisionGraphInspector graph={dummyGraph} focus={activeFocus} />
    );

    expect(html).toContain("UPSTREAM");
    expect(html).toContain("Architecture.pdf");
    expect(html).toContain("Managed K8s cluster");
    expect(html).toContain("DOWNSTREAM");
  });

  it("4. InferenceTelemetryHUD Audit: visualizes active execution stages and failover cascade status", () => {
    const html = renderToString(
      <InferenceTelemetryHUD
        telemetry={{
          activeModel: "Gemini Pro v1.5",
          totalLatencyMs: 142,
          fallbackTriggered: false,
          modelsAttempted: [
            { model: "Gemini Pro v1.5", status: "SUCCESS", latencyMs: 142 }
          ]
        }}
        isAnalyzing={false}
      />
    );

    expect(html).toContain("GEMINI PRO V1.5");
    expect(html).toContain("142ms");
    expect(html).toContain("INFERENCE CASCADE");
    expect(html).toContain("SUCCESS");
  });
});
