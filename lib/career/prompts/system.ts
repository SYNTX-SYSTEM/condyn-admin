import { encryptPromptContent } from "./crypto";
import { PromptRepository } from "./repository";
import { PromptTemplate, PromptVersion } from "./schema";

export const DEEP_SWEEP_PROMPT_SLUGS = [
  "capability-deep-sweep",
  "organization-deep-sweep",
  "role-deep-sweep",
  "opportunity-deep-sweep",
  "strategy-deep-sweep",
  "search-query-generation",
  "recommendation-generation"
] as const;

export type DeepSweepPromptSlug = typeof DEEP_SWEEP_PROMPT_SLUGS[number];

export interface DeepSweepPromptDefinition {
  slug: DeepSweepPromptSlug;
  title: string;
  domain: string;
  description: string;
  content: string;
}

/**
 * Canonical 7-Stage Capability Deep Sweep Prompt System for CONDYN Protocol v1.0.
 * Dictates extraction quality across the entire semantic career analysis platform.
 */
export const CANONICAL_DEEP_SWEEP_PROMPTS: DeepSweepPromptDefinition[] = [
  {
    slug: "capability-deep-sweep",
    title: "Capability Deep Sweep Extraction Prompt",
    domain: "career_analysis",
    description: "Exhaustive extraction of technical capabilities, domain proficiency, confidence, and concrete evidence pointers.",
    content: `You are an expert systems & career ontology extractor for the CONDYN Career Analysis Protocol v1.0.
Analyze the provided career documents and extract an exhaustive list of capabilities.
For each capability, reconstruct:
- Canonical capability name
- Primary domain classification
- Proficiency level (L1 to L6)
- Confidence score strictly normalized to [0.0, 1.0]
- Direct evidence text citation from source document.`
  },
  {
    slug: "organization-deep-sweep",
    title: "Organization Deep Sweep Extraction Prompt",
    domain: "career_analysis",
    description: "Reconstruction of organizational scale, industry classification, enterprise hierarchy, and affiliations.",
    content: `Analyze the provided career documents and reconstruct all organizational affiliations.
For each organization identify:
- Canonical organization name
- Industry focus & market sector
- Scale & operational footprint
- Institutional role & strategic relationship.`
  },
  {
    slug: "role-deep-sweep",
    title: "Role Deep Sweep Extraction Prompt",
    domain: "career_analysis",
    description: "Extraction of explicit and implicit career roles, seniority levels, tenure, and structural impact.",
    content: `Analyze the provided career documents and reconstruct all professional roles and appointments.
For each role identify:
- Formal job title & seniority level
- Associated organization ID
- Domain focus & architectural scope
- Primary impact & system deliverables.`
  },
  {
    slug: "opportunity-deep-sweep",
    title: "Opportunity Deep Sweep Analysis Prompt",
    domain: "career_analysis",
    description: "Identification of latent growth vectors, adjacent technical domains, and career expansion opportunities.",
    content: `Analyze the canonical career graph and identify latent technical & leadership opportunities.
Synthesize actionable career opportunities based on capability adjacency and high-resonance industrial domains.`
  },
  {
    slug: "strategy-deep-sweep",
    title: "Strategy Deep Sweep Positioning Prompt",
    domain: "career_analysis",
    description: "Formulation of long-term career positioning and strategic capability investment priorities.",
    content: `Formulate a coherent career strategy based on current capability density and organizational trajectory.
Highlight high-leverage capabilities requiring consolidation or expansion.`
  },
  {
    slug: "search-query-generation",
    title: "Search Query Generation Prompt",
    domain: "career_analysis",
    description: "Synthesis of high-intent search queries targeting specific industry pool roles and organizations.",
    content: `Generate targeted search queries designed to match the candidate against controlled industrial company pools.
Output queries ranked by resonance priority.`
  },
  {
    slug: "recommendation-generation",
    title: "Recommendation Generation Prompt",
    domain: "career_analysis",
    description: "Synthesis of explainable career recommendations based on capability gaps and pool requirements.",
    content: `Analyze missing capabilities from company pool role matching and generate concrete action recommendations.
Explain why each recommendation increases candidate resonance.`
  }
];

/**
 * Seeds the 7 canonical Capability Deep Sweep prompts into the target PromptRepository.
 * GUARANTEE:
 * 1. Never saves plaintext prompt content.
 * 2. All versions are encrypted using AES-256-GCM.
 * 3. All versions are marked ACTIVE and verified by SHA-256 checksum.
 */
export async function seedPromptSystem(
  repository: PromptRepository,
  explicitKeyBase64?: string
): Promise<void> {
  const timestamp = new Date().toISOString();

  for (const def of CANONICAL_DEEP_SWEEP_PROMPTS) {
    const templateId = `tpl_${def.slug}`;
    const versionId = `ver_${def.slug}_v1`;

    const template: PromptTemplate = {
      id: templateId,
      slug: def.slug,
      name: def.title,
      domain: def.domain,
      current_active_version_id: versionId,
      created_at: timestamp,
      updated_at: timestamp
    };

    await repository.saveTemplate(template);

    const encryptedResult = encryptPromptContent(def.content, explicitKeyBase64);

    const version: PromptVersion = {
      id: versionId,
      prompt_template_id: templateId,
      version: 1,
      status: "ACTIVE",
      encrypted_content: encryptedResult.encryptedContent,
      content_checksum: encryptedResult.checksum,
      created_by: "condyn_system_seeder",
      created_at: timestamp
    };

    await repository.saveVersion(version);
  }
}
