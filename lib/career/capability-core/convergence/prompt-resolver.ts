import { ActivePromptResolver } from "../../prompts/resolver";
import type { CapabilityConvergenceKernelResolver, ResolvedCapabilityConvergenceKernel } from "./types";

export class ActivePromptCapabilityConvergenceResolver implements CapabilityConvergenceKernelResolver {
  constructor(private readonly activePromptResolver: ActivePromptResolver, private readonly kernelVersion: string, private readonly promptSlug: string = "capability-convergence-v1", private readonly explicitKeyBase64?: string) {}
  async resolve(): Promise<ResolvedCapabilityConvergenceKernel> { const prompt = await this.activePromptResolver.resolveActivePrompt(this.promptSlug, this.explicitKeyBase64); return { kernelVersion: this.kernelVersion, templateId: prompt.templateId, versionId: prompt.versionId, checksum: prompt.checksum, plainTextContent: prompt.plainTextContent }; }
}
