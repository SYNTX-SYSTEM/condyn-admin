import { describe, expect, it } from "vitest";
import * as capabilityCore from "../../../../lib/career/capability-core";
import { ActivePromptResolver } from "../../../../lib/career/prompts/resolver";
import { InMemoryPromptRepository } from "../../../../lib/career/prompts/repository";
import { seedPromptSystem } from "../../../../lib/career/prompts/system";
import { createSourceDocument } from "../../../../lib/career/capability-core";

const encryptionKeyBase64 = Buffer.alloc(32, 41).toString("base64");
const discoverySlug = "capability-discovery-v1";
const convergenceSlug = "capability-convergence-v1";

type CapabilityProposalKernelBootstrap = (dependencies: {
  promptRepository: InMemoryPromptRepository;
  encryptionKeyBase64: string;
}) => Promise<void>;

function getKernelBootstrap(): CapabilityProposalKernelBootstrap {
  const bootstrap = (
    capabilityCore as unknown as {
      bootstrapCapabilityProposalKernels?: CapabilityProposalKernelBootstrap;
    }
  ).bootstrapCapabilityProposalKernels;

  expect(bootstrap).toBeTypeOf("function");
  if (typeof bootstrap !== "function") {
    throw new Error("F10A Capability Proposal kernel bootstrap is not available.");
  }

  return bootstrap;
}

describe("F10A Capability Proposal Runtime kernel bootstrap", () => {
  it("seeds dedicated active Discovery and Convergence kernels without changing the legacy deep-sweep prompt", async () => {
    const promptRepository = new InMemoryPromptRepository();
    await seedPromptSystem(promptRepository, encryptionKeyBase64);
    const legacyTemplateBefore = await promptRepository.getTemplateBySlug("capability-deep-sweep");
    const legacyVersionBefore = await promptRepository.getActiveVersionForTemplate(
      legacyTemplateBefore!.id
    );

    await getKernelBootstrap()({ promptRepository, encryptionKeyBase64 });

    const resolver = new ActivePromptResolver(promptRepository, encryptionKeyBase64);
    const discovery = await resolver.resolveActivePrompt(discoverySlug);
    const convergence = await resolver.resolveActivePrompt(convergenceSlug);
    const discoveryVersion = await promptRepository.getVersionById(discovery.versionId);
    const convergenceVersion = await promptRepository.getVersionById(convergence.versionId);

    expect(discovery.status).toBe("ACTIVE");
    expect(convergence.status).toBe("ACTIVE");
    expect(discovery.plainTextContent).toContain("demonstrated_capability_level");
    expect(discovery.plainTextContent).not.toContain("proposed_demonstrated_level");
    expect(discovery.plainTextContent).not.toBe(convergence.plainTextContent);
    expect(discoveryVersion!.encrypted_content).not.toContain(discovery.plainTextContent);
    expect(convergenceVersion!.encrypted_content).not.toContain(convergence.plainTextContent);
    expect(discovery.plainTextContent).not.toMatch(
      /PHASE4_VERIFIED|VERIFIED_CAPABILITY|publication authority|human decision authority/i
    );
    expect(convergence.plainTextContent).not.toMatch(
      /PHASE4_VERIFIED|VERIFIED_CAPABILITY|publication authority|human decision authority/i
    );
    expect(await promptRepository.getTemplateBySlug("capability-deep-sweep")).toEqual(
      legacyTemplateBefore
    );
    expect(
      await promptRepository.getActiveVersionForTemplate(legacyTemplateBefore!.id)
    ).toEqual(legacyVersionBefore);
  });

  it("uses the existing resolver checksum and encryption-key contracts", async () => {
    const promptRepository = new InMemoryPromptRepository();
    await getKernelBootstrap()({ promptRepository, encryptionKeyBase64 });

    const resolver = new ActivePromptResolver(promptRepository, encryptionKeyBase64);
    await expect(resolver.resolveActivePrompt(discoverySlug)).resolves.toMatchObject({
      slug: discoverySlug,
      status: "ACTIVE"
    });
    await expect(
      new ActivePromptResolver(promptRepository).resolveActivePrompt(discoverySlug, "")
    ).rejects.toThrow("ERR_MISSING_ENCRYPTION_KEY");
    await expect(
      new ActivePromptResolver(
        promptRepository,
        Buffer.alloc(32, 99).toString("base64")
      ).resolveActivePrompt(convergenceSlug)
    ).rejects.toThrow();
  });

  it("carries concrete managed resolver identities into both provider-visible prompts", async () => {
    const promptRepository = new InMemoryPromptRepository();
    await getKernelBootstrap()({ promptRepository, encryptionKeyBase64 });

    const activePromptResolver = new ActivePromptResolver(
      promptRepository,
      encryptionKeyBase64
    );
    const discoveryKernel = await new capabilityCore.ActivePromptCapabilityKernelResolver(
      activePromptResolver,
      discoverySlug,
      "discovery-v1",
      encryptionKeyBase64
    ).resolve();
    const convergenceKernel = await new capabilityCore.ActivePromptCapabilityConvergenceResolver(
      activePromptResolver,
      "convergence-v1",
      convergenceSlug,
      encryptionKeyBase64
    ).resolve();

    const discoveryPrompt = capabilityCore.buildCapabilityDiscoveryPrompt(
      [
        createSourceDocument({
          docId: "DOC_IDENTITY",
          title: "Identity",
          rawContent: "Literal source."
        })
      ],
      discoveryKernel
    );
    const convergencePrompt = capabilityCore.buildCapabilityConvergencePrompt(
      [],
      convergenceKernel
    );

    expect(discoveryKernel.kernelVersion).toBe("discovery-v1");
    expect(convergenceKernel.kernelVersion).toBe("convergence-v1");
    expect(discoveryPrompt.systemPrompt).toContain(
      '"kernel_version" MUST equal exactly "discovery-v1".'
    );
    expect(convergencePrompt.systemPrompt).toContain(
      '"convergence_version" MUST equal exactly "convergence-v1".'
    );
  });
});
