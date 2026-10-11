import { describe, expect, it } from "vitest";
import { adaptCanonicalToDemoState } from "../../lib/career/ui-adapter";

/**
 * F-JF-2 (PINK, Job Field semantic governance): the planetarium's role alignment joins an LLM-inferred role
 * requirement to a candidate capability by name. In a single-CV analysis both cite the same document, which the
 * epistemic invariant forbids (ERR_EPISTEMIC_VIOLATION). The projection must state the relation as UNRESOLVED,
 * never absent, and must not fail as a whole. F-JF-3: the projection exposes no recommendation id.
 */
const evidence = (quote: string) => [{ doc_id: "DOC_001", location: "page 1", context_quote: quote, evidence_score: 0.9 }];
const entity = (id: string, type: string, name: string, extra: Record<string, unknown> = {}) => ({
  entity_id: id, identity: { type, name }, properties: { category: "Engineering" }, relationships: [], evidence: evidence(`${name} appears in this CV line.`), confidence: 0.9, validation: { status: "VALID" }, ...extra
});

function analysis(roleRequirementName: string) {
  return {
    structured_data: {
      analysis: {
        metadata: { analysis_id: "ANL_PLANETARIUM", validation_state: "VERIFIED" },
        documents: [entity("DOC_001", "DOCUMENT", "cv.pdf")],
        capabilities: [entity("CAP_TS", "CAPABILITY", "TypeScript")],
        requirements: [entity("REQ_TS", "REQUIREMENT", roleRequirementName)],
        organizations: [entity("ORG_A", "ORGANIZATION", "Example GmbH", { properties: { resonance_score: 0.7, country_iso: "DE", industry_enum: "SOFTWARE" } })],
        roles: [entity("ROL_A", "ROLE", "Software Engineer", { relationships: [{ target_id: "REQ_TS", relation_type: "REQUIRES", weight: 1 }, { target_id: "ORG_A", relation_type: "ROLE_IN_ORGANIZATION", weight: 1 }] })],
        domains: [], organization_classes: [], opportunities: [], strategies: [], search_queries: []
      }
    }
  };
}

describe("planetarium role alignment (F-JF-2, F-JF-3)", () => {
  it("states a name coincidence as unresolved instead of failing the projection, without and with a source manifest", () => {
    const withManifest = adaptCanonicalToDemoState(analysis("TypeScript"), [], [{ canonicalDocumentId: "DOC_001", sourceRef: "doc_pdf_1" }]);
    expect(withManifest.roleMatches[0]).toMatchObject({ matchedCapabilities: [], missingCapabilities: [] });
    const state = adaptCanonicalToDemoState(analysis("TypeScript"), [], []);
    expect(state.roleMatches).toHaveLength(1);
    const [role] = state.roleMatches;
    expect(role.matchedCapabilities).toEqual([]);
    expect(role.missingCapabilities).toEqual([]);
  });

  it("keeps a requirement without any capability of that name as not supported", () => {
    const [role] = adaptCanonicalToDemoState(analysis("Rust"), [], []).roleMatches;
    expect(role.missingCapabilities).toEqual(["REQ_TS"]);
  });

  it("exposes no recommendation id of the per-render derivation", () => {
    expect(JSON.stringify(adaptCanonicalToDemoState(analysis("TypeScript"), [], []))).not.toMatch(/REC_\d+/);
  });
});
