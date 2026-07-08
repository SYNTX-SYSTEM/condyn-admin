import { PromptRepository } from "./repository";
import { decryptPromptContent, computePromptChecksum } from "./crypto";

export interface ResolvedActivePrompt {
  templateId: string;
  slug: string;
  versionId: string;
  versionNumber: number;
  status: "ACTIVE";
  plainTextContent: string;
  checksum: string;
}

/**
 * Runtime resolver for managed prompt templates.
 * SOVEREIGNTY GUARANTEES:
 * 1. Only ACTIVE prompt versions are ever resolved. DRAFT/APPROVED versions are strictly rejected.
 * 2. SHA-256 checksum verification is executed immediately after decryption.
 *    Any mismatch throws ERR_PROMPT_CHECKSUM_MISMATCH.
 */
export class ActivePromptResolver {
  constructor(
    private readonly repository: PromptRepository,
    private readonly defaultKeyBase64?: string
  ) {}

  async resolveActivePrompt(
    slug: string,
    explicitKeyBase64?: string
  ): Promise<ResolvedActivePrompt> {
    const keyToUse = explicitKeyBase64 ?? this.defaultKeyBase64;
    const template = await this.repository.getTemplateBySlug(slug);
    if (!template) {
      throw new Error(`ERR_PROMPT_TEMPLATE_NOT_FOUND: No prompt template found for slug "${slug}".`);
    }

    const activeVersion = await this.repository.getActiveVersionForTemplate(template.id);
    if (!activeVersion || activeVersion.status !== "ACTIVE") {
      throw new Error(
        `ERR_NO_ACTIVE_PROMPT_VERSION: No ACTIVE prompt version found for template "${slug}". DRAFT or APPROVED versions are strictly rejected by runtime.`
      );
    }

    const decryptedContent = decryptPromptContent(
      activeVersion.encrypted_content,
      keyToUse
    );

    const computedChecksum = computePromptChecksum(decryptedContent);
    if (computedChecksum !== activeVersion.content_checksum) {
      throw new Error(
        `ERR_PROMPT_CHECKSUM_MISMATCH: Decrypted prompt content checksum (${computedChecksum}) does not match stored content_checksum (${activeVersion.content_checksum}). Integrity check failed.`
      );
    }

    return {
      templateId: template.id,
      slug: template.slug,
      versionId: activeVersion.id,
      versionNumber: activeVersion.version,
      status: "ACTIVE",
      plainTextContent: decryptedContent,
      checksum: computedChecksum
    };
  }
}
