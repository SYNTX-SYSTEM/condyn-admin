import { encryptPromptContent } from "../../prompts/crypto";
import type { PromptRepository } from "../../prompts/repository";
import type { PromptTemplate, PromptVersion } from "../../prompts/schema";

const CAPABILITY_PROPOSAL_KERNELS = [
  {
    slug: "capability-discovery-v1",
    name: "Capability Discovery Proposal Kernel v1",
    content: `You produce capability proposals from the supplied SourceDocuments.
MODEL OUTPUT = PROPOSAL, not verified capability truth.
Return output compatible with CapabilityKernelOutputSchema: kernel_version, an exhaustive capability inventory, ATOMIC or COMPOSITE scope, canonical_name, structural_definition, primary_domain, demonstrated_capability_level where supported, model_confidence where supported, evidence_mode, evidence claims with source document references, declared locations, exact quotes, and coverage_audit.
Evidence claims must originate only in the supplied SourceDocuments. Do not assert semantic truth, authority, publication, or human decision outcomes.`,
    domain: "capability_proposal"
  },
  {
    slug: "capability-convergence-v1",
    name: "Capability Convergence Proposal Kernel v1",
    content: `You reconcile evidence-passed capability candidates into semantic proposals.
CONVERGENCE = SEMANTIC PROPOSAL, not verified capability truth.
Return output compatible with CapabilityConvergenceOutputSchema: groups with exact candidate membership, canonical capability naming, ATOMIC or COMPOSITE scope, structural definition, primary domain, proposed cross-capability relations, and reconciliation audit.
Do not claim final relation verification, authority, publication, or human decision outcomes.`,
    domain: "capability_proposal"
  }
] as const;

export interface CapabilityProposalKernelBootstrapDependencies {
  promptRepository: PromptRepository;
  encryptionKeyBase64: string;
}

/**
 * Seeds the two F10A managed proposal kernels as encrypted ACTIVE prompt versions.
 * Plaintext is supplied only to encryption and is never retained in Capability Core artifacts.
 */
export async function bootstrapCapabilityProposalKernels(
  dependencies: CapabilityProposalKernelBootstrapDependencies
): Promise<void> {
  const timestamp = new Date().toISOString();

  for (const kernel of CAPABILITY_PROPOSAL_KERNELS) {
    const templateId = `tpl_${kernel.slug}`;
    const versionId = `ver_${kernel.slug}_v1`;
    const encrypted = encryptPromptContent(kernel.content, dependencies.encryptionKeyBase64);
    const template: PromptTemplate = {
      id: templateId,
      slug: kernel.slug,
      name: kernel.name,
      domain: kernel.domain,
      current_active_version_id: versionId,
      created_at: timestamp,
      updated_at: timestamp
    };
    const version: PromptVersion = {
      id: versionId,
      prompt_template_id: templateId,
      version: 1,
      encrypted_content: encrypted.encryptedContent,
      content_checksum: encrypted.checksum,
      status: "ACTIVE",
      created_by: "condyn_capability_proposal_bootstrap",
      created_at: timestamp
    };

    await dependencies.promptRepository.saveTemplate(template);
    await dependencies.promptRepository.saveVersion(version);
  }
}
