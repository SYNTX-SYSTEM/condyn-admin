/**
 * T-07 · under PERSON the Capability Field's server markup is byte-identical with 49e2bc6 (owner G1: PERSON unchanged; §07 only
 * names placeholders, and these sources carry a real title and hash). The base digests were rendered from this same file on 49e2bc6.
 */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { renderToString } from "react-dom/server";
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null }, submitAnalysis: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => ({ state: "NONE" }) }));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));
import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
const data = {
  analysisId: "ANL_T07", generatedAt: "2026-10-22T08:00:00.000Z",
  sources: [{ sourceKind: "PDF", sourceTitle: "Synthetic profile.pdf", contentHash: "5f1c0ffee5f1c0ffee5f1c0ffee5f1c0ffee5f1c0ffee5f1c0ffee5f1c0ffee5", sourceDocumentId: "DOC_001" }],
  capabilities: [{ id: "CAP_1", name: "Distributed Systems Architecture", domain: "Engineering", evidenceSummary: "Architected distributed systems.", evidenceConfidence: 0.8 }],
  companyMatches: [{ organizationId: "ORG_1", organizationName: "Legacy Resonance Works", fitScore: 0.7, matchedCapabilities: [], rationale: "Identified in text." }],
  roleMatches: [{ roleId: "ROLE_1", roleTitle: "Legacy Inferred Lead", organizationName: "Legacy Resonance Works", fitScore: 0.6, matchedCapabilities: [], missingCapabilities: [], rationale: "r" }],
  capabilityGaps: [], nextActions: [{ actionId: "STR_1", title: "Legacy Strategy Path", description: "p", expectedImpact: "t" }],
  reactFlowGraph: { nodes: [], edges: [] }
};
describe("T-07 · PERSON markup equals 49e2bc6", () => it("L0, every focused orbit and DE: the same bytes as the base", () => {
  const base = JSON.parse(readFileSync(new URL("./fixtures/person-markup-49e2bc6.sha256.json", import.meta.url), "utf8")) as Record<string, string>;
  const out: Record<string, string> = {};
  const variants: Record<string, Record<string, unknown>> = { l0: {}, s01: { initialFocus: { stageId: "01", zoomLevel: 1 } }, s02: { initialFocus: { stageId: "02", zoomLevel: 1 } }, s03: { initialFocus: { stageId: "03", zoomLevel: 1 } }, s04: { initialFocus: { stageId: "04", zoomLevel: 1 } }, s06: { initialFocus: { stageId: "06", zoomLevel: 1 } }, de: { initialLocale: "de" } };
  for (const [name, props] of Object.entries(variants)) out[name] = renderToString(<SemanticCareerIntelligenceField data={data as never} fieldFocus="CAPABILITY" investigationMode="PERSON" {...props} />);
  for (const [name, markup] of Object.entries(out)) expect(createHash("sha256").update(markup).digest("hex"), name).toBe(base[name]);
  expect(Object.keys(out).sort()).toEqual(Object.keys(base).sort());
}));
