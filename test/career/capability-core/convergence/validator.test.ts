import { describe, expect, it } from "vitest";
import { validateCapabilityConvergenceOutput } from "../../../../lib/career/capability-core";
import { convergenceOutput, verifiedCandidate } from "./fixtures";

describe("Capability Convergence validator", () => {
  it("accepts a one-member group with exact reconciliation audit", () => { const candidate = verifiedCandidate("A"); expect(validateCapabilityConvergenceOutput(convergenceOutput([candidate.candidateId]), [candidate]).groups).toHaveLength(1); });
  it("fails closed when reconciliation_pass_completed is false", () => { const candidate = verifiedCandidate("A"); const output = convergenceOutput([candidate.candidateId]); output.reconciliation_audit.reconciliation_pass_completed = false; expect(() => validateCapabilityConvergenceOutput(output, [candidate])).toThrow("AUDIT_MISMATCH"); });
});
