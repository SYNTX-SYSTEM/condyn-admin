import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../app/career/demo/demo-data";
import * as proposalAdapter from "../lib/career/capability-proposal-sil-adapter";
import { buildSilClusterPresentation } from "../lib/career/view-model/cluster-presentation";
import { buildEvidenceGraph } from "../lib/career/evidence/traversal";
import * as silField from "../app/components/career/demo/SemanticCareerIntelligenceField";
import { OrbitalSubspaceView } from "../app/components/career/demo/OrbitalSubspaceView";

type ProposalProjectionAdapter = (legacy: typeof EMPTY_CAREER_INTELLIGENCE_DATA, projection: any | null) => typeof EMPTY_CAREER_INTELLIGENCE_DATA;
type LegacyGraphInput = (data: typeof EMPTY_CAREER_INTELLIGENCE_DATA) => typeof EMPTY_CAREER_INTELLIGENCE_DATA;

function adapter(): ProposalProjectionAdapter {
  const factory = (proposalAdapter as unknown as { applyCapabilityProposalProjectionToDemoState?: ProposalProjectionAdapter }).applyCapabilityProposalProjectionToDemoState;
  expect(factory).toBeTypeOf("function");
  if (typeof factory !== "function") throw new Error("F11 SIL proposal projection adapter is unavailable.");
  return factory;
}

function legacyGraphInput(): LegacyGraphInput {
  const factory = (silField as unknown as { excludeCapabilityProposalsFromEvidenceGraph?: LegacyGraphInput }).excludeCapabilityProposalsFromEvidenceGraph;
  expect(factory).toBeTypeOf("function");
  if (typeof factory !== "function") throw new Error("F11 proposal capabilities must be excluded from the legacy evidence graph.");
  return factory;
}

const projection = {
  projectionKind: "CAPABILITY_PROPOSAL",
  projectionState: "PROPOSED",
  evidenceState: "EVIDENCE_PASSED",
  semanticDefinitionState: "NOT_RUN",
  authorityState: "NONE",
  capabilities: [{
    id: "PCAP_SIL",
    name: "Literal evidence routing",
    domain: "Engineering",
    scope: "ATOMIC",
    structuralDefinition: "Routes literal evidence.",
    evidenceState: "EVIDENCE_PASSED",
    semanticDefinitionState: "NOT_RUN",
    authorityState: "NONE",
    sourceCandidateIds: ["CAND_SIL"],
    sourceDocumentIds: ["DOC_SIL"],
    evidence: [{ evidenceId: "EVD_SIL", sourceDocumentId: "DOC_SIL", exactQuote: "Routes literal evidence.", verificationState: "SOURCE_MATCH_VERIFIED" }]
  }],
  relations: []
};

describe("F11 SIL Capability Field proposal adapter", () => {
  it("replaces only capabilities and preserves every legacy field exactly", () => {
    const legacy = {
      ...EMPTY_CAREER_INTELLIGENCE_DATA,
      analysisId: "ANL_SIL",
      generatedAt: "2026-08-31T00:00:00.000Z",
      sources: [{ sourceKind: "PDF", sourceTitle: "Exact Source", contentHash: "DOC_SIL", sourceDocumentId: "DOC_SIL" }],
      companyMatches: [{ organizationId: "ORG", organizationName: "Org", matchedCapabilities: [], rationale: "legacy" }]
    } as any;
    const result = adapter()(legacy, projection);
    expect({ ...result, capabilities: legacy.capabilities }).toEqual(legacy);
    expect(result.capabilities).toEqual([expect.objectContaining({
      id: "PCAP_SIL",
      projectionState: "PROPOSED",
      evidenceState: "EVIDENCE_PASSED",
      semanticDefinitionState: "NOT_RUN",
      authorityState: "NONE",
      evidenceConfidence: undefined
    })]);
  });

  it("keeps null projection legacy-identical and projects PROPOSED clusters without a percentage or round-robin source", () => {
    const legacy = {
      ...EMPTY_CAREER_INTELLIGENCE_DATA,
      sources: [{ sourceKind: "TEXT", sourceTitle: "Exact Source", contentHash: "hash", sourceDocumentId: "DOC_SIL" }]
    } as any;
    expect(adapter()(legacy, null)).toEqual(legacy);
    const projected = adapter()(legacy, projection);
    const clusters = buildSilClusterPresentation("02", true, { labels: ["WRONG"], titles: ["Wrong Source"] }, projected);
    expect(clusters).toEqual([expect.objectContaining({ title: "Literal evidence routing", confidence: undefined, projectionState: "PROPOSED", evidenceCount: 1, evidences: [{ id: "EVD_SIL", title: "Exact Source", sourceType: "TEXT", snippet: "Routes literal evidence." }] })]);
    expect(JSON.stringify(clusters)).not.toContain("%");
    expect(JSON.stringify(clusters)).not.toContain("WRONG");
  });

  it("does not feed PCAP proposal state into the legacy evidence graph", () => {
    const projected = adapter()({ ...EMPTY_CAREER_INTELLIGENCE_DATA } as any, projection);
    const graph = buildEvidenceGraph({ structured_data: legacyGraphInput()(projected) }, []);
    expect(graph.capabilityNodes).not.toContainEqual(expect.objectContaining({ id: "PCAP_SIL" }));
  });

  it("renders proposal evidence without verified labels or synthetic L3/L4 metadata", () => {
    const proposedCluster = {
      id: "PCAP_SIL",
      title: "Literal evidence routing",
      confidence: undefined,
      projectionState: "PROPOSED" as const,
      evidenceState: "EVIDENCE_PASSED" as const,
      semanticDefinitionState: "NOT_RUN" as const,
      evidenceCount: 1,
      dx: 0,
      dy: 0,
      evidences: [{ id: "EVD_SIL", title: "Exact Source", sourceType: "TEXT", snippet: "Routes literal evidence." }]
    };
    const level2 = renderToString(React.createElement(OrbitalSubspaceView, {
      stageId: "02", stageName: "Capability Field", zoomLevel: 2, clusters: [proposedCluster]
    }));
    expect(level2).toContain("SOURCE-MATCH EVIDENCE NODE");
    expect(level2).not.toContain("VERIFIED EVIDENCE NODE");
    const level3 = renderToString(React.createElement(OrbitalSubspaceView, {
      stageId: "02", stageName: "Capability Field", zoomLevel: 3, clusters: [proposedCluster]
    }));
    expect(level3).toContain("STATE: PROPOSED");
    expect(level3).toContain("EVIDENCE: SOURCE MATCH");
    expect(level3).toContain("SEMANTIC DEFINITION: NOT RUN");
    expect(level3).not.toContain("CONDYN-EVIDENCE-VERIFIED-492");
    expect(level3).not.toContain("Latency: 0.2ms");
    expect(level3).not.toContain("Signature Matching: PASSED");
  });
});
