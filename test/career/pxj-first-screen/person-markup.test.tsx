/**
 * T-07 · under PERSON the Capability Field's server markup is byte-identical with 49e2bc6 (owner G1: PERSON unchanged; §07 only
 * names placeholders, and these sources carry a real title and hash). The base digests were rendered from this same file on 49e2bc6.
 *
 * Phase D (PERSON_X_JOB_MAPPING_PHASE_D.md D-3, held by PINK fb7010aa) narrows the seal by exactly two shell subtrees it is mandated
 * to change: the field selector `field-focus-strip` (three options, C-3) and the MAPPING gate line `mapping-gate-reason` (C-10/C-11).
 * Both are removed by depth-matched element extraction (never a regex) before hashing. The digests were RE-DERIVED from a render at
 * 49e2bc6 with the same extraction — the reference is unchanged — and the fixture names what it excludes. Everything else, the
 * capability gate's entry line included, stays inside the hash. The extraction must find what it removes: the strip in every
 * render, the MAPPING line in every render here (PERSON without an analysis: gated NO_ANALYSIS) — at 49e2bc6 it did not exist.
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
/** The two subtrees phase D may change, each found by its own opening tag. */
export const SEAL_EXCLUDED = ['[data-testid="field-focus-strip"]', '[data-testid="mapping-gate-reason"]'] as const;
const OPENING: Record<typeof SEAL_EXCLUDED[number], string> = { '[data-testid="field-focus-strip"]': 'data-testid="field-focus-strip"', '[data-testid="mapping-gate-reason"]': 'data-testid="mapping-gate-reason"' };
/**
 * Removes the one element whose opening tag carries `marker`, with its whole subtree, by div depth (the elements are divs). Returns
 * the markup unchanged and `found: 0` when no element carries it; a marker on more than one element is refused.
 */
export function withoutElement(html: string, marker: string): { html: string; found: number } {
  const elementAt = (from: number) => { for (let at = html.indexOf(marker, from); at !== -1; at = html.indexOf(marker, at + 1)) { const open = html.lastIndexOf("<", at); if (html.startsWith("<div", open) && html.indexOf(">", open) > at) return open; } return -1; };
  const start = elementAt(0);
  if (start === -1) return { html, found: 0 };
  if (elementAt(html.indexOf(">", start)) !== -1) throw new Error(`ERR_T07_MARKER_NOT_UNIQUE:${marker}`);
  const tags = /<\/?div\b/g;
  tags.lastIndex = start;
  let depth = 0;
  for (let match = tags.exec(html); match !== null; match = tags.exec(html)) {
    depth += match[0] === "<div" ? 1 : -1;
    if (depth === 0) { const end = html.indexOf(">", match.index) + 1; return { html: html.slice(0, start) + html.slice(end), found: 1 }; }
  }
  throw new Error(`ERR_T07_UNCLOSED:${marker}`);
}
export function sealed(html: string): { html: string; found: Record<string, number> } {
  let out = html; const found: Record<string, number> = {};
  for (const selector of SEAL_EXCLUDED) { const cut = withoutElement(out, OPENING[selector]); out = cut.html; found[selector] = cut.found; }
  return { html: out, found };
}

const variants: Record<string, Record<string, unknown>> = { l0: {}, s01: { initialFocus: { stageId: "01", zoomLevel: 1 } }, s02: { initialFocus: { stageId: "02", zoomLevel: 1 } }, s03: { initialFocus: { stageId: "03", zoomLevel: 1 } }, s04: { initialFocus: { stageId: "04", zoomLevel: 1 } }, s06: { initialFocus: { stageId: "06", zoomLevel: 1 } }, de: { initialLocale: "de" } };
describe("T-07 · PERSON markup equals 49e2bc6 (the seal narrowed by phase D's two shell subtrees)", () => {
  it("L0, every focused orbit and DE: the same bytes as the base, outside the two excluded subtrees", () => {
    const fixture = JSON.parse(readFileSync(new URL("./fixtures/person-markup-49e2bc6.sha256.json", import.meta.url), "utf8")) as { reference: string; excluded: string[]; digests: Record<string, string>; atReference: Record<string, Record<string, number>> };
    expect([fixture.reference, fixture.excluded], "the fixture says what it hashed").toEqual(["49e2bc6", [...SEAL_EXCLUDED]]);
    const out: Record<string, string> = {};
    for (const [name, props] of Object.entries(variants)) {
      const cut = sealed(renderToString(<SemanticCareerIntelligenceField data={data as never} fieldFocus="CAPABILITY" investigationMode="PERSON" {...props} />));
      // Vacuity guard: the extraction found what it removes — the strip in both renders, the MAPPING line here and not at 49e2bc6.
      expect(cut.found, name).toEqual({ '[data-testid="field-focus-strip"]': 1, '[data-testid="mapping-gate-reason"]': 1 });
      expect(fixture.atReference[name], `${name} at 49e2bc6`).toEqual({ '[data-testid="field-focus-strip"]': 1, '[data-testid="mapping-gate-reason"]': 0 });
      out[name] = cut.html;
    }
    for (const [name, markup] of Object.entries(out)) expect(createHash("sha256").update(markup).digest("hex"), name).toBe(fixture.digests[name]);
    expect(Object.keys(out).sort()).toEqual(Object.keys(fixture.digests).sort());
  });

  it("the extraction removes exactly the element and its subtree — nothing before, nothing after, nested divs included", () => {
    const html = '<p>a</p><div data-testid="field-focus-strip" class="x"><style>[data-testid="field-focus-strip"] div{}</style><div><div>i</div></div><span>s</span></div><div data-testid="keep">k</div>';
    expect(withoutElement(html, 'data-testid="field-focus-strip"')).toEqual({ html: '<p>a</p><div data-testid="keep">k</div>', found: 1 });
    expect(withoutElement(html, 'data-testid="mapping-gate-reason"')).toEqual({ html, found: 0 });
    expect(() => withoutElement(`${html}<div data-testid="field-focus-strip"></div>`, 'data-testid="field-focus-strip"')).toThrow(/NOT_UNIQUE/);
  });
});
