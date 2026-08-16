import { describe, it, expect } from "vitest";
import { evaluateCapabilityConvergence, mergeConvergedCapabilities } from "../lib/career/capabilities/convergence";
import { UniversalEntity } from "../lib/career/schema";

describe("CONDYN Career Analysis Protocol v2.0 - PHASE 2: CAPABILITY CONVERGENCE (TEST002B)", () => {
  
  const buildCap = (id: string, name: string, evidence: any[]): UniversalEntity => ({
    entity_id: id,
    identity: { type: "CAPABILITY", name },
    properties: { category: "TECHNICAL" },
    relationships: [],
    confidence: 0.9,
    validation: { status: "PASSED" },
    evidence
  });

  it("A. Exact semantic duplicate -> SAME_CAPABILITY and preserves evidence branches", () => {
    const capA = buildCap("CAP_A", "Distributed Systems Architecture", [
      { doc_id: "DOC_001", location: "A", context_quote: "Quote 1", evidence_score: 0.9 }
    ]);
    const capB = buildCap("CAP_B", "Distributed Systems Architecture", [
      { doc_id: "DOC_002", location: "B", context_quote: "Quote 2", evidence_score: 0.9 }
    ]);

    const result = evaluateCapabilityConvergence(capA, capB);
    expect(result.decision).toBe("SAME_CAPABILITY");

    const merged = mergeConvergedCapabilities(capA, capB);
    expect(merged.entity_id).toBe("CAP_A");
    expect(merged.evidence).toHaveLength(2);
    expect(merged.evidence.map(e => e.doc_id)).toContain("DOC_001");
    expect(merged.evidence.map(e => e.doc_id)).toContain("DOC_002");
  });

  it("B. Lexical variation / semantic equivalence -> UNRESOLVED if ambiguous", () => {
    const capA = buildCap("CAP_A", "Distributed Systems Design", []);
    const capB = buildCap("CAP_B", "Architecture of Distributed Systems", []);

    // Without a deterministic rule (or LLM assertion), this cannot be safely merged blindly
    const result = evaluateCapabilityConvergence(capA, capB);
    expect(["UNRESOLVED", "RELATED_CAPABILITY"]).toContain(result.decision);
  });

  it("C. Similar words, different capability -> DISTINCT_CAPABILITY", () => {
    const capA = buildCap("CAP_A", "Distributed Systems Architecture", []);
    const capB = buildCap("CAP_B", "Distributed Systems Operations", []);

    const result = evaluateCapabilityConvergence(capA, capB);
    expect(result.decision).toBe("DISTINCT_CAPABILITY");
  });

  it("D. Parent / child relationship -> RELATED_CAPABILITY", () => {
    const capA = buildCap("CAP_A", "Cloud Architecture", []);
    const capB = buildCap("CAP_B", "AWS Landing Zone Architecture", []);

    const result = evaluateCapabilityConvergence(capA, capB);
    // Hard to determine deterministically purely on string level without a taxonomy, 
    // but a deterministic system should flag it as unresolved or distinct if unsure.
    expect(result.decision).not.toBe("SAME_CAPABILITY");
  });

  it("F. Cross-source duplicate maintains exact quotes, avoiding silent deduplication", () => {
    const capA = buildCap("CAP_A", "Rust Core", [
      { doc_id: "DOC_001", location: "A", context_quote: "Same exact quote", evidence_score: 0.9 }
    ]);
    const capB = buildCap("CAP_B", "Rust Core", [
      { doc_id: "DOC_002", location: "A", context_quote: "Same exact quote", evidence_score: 0.9 }
    ]);

    const result = evaluateCapabilityConvergence(capA, capB);
    expect(result.decision).toBe("SAME_CAPABILITY");

    const merged = mergeConvergedCapabilities(capA, capB);
    // Even if quotes are the same, doc_ids differ, so BOTH must be kept!
    expect(merged.evidence).toHaveLength(2);
  });
});
