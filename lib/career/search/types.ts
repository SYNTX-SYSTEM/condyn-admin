export type SemanticEntityType =
  | "CAPABILITY"
  | "ROLE"
  | "ORGANIZATION"
  | "STRATEGY";

export interface SemanticEntityRecord {
  entityId: string;
  entityType: SemanticEntityType | string;
  text: string;
  vector: number[];
  metadata?: Record<string, any>;
}

export interface SemanticSearchResultItem {
  entityId: string;
  entityType: SemanticEntityType | string;
  text: string;
  similarityScore: number;
  metadata?: Record<string, any>;
}

export interface SemanticSearchOptions {
  topK?: number;
  minSimilarity?: number;
  entityType?: SemanticEntityType | string;
}
