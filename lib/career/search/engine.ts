import { CompanyPoolData } from "../matching/pool";
import { EmbeddingProvider } from "../embeddings/types";
import {
  SemanticSearchOptions,
  SemanticSearchResultItem
} from "./types";
import { SemanticSearchStore } from "./store";

export interface CompanyPoolIndexStats {
  organizationsIndexed: number;
  rolesIndexed: number;
  totalIndexed: number;
}

/**
 * Indexes all organizations and roles from a Company Pool into the semantic vector store.
 * SOVEREIGNTY GUARANTEES:
 * 1. Read-only consumer of `pool`. Never mutates input company pool data.
 * 2. Generates semantic embeddings for rich text representations of organizations and roles.
 */
export async function indexCompanyPoolEntities(
  pool: CompanyPoolData,
  store: SemanticSearchStore,
  provider: EmbeddingProvider
): Promise<CompanyPoolIndexStats> {
  let organizationsIndexed = 0;
  let rolesIndexed = 0;

  for (const org of pool.organizations || []) {
    const textRepresentation = `${org.name} ${org.industry} ${org.description || ""}`.trim();
    const vector = await provider.generateEmbedding(textRepresentation);

    await store.upsert({
      entityId: org.id,
      entityType: "ORGANIZATION",
      text: textRepresentation,
      vector,
      metadata: {
        name: org.name,
        industry: org.industry,
        description: org.description
      }
    });
    organizationsIndexed++;
  }

  for (const role of pool.roles || []) {
    const org = pool.organizations?.find((o) => o.id === role.organization_id);
    const orgName = org ? org.name : "";
    const textRepresentation = `${role.title} ${role.seniority} ${orgName} ${role.description || ""}`.trim();
    const vector = await provider.generateEmbedding(textRepresentation);

    await store.upsert({
      entityId: role.id,
      entityType: "ROLE",
      text: textRepresentation,
      vector,
      metadata: {
        title: role.title,
        seniority: role.seniority,
        organizationId: role.organization_id,
        organizationName: orgName,
        description: role.description
      }
    });
    rolesIndexed++;
  }

  return {
    organizationsIndexed,
    rolesIndexed,
    totalIndexed: organizationsIndexed + rolesIndexed
  };
}

/**
 * Executes a semantic similarity query against the vector store.
 * Converts unstructured user or profile text into an embedding and retrieves top matching entities.
 */
export async function searchSemanticEntities(
  query: string,
  store: SemanticSearchStore,
  provider: EmbeddingProvider,
  options?: SemanticSearchOptions
): Promise<SemanticSearchResultItem[]> {
  const queryText = (query || "").trim();
  if (!queryText) {
    return [];
  }

  const queryVector = await provider.generateEmbedding(queryText);
  return store.search(queryVector, options);
}
