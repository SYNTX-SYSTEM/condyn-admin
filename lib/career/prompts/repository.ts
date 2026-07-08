import {
  PromptTemplate,
  PromptTemplateSchema,
  PromptVersion,
  PromptVersionSchema
} from "./schema";

/**
 * Persistence contract for encrypted prompt templates and versions.
 * GUARANTEE: Never stores plaintext prompt content.
 */
export interface PromptRepository {
  saveTemplate(template: PromptTemplate): Promise<void>;
  getTemplateBySlug(slug: string): Promise<PromptTemplate | null>;
  getTemplateById(id: string): Promise<PromptTemplate | null>;
  saveVersion(version: PromptVersion): Promise<void>;
  getVersionById(id: string): Promise<PromptVersion | null>;
  getActiveVersionForTemplate(templateId: string): Promise<PromptVersion | null>;
  listVersionsForTemplate(templateId: string): Promise<PromptVersion[]>;
}

/**
 * InMemory implementation for TDD and decoupled testing.
 */
export class InMemoryPromptRepository implements PromptRepository {
  private templatesById = new Map<string, PromptTemplate>();
  private templatesBySlug = new Map<string, string>(); // slug -> id
  private versionsById = new Map<string, PromptVersion>();
  private versionsByTemplateId = new Map<string, Set<string>>(); // templateId -> set of versionIds

  async saveTemplate(template: PromptTemplate): Promise<void> {
    const validated = PromptTemplateSchema.parse(template);
    const cloned = JSON.parse(JSON.stringify(validated)) as PromptTemplate;

    this.templatesById.set(cloned.id, cloned);
    this.templatesBySlug.set(cloned.slug, cloned.id);
  }

  async getTemplateBySlug(slug: string): Promise<PromptTemplate | null> {
    const id = this.templatesBySlug.get(slug);
    if (!id) return null;
    const item = this.templatesById.get(id);
    if (!item) return null;
    return JSON.parse(JSON.stringify(item)) as PromptTemplate;
  }

  async getTemplateById(id: string): Promise<PromptTemplate | null> {
    const item = this.templatesById.get(id);
    if (!item) return null;
    return JSON.parse(JSON.stringify(item)) as PromptTemplate;
  }

  async saveVersion(version: PromptVersion): Promise<void> {
    const validated = PromptVersionSchema.parse(version);
    const cloned = JSON.parse(JSON.stringify(validated)) as PromptVersion;

    this.versionsById.set(cloned.id, cloned);

    if (!this.versionsByTemplateId.has(cloned.prompt_template_id)) {
      this.versionsByTemplateId.set(cloned.prompt_template_id, new Set());
    }
    this.versionsByTemplateId.get(cloned.prompt_template_id)!.add(cloned.id);

    // If version is ACTIVE, sync template current_active_version_id
    if (cloned.status === "ACTIVE") {
      const template = this.templatesById.get(cloned.prompt_template_id);
      if (template) {
        template.current_active_version_id = cloned.id;
        template.updated_at = new Date().toISOString();
      }
    }
  }

  async getVersionById(id: string): Promise<PromptVersion | null> {
    const item = this.versionsById.get(id);
    if (!item) return null;
    return JSON.parse(JSON.stringify(item)) as PromptVersion;
  }

  async getActiveVersionForTemplate(templateId: string): Promise<PromptVersion | null> {
    const template = this.templatesById.get(templateId);
    if (template?.current_active_version_id) {
      const version = this.versionsById.get(template.current_active_version_id);
      if (version && version.status === "ACTIVE") {
        return JSON.parse(JSON.stringify(version)) as PromptVersion;
      }
    }

    // Fallback: search versions for template with status ACTIVE
    const versionIds = this.versionsByTemplateId.get(templateId);
    if (!versionIds) return null;

    let activeVer: PromptVersion | null = null;
    for (const vId of versionIds) {
      const v = this.versionsById.get(vId);
      if (v && v.status === "ACTIVE") {
        if (!activeVer || v.version > activeVer.version) {
          activeVer = v;
        }
      }
    }

    return activeVer ? (JSON.parse(JSON.stringify(activeVer)) as PromptVersion) : null;
  }

  async listVersionsForTemplate(templateId: string): Promise<PromptVersion[]> {
    const versionIds = this.versionsByTemplateId.get(templateId);
    if (!versionIds) return [];

    const results: PromptVersion[] = [];
    for (const vId of versionIds) {
      const v = this.versionsById.get(vId);
      if (v) {
        results.push(JSON.parse(JSON.stringify(v)) as PromptVersion);
      }
    }
    return results.sort((a, b) => b.version - a.version);
  }
}
