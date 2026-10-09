import { describe, expect, it } from "vitest";
import { decodeCanonicalSilFrontendPresentation } from "../../../lib/career/sil-projection/frontend-presentation";

const region = (state: string, artifactIds: string[] = []) => state === "AVAILABLE" ? { state, artifactIds, artifacts: artifactIds.map(id => ({ id })) } : state === "FAILED" ? { state, failureCode: "ERR_EXACT_FAILURE" } : { state };

describe("canonical SIL frontend presentation", () => {
  it("preserves every canonical region state without replacing it with a visual empty state", () => {
    const presentation = decodeCanonicalSilFrontendPresentation({
      schemaVersion: "CANONICAL_SIL_READ_MODEL_V1",
      identity: region("AVAILABLE", ["DOC_1"]),
      capability: region("EMPTY"),
      resonance: region("NOT_PRODUCED"),
      role: region("UNKNOWN"),
      tension: region("FAILED"),
      evolution: region("AVAILABLE", ["EIS_1"]),
    });
    expect(presentation).toEqual({
      mode: "CANONICAL_TARGET_BOUND_SIL",
      regions: {
        identity: { state: "AVAILABLE", count: 1, artifactIds: ["DOC_1"] },
        capability: { state: "EMPTY", count: 0, artifactIds: [] },
        resonance: { state: "NOT_PRODUCED", count: 0, artifactIds: [] },
        role: { state: "UNKNOWN", count: 0, artifactIds: [] },
        tension: { state: "FAILED", count: 0, artifactIds: [], failureCode: "ERR_EXACT_FAILURE" },
        evolution: { state: "AVAILABLE", count: 1, artifactIds: ["EIS_1"] },
      },
    });
  });

  it("fails closed for malformed API envelopes instead of fabricating canonical state", () => {
    expect(decodeCanonicalSilFrontendPresentation({ schemaVersion: "CANONICAL_SIL_READ_MODEL_V1", identity: { state: "AVAILABLE", artifactIds: [] } })).toBeNull();
  });
});
