import { describe, expect, it } from "vitest";
import { normalizeEvidenceMatchText, normalizeSourceText } from "../../../lib/career/capability-core";

describe("Capability Core source normalization", () => {
  it("normalizes line endings and NFKC while preserving readable punctuation", () => {
    expect(normalizeSourceText("A\r\nＢ → C")).toBe("A\nB → C");
    expect(normalizeSourceText("Policy: Control/Owner.")).toBe("Policy: Control/Owner.");
  });
  it("collapses evidence-match whitespace only", () => {
    expect(normalizeEvidenceMatchText(" Policy\n\tControl  Owner ")).toBe("Policy Control Owner");
    expect(normalizeEvidenceMatchText("Policy -> Control")).toBe("Policy -> Control");
  });
});
