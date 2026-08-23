import { describe, expect, it, vi } from "vitest";
import { buildCapabilityConvergencePrompt } from "../../../../lib/career/capability-core";
import { verifiedCandidate } from "./fixtures";

describe("Capability Convergence prompt builder", () => {
  it("uses the secret only as system prompt and deterministically transports eligible verified evidence", () => {
    const secret = "ULTRA_SECRET_FAKE_CONVERGENCE_KERNEL_7C31"; const a = verifiedCandidate("A"); const b = verifiedCandidate("B", { evidenceClaims: [{ evidenceId: "EVD_Z", sourceDocumentRef: "D", declaredLocation: "z", exactQuote: "z", verification: { status: "VERIFIED", matchedDocId: "D" } }, { evidenceId: "EVD_A", sourceDocumentRef: "D", declaredLocation: "a", exactQuote: "a", verification: { status: "VERIFIED", matchedDocId: "D" } }] });
    const prompt = buildCapabilityConvergencePrompt([b, a], { kernelVersion: "v", templateId: "T", versionId: "V", checksum: "C", plainTextContent: secret });
    const [first, second] = [a.candidateId, b.candidateId].sort((left, right) => left < right ? -1 : left > right ? 1 : 0); expect(prompt.systemPrompt).toBe(secret); expect(prompt.userPrompt).not.toContain(secret); expect(prompt.userPrompt.indexOf(first)).toBeLessThan(prompt.userPrompt.indexOf(second)); expect(prompt.userPrompt.indexOf("EVD_A")).toBeLessThan(prompt.userPrompt.indexOf("EVD_Z"));
  });
  it("uses code-point ordering even when localeCompare is hostile", () => {
    const localeCompare = vi.spyOn(String.prototype, "localeCompare").mockImplementation(function (this: string, other: string) { return this < other ? 1 : this > other ? -1 : 0; });
    const candidates = [verifiedCandidate("A"), verifiedCandidate("B")]; const prompt = buildCapabilityConvergencePrompt(candidates, { kernelVersion: "v", templateId: "T", versionId: "V", checksum: "C", plainTextContent: "K" }); const [first, second] = candidates.map((candidate) => candidate.candidateId).sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
    expect(prompt.userPrompt.indexOf(first)).toBeLessThan(prompt.userPrompt.indexOf(second));
    localeCompare.mockRestore();
  });
});
