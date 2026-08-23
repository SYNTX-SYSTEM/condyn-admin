import { describe, expect, it } from "vitest";
import { canonicalizeCapabilityConvergence, validateCapabilityConvergenceOutput } from "../../../../lib/career/capability-core";
import { convergenceOutput, verifiedCandidate } from "./fixtures";

describe("Capability Convergence canonicalizer", () => {
  it("derives the same PCAP draft identity independent of member input order", () => {
    const a = verifiedCandidate("A"); const b = verifiedCandidate("B"); const output = convergenceOutput([b.candidateId, a.candidateId]);
    const first = canonicalizeCapabilityConvergence(validateCapabilityConvergenceOutput(output, [a, b]), [a, b], "now"); const second = canonicalizeCapabilityConvergence(validateCapabilityConvergenceOutput(output, [b, a]), [b, a], "now");
    expect(first.canonicalDrafts[0].provisionalCapabilityId).toBe(second.canonicalDrafts[0].provisionalCapabilityId);
  });
});
