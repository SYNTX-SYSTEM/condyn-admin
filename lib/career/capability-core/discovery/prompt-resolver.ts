import { ActivePromptResolver } from "../../prompts/resolver";
import type { CapabilityKernelResolver, ResolvedCapabilityKernel } from "./types";
export class ActivePromptCapabilityKernelResolver implements CapabilityKernelResolver {
  constructor(private readonly activePromptResolver: ActivePromptResolver, private readonly promptSlug: string, private readonly kernelVersion: string, private readonly explicitKeyBase64?: string) {}
  async resolve(): Promise<ResolvedCapabilityKernel> {
    const prompt = await this.activePromptResolver.resolveActivePrompt(this.promptSlug, this.explicitKeyBase64);
    return { kernelVersion: this.kernelVersion, templateId: prompt.templateId, versionId: prompt.versionId, checksum: prompt.checksum, plainTextContent: prompt.plainTextContent };
  }
}
