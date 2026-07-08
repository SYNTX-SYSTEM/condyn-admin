import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import {
  getPromptEncryptionKey,
  computePromptChecksum,
  encryptPromptContent,
  decryptPromptContent
} from "../lib/career/prompts/crypto";
import {
  PromptTemplate,
  PromptVersion,
  PromptStatusSchema
} from "../lib/career/prompts/schema";
import { InMemoryPromptRepository } from "../lib/career/prompts/repository";
import { ActivePromptResolver } from "../lib/career/prompts/resolver";

describe("CONDYN Career Analysis Protocol v1.0 — Step 15: Encrypted Prompt Registry", () => {
  const validKey32 = crypto.randomBytes(32).toString("base64");
  const samplePromptText = "You are CONDYN Capability Deep Sweep engine. Extract exact capability tokens...";

  beforeEach(() => {
    process.env.PROMPT_ENCRYPTION_KEY = validKey32;
  });

  afterEach(() => {
    delete process.env.PROMPT_ENCRYPTION_KEY;
  });

  describe("1. Cryptographic Core (crypto.ts)", () => {
    it("should throw ERR_MISSING_ENCRYPTION_KEY when PROMPT_ENCRYPTION_KEY is unset", () => {
      delete process.env.PROMPT_ENCRYPTION_KEY;
      expect(() => getPromptEncryptionKey()).toThrow(/ERR_MISSING_ENCRYPTION_KEY/);
    });

    it("should throw ERR_INVALID_ENCRYPTION_KEY when key does not decode to exactly 32 bytes", () => {
      process.env.PROMPT_ENCRYPTION_KEY = Buffer.from("shortkey").toString("base64");
      expect(() => getPromptEncryptionKey()).toThrow(/ERR_INVALID_ENCRYPTION_KEY/);
    });

    it("should encrypt prompt plaintext into canonical v1:<iv>:<authTag>:<ciphertext> format", () => {
      const result = encryptPromptContent(samplePromptText);
      expect(result.encryptedContent).toMatch(/^v1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/);
      expect(result.checksum).toHaveLength(64);
    });

    it("should successfully decrypt canonical ciphertext back to original prompt plaintext", () => {
      const { encryptedContent } = encryptPromptContent(samplePromptText);
      const decrypted = decryptPromptContent(encryptedContent);
      expect(decrypted).toBe(samplePromptText);
    });

    it("should compute deterministic SHA-256 hex checksum", () => {
      const checksum1 = computePromptChecksum(samplePromptText);
      const checksum2 = computePromptChecksum(samplePromptText);
      expect(checksum1).toBe(checksum2);
      expect(checksum1).toHaveLength(64);
    });
  });

  describe("2. Persistence Repository (repository.ts)", () => {
    let repo: InMemoryPromptRepository;

    beforeEach(() => {
      repo = new InMemoryPromptRepository();
    });

    it("should save and load prompt templates and versions without storing plaintext", async () => {
      const template: PromptTemplate = {
        id: "tmpl_sweep_1",
        slug: "capability-deep-sweep",
        name: "Capability Deep Sweep",
        domain: "capability_extraction",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await repo.saveTemplate(template);

      const { encryptedContent, checksum } = encryptPromptContent(samplePromptText);
      const version: PromptVersion = {
        id: "ver_sweep_1",
        prompt_template_id: template.id,
        version: 1,
        encrypted_content: encryptedContent,
        content_checksum: checksum,
        status: "ACTIVE",
        created_at: new Date().toISOString()
      };

      await repo.saveVersion(version);

      const loadedVer = await repo.getVersionById("ver_sweep_1");
      expect(loadedVer).toBeDefined();
      expect(loadedVer?.encrypted_content).toBe(encryptedContent);
      // Guarantee zero plaintext field exists on the version object
      expect((loadedVer as any).content).toBeUndefined();
      expect((loadedVer as any).plainText).toBeUndefined();
    });
  });

  describe("3. Runtime Sovereignty (ActivePromptResolver)", () => {
    let repo: InMemoryPromptRepository;
    let resolver: ActivePromptResolver;

    beforeEach(async () => {
      repo = new InMemoryPromptRepository();
      resolver = new ActivePromptResolver(repo);
    });

    it("should resolve and decrypt an ACTIVE prompt version verified by checksum", async () => {
      const template: PromptTemplate = {
        id: "tmpl_sweep_active",
        slug: "capability-deep-sweep",
        name: "Capability Deep Sweep",
        domain: "capability_extraction",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await repo.saveTemplate(template);

      const { encryptedContent, checksum } = encryptPromptContent(samplePromptText);
      const version: PromptVersion = {
        id: "ver_active_1",
        prompt_template_id: template.id,
        version: 1,
        encrypted_content: encryptedContent,
        content_checksum: checksum,
        status: "ACTIVE",
        created_at: new Date().toISOString()
      };
      await repo.saveVersion(version);

      const resolved = await resolver.resolveActivePrompt("capability-deep-sweep");
      expect(resolved.slug).toBe("capability-deep-sweep");
      expect(resolved.plainTextContent).toBe(samplePromptText);
      expect(resolved.checksum).toBe(checksum);
    });

    it("should strictly reject DRAFT or APPROVED versions at runtime", async () => {
      const template: PromptTemplate = {
        id: "tmpl_sweep_draft",
        slug: "capability-deep-sweep-draft",
        name: "Capability Deep Sweep Draft",
        domain: "capability_extraction",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await repo.saveTemplate(template);

      const { encryptedContent, checksum } = encryptPromptContent(samplePromptText);
      const version: PromptVersion = {
        id: "ver_draft_1",
        prompt_template_id: template.id,
        version: 1,
        encrypted_content: encryptedContent,
        content_checksum: checksum,
        status: "DRAFT",
        created_at: new Date().toISOString()
      };
      await repo.saveVersion(version);

      await expect(resolver.resolveActivePrompt("capability-deep-sweep-draft")).rejects.toThrow(
        /ERR_NO_ACTIVE_PROMPT_VERSION/
      );
    });

    it("should throw ERR_PROMPT_CHECKSUM_MISMATCH when stored content_checksum does not match decrypted content", async () => {
      const template: PromptTemplate = {
        id: "tmpl_sweep_tamper",
        slug: "capability-deep-sweep-tamper",
        name: "Tampered Prompt",
        domain: "capability_extraction",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await repo.saveTemplate(template);

      const { encryptedContent } = encryptPromptContent(samplePromptText);
      const fakeTamperedChecksum = "0000000000000000000000000000000000000000000000000000000000000000";

      const version: PromptVersion = {
        id: "ver_tamper_1",
        prompt_template_id: template.id,
        version: 1,
        encrypted_content: encryptedContent,
        content_checksum: fakeTamperedChecksum,
        status: "ACTIVE",
        created_at: new Date().toISOString()
      };
      await repo.saveVersion(version);

      await expect(resolver.resolveActivePrompt("capability-deep-sweep-tamper")).rejects.toThrow(
        /ERR_PROMPT_CHECKSUM_MISMATCH/
      );
    });
  });
});
