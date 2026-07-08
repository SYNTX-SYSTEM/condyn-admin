import { describe, it, expect } from "vitest";
import { executeCareerAnalysisPipeline } from "../lib/career/pipeline";
import { MockInferenceProvider } from "../lib/career/adapter";
import { InMemoryPromptRepository } from "../lib/career/prompts/repository";
import { ActivePromptResolver } from "../lib/career/prompts/resolver";
import { seedPromptSystem } from "../lib/career/prompts/system";

describe("CONDYN Career Analysis Protocol v1.0 — Step 18b: Pipeline Active Prompt Resolver Integration", () => {
  const TEST_KEY = Buffer.alloc(32, 0x42).toString("base64");

  it("should use capability-deep-sweep active prompt and attach promptMetadata when promptResolver is passed", async () => {
    const repo = new InMemoryPromptRepository();
    await seedPromptSystem(repo, TEST_KEY);

    const resolver = new ActivePromptResolver(repo, TEST_KEY);

    let capturedSystemPrompt = "";
    const provider = new MockInferenceProvider();
    const originalExecute = provider.execute.bind(provider);
    provider.execute = async (prompt) => {
      capturedSystemPrompt = prompt.systemPrompt;
      return originalExecute(prompt);
    };

    const result = await executeCareerAnalysisPipeline(
      [{ title: "Test Resume", content: "Senior Cloud Architect with 10 years experience." }],
      provider,
      { promptResolver: resolver }
    );

    expect(result.success).toBe(true);
    expect(result.metrics.promptMetadata).toBeDefined();
    expect(result.metrics.promptMetadata!.slug).toBe("capability-deep-sweep");
    expect(result.metrics.promptMetadata!.templateId).toBe("tpl_capability-deep-sweep");
    expect(result.metrics.promptMetadata!.versionId).toBe("ver_capability-deep-sweep_v1");
    expect(result.metrics.promptMetadata!.checksum).toMatch(/^[a-f0-9]{64}$/);

    // Verify systemPrompt contains the decrypted capability-deep-sweep text at the top
    expect(capturedSystemPrompt).toContain("extract an exhaustive list of capabilities");
    expect(capturedSystemPrompt).toContain("CONDYN CAREER ANALYSIS PROTOCOL v1.0 - SYSTEM INSTRUCTIONS");
  });

  it("should fall back to static prompt and leave promptMetadata undefined when no resolver is provided", async () => {
    let capturedSystemPrompt = "";
    const provider = new MockInferenceProvider();
    const originalExecute = provider.execute.bind(provider);
    provider.execute = async (prompt) => {
      capturedSystemPrompt = prompt.systemPrompt;
      return originalExecute(prompt);
    };

    const result = await executeCareerAnalysisPipeline(
      [{ title: "Test Resume", content: "Senior Cloud Architect with 10 years experience." }],
      provider
    );

    expect(result.success).toBe(true);
    expect(result.metrics.promptMetadata).toBeUndefined();
    expect(capturedSystemPrompt).not.toContain("extract an exhaustive list of capabilities");
    expect(capturedSystemPrompt).toContain("CONDYN CAREER ANALYSIS PROTOCOL v1.0 - SYSTEM INSTRUCTIONS");
  });

  it("should strictly reject DRAFT or APPROVED prompt versions when resolved by pipeline", async () => {
    const repo = new InMemoryPromptRepository();
    await seedPromptSystem(repo, TEST_KEY);

    // Demote capability-deep-sweep version to DRAFT
    const template = await repo.getTemplateBySlug("capability-deep-sweep");
    const activeVer = await repo.getActiveVersionForTemplate(template!.id);
    activeVer!.status = "DRAFT";
    await repo.saveVersion(activeVer!);

    const resolver = new ActivePromptResolver(repo, TEST_KEY);
    const provider = new MockInferenceProvider();

    await expect(
      executeCareerAnalysisPipeline(
        [{ title: "Test Resume", content: "Senior Cloud Architect" }],
        provider,
        { promptResolver: resolver }
      )
    ).rejects.toThrow(/ERR_NO_ACTIVE_PROMPT_VERSION/);
  });
});
