import { describe, it, expect } from "vitest";
import {
  seedPromptSystem
} from "../lib/career/prompts/system";
import { InMemoryPromptRepository } from "../lib/career/prompts/repository";
import { ActivePromptResolver } from "../lib/career/prompts/resolver";
import { UniversalEntitySchema } from "../lib/career/schema";
import { buildCareerAnalysisPrompt } from "../lib/career/adapter";

describe("CONDYN Career Analysis Protocol v1.0 — Step 25b: Prompt Verification Harness (`test/career-deep-sweep-prompt.test.ts`)", () => {
  const TEST_ENCRYPTION_KEY = Buffer.alloc(32, 0xAA).toString("base64");

  it("1. should resolve active version of capability-deep-sweep prompt with valid SHA-256 checksum", async () => {
    const repo = new InMemoryPromptRepository();
    await seedPromptSystem(repo, TEST_ENCRYPTION_KEY);

    const resolver = new ActivePromptResolver(repo, TEST_ENCRYPTION_KEY);
    const resolved = await resolver.resolveActivePrompt("capability-deep-sweep");

    expect(resolved.slug).toBe("capability-deep-sweep");
    expect(resolved.status).toBe("ACTIVE");
    expect(resolved.versionNumber).toBe(1);
    expect(resolved.plainTextContent).toContain("expert systems & career ontology extractor");
  });

  it("2. should verify capability-deep-sweep prompt strictly adheres to PROMPT_CONTRACT directives", async () => {
    const repo = new InMemoryPromptRepository();
    await seedPromptSystem(repo, TEST_ENCRYPTION_KEY);

    const resolver = new ActivePromptResolver(repo, TEST_ENCRYPTION_KEY);
    const resolved = await resolver.resolveActivePrompt("capability-deep-sweep");

    // Verify contract instructions exist
    expect(resolved.plainTextContent).toContain("CONDYN Career Analysis Protocol v1.0");
    expect(resolved.plainTextContent).toContain("Confidence score strictly normalized to [0.0, 1.0]");
    expect(resolved.plainTextContent).toContain("Direct evidence text citation from source document");
  });

  it("3. should validate sample capability extraction output against UniversalEntitySchema (Capability Quality Check)", () => {
    const mockCapabilityOutput = {
      entity_id: "CAP_DIST_SYSTEMS",
      identity: {
        type: "capability",
        name: "Distributed Systems Architecture"
      },
      properties: {
        domain: "Systems Engineering",
        level: "L5"
      },
      relationships: [
        {
          target_id: "ORG_SIEMENS",
          relation_type: "ROLE_IN_ORGANIZATION",
          weight: 0.95
        }
      ],
      evidence: [
        {
          doc_id: "DOC_SIEMENS_ARCH",
          location: "Page 14, Section 3.2",
          context_quote: "Architected fault-tolerant distributed system processing 50k RPS.",
          evidence_score: 0.98
        }
      ],
      confidence: 0.95,
      validation: {
        status: "PASSED"
      }
    };

    const parsed = UniversalEntitySchema.parse(mockCapabilityOutput);
    expect(parsed.entity_id).toBe("CAP_DIST_SYSTEMS");
    expect(parsed.confidence).toBe(0.95);
    expect(parsed.evidence[0].context_quote.length).toBeGreaterThanOrEqual(10);
  });

  it("4. should reject capability extraction output if evidence quote is missing or under 10 chars", () => {
    const invalidCapabilityOutput = {
      entity_id: "CAP_INVALID",
      identity: { type: "capability", name: "Hallucinated Skill" },
      properties: {},
      relationships: [],
      evidence: [
        {
          doc_id: "DOC_UNKNOWN",
          location: "Unknown",
          context_quote: "Short", // < 10 chars should violate schema
          evidence_score: 0.50
        }
      ],
      confidence: 0.50,
      validation: { status: "UNVERIFIED" }
    };

    expect(() => UniversalEntitySchema.parse(invalidCapabilityOutput)).toThrow();
  });

  it("5. should verify that the active PC-CONDYN-CAP-v1.0 extraction contract explicitly enforces ROLE EXTRACTION RULE", () => {
    const promptOutput = buildCareerAnalysisPrompt([]);
    const systemPrompt = promptOutput.systemPrompt;

    expect(systemPrompt).toContain("ROLE EXTRACTION RULE: A Role may only be emitted when the source contains sufficient evidence for both the Role itself AND the Organization context");
    expect(systemPrompt).toContain("the referenced Organization MUST exist in the \"entities\" array");
    expect(systemPrompt).toContain("The Role MUST contain a \"ROLE_IN_ORGANIZATION\" relationship");
    expect(systemPrompt).toContain("where \"target_id\" references that existing Organization entity");
    expect(systemPrompt).toContain("Both Role and relationship MUST be grounded in source evidence");
    expect(systemPrompt).toContain("DO NOT invent or create a placeholder Organization");
    expect(systemPrompt).toContain("DO NOT emit an orphan Role");
    expect(systemPrompt).toContain("DO retain any independently grounded capabilities normally");
  });
});
