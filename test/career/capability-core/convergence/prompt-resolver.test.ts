import { describe, expect, it } from "vitest";
import { ActivePromptCapabilityConvergenceResolver } from "../../../../lib/career/capability-core";

describe("Capability Convergence prompt resolver", () => {
  it("resolves the active convergence prompt with the default phase-three slug", async () => {
    let slug = ""; const resolver = new ActivePromptCapabilityConvergenceResolver({ resolveActivePrompt: async (requestedSlug: string) => { slug = requestedSlug; return { templateId: "T", versionId: "V", checksum: "C", plainTextContent: "ULTRA_SECRET_FAKE_CONVERGENCE_KERNEL_7C31" }; } } as never, "convergence-v1");
    await expect(resolver.resolve()).resolves.toMatchObject({ kernelVersion: "convergence-v1", checksum: "C" }); expect(slug).toBe("capability-convergence-v1");
  });
});
