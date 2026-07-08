import { describe, it, expect } from "vitest";
import {
  DEEP_SWEEP_PROMPT_SLUGS,
  CANONICAL_DEEP_SWEEP_PROMPTS,
  seedPromptSystem
} from "../lib/career/prompts/system";
import { InMemoryPromptRepository } from "../lib/career/prompts/repository";
import { ActivePromptResolver } from "../lib/career/prompts/resolver";

describe("CONDYN Career Analysis Protocol v1.0 — Step 18a: Capability Deep Sweep Prompt System Seeding", () => {
  const TEST_ENCRYPTION_KEY = Buffer.alloc(32, 0x99).toString("base64");

  it("should define exactly 7 canonical deep-sweep prompt slugs", () => {
    expect(DEEP_SWEEP_PROMPT_SLUGS).toHaveLength(7);
    expect(CANONICAL_DEEP_SWEEP_PROMPTS).toHaveLength(7);
    expect(DEEP_SWEEP_PROMPT_SLUGS).toContain("capability-deep-sweep");
    expect(DEEP_SWEEP_PROMPT_SLUGS).toContain("recommendation-generation");
  });

  it("should seed all 7 templates and encrypted active versions into PromptRepository with zero plaintext", async () => {
    const repo = new InMemoryPromptRepository();
    await seedPromptSystem(repo, TEST_ENCRYPTION_KEY);

    for (const slug of DEEP_SWEEP_PROMPT_SLUGS) {
      const template = await repo.getTemplateBySlug(slug);
      expect(template).not.toBeNull();
      expect(template!.slug).toBe(slug);

      const activeVersion = await repo.getActiveVersionForTemplate(template!.id);
      expect(activeVersion).not.toBeNull();
      expect(activeVersion!.status).toBe("ACTIVE");

      // Verify zero plaintext: must be canonical format v1:...
      expect(activeVersion!.encrypted_content).toMatch(/^v1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/);
      expect(activeVersion!.content_checksum).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("should allow ActivePromptResolver to decrypt and verify SHA-256 checksums for all 7 prompts", async () => {
    const repo = new InMemoryPromptRepository();
    await seedPromptSystem(repo, TEST_ENCRYPTION_KEY);

    const resolver = new ActivePromptResolver(repo, TEST_ENCRYPTION_KEY);

    for (const slug of DEEP_SWEEP_PROMPT_SLUGS) {
      const resolved = await resolver.resolveActivePrompt(slug);
      expect(resolved.slug).toBe(slug);
      expect(resolved.status).toBe("ACTIVE");
      expect(resolved.versionNumber).toBe(1);
      expect(resolved.plainTextContent.length).toBeGreaterThan(30);

      // Verify decrypted content matches original canonical definition
      const def = CANONICAL_DEEP_SWEEP_PROMPTS.find((p) => p.slug === slug);
      expect(resolved.plainTextContent).toBe(def!.content);
    }
  });

  it("should detect checksum tampering and throw ERR_PROMPT_CHECKSUM_MISMATCH when resolving", async () => {
    const repo = new InMemoryPromptRepository();
    await seedPromptSystem(repo, TEST_ENCRYPTION_KEY);

    // Tamper the checksum of capability-deep-sweep
    const template = await repo.getTemplateBySlug("capability-deep-sweep");
    const activeVer = await repo.getActiveVersionForTemplate(template!.id);

    activeVer!.content_checksum = "0000000000000000000000000000000000000000000000000000000000000000";
    await repo.saveVersion(activeVer!);

    const resolver = new ActivePromptResolver(repo, TEST_ENCRYPTION_KEY);
    await expect(resolver.resolveActivePrompt("capability-deep-sweep")).rejects.toThrow(
      /ERR_PROMPT_CHECKSUM_MISMATCH/
    );
  });

  it("should cleanly reject when encryption key is missing or invalid", async () => {
    const repo = new InMemoryPromptRepository();
    await seedPromptSystem(repo, TEST_ENCRYPTION_KEY);

    const invalidKeyResolver = new ActivePromptResolver(repo, "invalid_short_key");
    await expect(invalidKeyResolver.resolveActivePrompt("capability-deep-sweep")).rejects.toThrow(
      /ERR_INVALID_ENCRYPTION_KEY/
    );
  });
});
