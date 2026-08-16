/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * CANONICAL ZOD SCHEMA & TYPESCRIPT CONTRACTS (`lib/career/schema.ts`)
 * 
 * Status: ARCHITECTURE FREEZE v1.0 / KANONISCHER VERTRAG
 * Scope: Sole source of truth for runtime validation, LLM adapters, and frontend rendering.
 * Rule: Pure declarative definitions and type inference only. No business logic, no mutation, no repair logic.
 */

import { z } from "zod";

// ============================================================================
// 1. PRIMITIVE & TAXONOMY SCHEMAS
// ============================================================================

/**
 * Immutable canonical ID prefix binding.
 * Enforces stable type prefixes: DOC_, CLU_, CAP_, DOM_, CLS_, ORG_, ROL_, OPP_, STR_, QRY_
 */
export const CanonicalIdSchema = z.string().regex(
  /^(ANL|DOC|CLU|CAP|REQ|DOM|CLS|ORG|ROL|OPP|STR|QRY)_[A-Z0-9_]+$/,
  "ID must conform to canonical prefixes (ANL_, DOC_, CLU_, CAP_, REQ_, DOM_, CLS_, ORG_, ROL_, OPP_, STR_, QRY_)"
);

/**
 * Numeric scores strictly bounded in closed interval [0.0, 1.0].
 * Integer percentages (e.g. 94 instead of 0.94) are rejected.
 */
export const NormalizedScoreSchema = z.number().min(0.0, "Score must be >= 0.0").max(1.0, "Score must be <= 1.0");

/**
 * 2-letter ISO-3166-1 alpha-2 uppercase country code (e.g., "DE", "US", "CH").
 */
export const IsoCountryCodeSchema = z.string().regex(
  /^[A-Z]{2}$/,
  "Must be a valid 2-letter ISO-3166-1 alpha-2 uppercase country code"
);

/**
 * Canonical relation types for Directed Acyclic Graphs (DAGs) and ecosystem topology.
 */
export const RelationTypeEnum = z.enum([
  "SUPPORTS",
  "REQUIRES",
  "RESONATES_WITH",
  "CONFLICTS_WITH",
  "DERIVED_FROM",
  "BELONGS_TO_CLASS",
  "ROLE_IN_ORGANIZATION"
]);

/**
 * Deterministic validator stamping states.
 */
export const ValidationStatusEnum = z.enum([
  "UNVERIFIED",
  "PASSED",
  "REJECTED"
]);

// ============================================================================
// 2. UNIVERSAL ENTITY GRAMMAR (7 CARDINAL PROPERTIES)
// ============================================================================

export const IdentitySchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1),
  code: z.string().optional()
});

export const RelationshipSchema = z.object({
  target_id: CanonicalIdSchema,
  relation_type: RelationTypeEnum,
  weight: NormalizedScoreSchema
});

export const EvidenceItemSchema = z.object({
  doc_id: CanonicalIdSchema,
  location: z.string().min(1),
  context_quote: z.string().min(10, "Context quote must contain verbatim evidence (> 10 chars)"),
  evidence_score: NormalizedScoreSchema,
  significance_explanation: z.string().optional()
});

export const ValidationSchema = z.object({
  status: ValidationStatusEnum,
  timestamp: z.string().optional(),
  reason: z.string().optional()
});

/**
 * Universal Entity Schema enforcing all 7 cardinal properties.
 */
export const UniversalEntitySchema = z.object({
  entity_id: CanonicalIdSchema,
  identity: IdentitySchema,
  properties: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
  relationships: z.array(RelationshipSchema),
  evidence: z.array(EvidenceItemSchema),
  confidence: NormalizedScoreSchema,
  validation: ValidationSchema
});

// ============================================================================
// 3. SPECIALIZED DOMAIN ENTITY SCHEMAS
// ============================================================================

export const OrganizationPropertiesSchema = z.object({
  country_iso: IsoCountryCodeSchema,
  region_code: z.string().optional(),
  industry_enum: z.string().min(1),
  scale_tier: z.string().optional(),
  workplace_model: z.string().optional(),
  recruiter_pool_id: z.string().optional(),
  resonance_score: NormalizedScoreSchema
}).catchall(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]));

export const OrganizationEntitySchema = UniversalEntitySchema.extend({
  properties: OrganizationPropertiesSchema
});

export const RolePropertiesSchema = z.object({
  seniority: z.string().min(1),
  domain_focus: z.string().min(1)
}).catchall(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]));

export const RoleEntitySchema = UniversalEntitySchema.extend({
  properties: RolePropertiesSchema
});

export const SearchQueryPropertiesSchema = z.object({
  title: z.string().min(1),
  query: z.string().min(1),
  purpose: z.string().min(1),
  target: z.string().min(1),
  priority: z.string().min(1)
}).catchall(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]));

export const SearchQueryEntitySchema = UniversalEntitySchema.extend({
  properties: SearchQueryPropertiesSchema
});

// ============================================================================
// 4. ANALYSIS BRANCH SCHEMAS (3 OBJECTS, 9 ARRAYS)
// ============================================================================

export const MetadataSchema = z.object({
  analysis_id: CanonicalIdSchema,
  protocol_version: z.string().min(1),
  schema_version: z.string().min(1),
  prompt_contract_version: z.string().min(1),
  analysis_timestamp: z.string().optional(),
  execution_duration_ms: z.number().int().nonnegative().optional(),
  document_count: z.number().int().nonnegative().optional(),
  total_word_count: z.number().int().nonnegative().optional(),
  dominant_cluster_name: z.string().optional(),
  overall_confidence: NormalizedScoreSchema.optional(),
  validation_state: z.string().optional()
});

export const PipelineStepSchema = z.object({
  step_id: z.string().min(1),
  name: z.string().min(1),
  started_at: z.string().optional(),
  finished_at: z.string().optional(),
  duration_ms: z.number().int().nonnegative().optional(),
  status: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED"]),
  warnings: z.array(z.string()).default([]),
  errors: z.array(z.string()).default([])
});

export const PipelineSchema = z.object({
  steps: z.array(PipelineStepSchema)
});

export const ConsistencyClusterSchema = z.object({
  cluster_id: CanonicalIdSchema,
  name: z.string().min(1),
  cohesion_score: NormalizedScoreSchema,
  doc_ids: z.array(CanonicalIdSchema)
});

export const ConsistencySchema = z.object({
  overall_cohesion_score: NormalizedScoreSchema,
  summary: z.string().optional(),
  clusters: z.array(ConsistencyClusterSchema).default([]),
  outlier_doc_ids: z.array(CanonicalIdSchema).default([]),
  contradictions: z.array(z.string()).default([])
});

/**
 * The canonical 12 top-level sections in `analysis`: 3 Objects + 9 Arrays.
 */
export const AnalysisSchema = z.object({
  // 3 Top-Level Objects
  metadata: MetadataSchema,
  pipeline: PipelineSchema,
  consistency: ConsistencySchema,

  // 10 Top-Level Domain Arrays
  documents: z.array(UniversalEntitySchema).default([]),
  capabilities: z.array(UniversalEntitySchema).default([]),
  requirements: z.array(UniversalEntitySchema).default([]),
  domains: z.array(UniversalEntitySchema).default([]),
  organization_classes: z.array(UniversalEntitySchema).default([]),
  organizations: z.array(OrganizationEntitySchema).default([]),
  roles: z.array(RoleEntitySchema).default([]),
  opportunities: z.array(UniversalEntitySchema).default([]),
  strategies: z.array(UniversalEntitySchema).default([]),
  search_queries: z.array(SearchQueryEntitySchema).default([])
});

// ============================================================================
// 5. PRESENTATION BRANCH SCHEMAS (READ-ONLY TOPOLOGY & UI LAYOUT)
// ============================================================================

export const SemanticGraphNodeSchema = z.object({
  node_id: CanonicalIdSchema,
  entity_type: z.string().min(1),
  weight: NormalizedScoreSchema
});

export const SemanticGraphEdgeSchema = z.object({
  source_id: CanonicalIdSchema,
  target_id: CanonicalIdSchema,
  interaction_force: NormalizedScoreSchema
});

export const SemanticGraphSchema = z.object({
  nodes: z.array(SemanticGraphNodeSchema),
  edges: z.array(SemanticGraphEdgeSchema)
});

export const ConcentricRingSchema = z.object({
  ring_index: z.number().int().min(0),
  name: z.string().min(1),
  node_ids: z.array(CanonicalIdSchema)
});

export const PriorityGroupSchema = z.object({
  group_id: z.string().min(1),
  label: z.string().min(1),
  node_ids: z.array(CanonicalIdSchema)
});

export const DefaultViewsSchema = z.object({
  primary_view: z.string().min(1),
  available_views: z.array(z.string())
});

export const UiLayoutSchema = z.object({
  center_node_id: CanonicalIdSchema,
  concentric_rings: z.array(ConcentricRingSchema),
  color_tokens: z.record(z.string(), z.string()),
  priority_groups: z.array(PriorityGroupSchema).optional(),
  default_views: DefaultViewsSchema.optional()
});

export const PresentationSchema = z.object({
  semantic_graph: SemanticGraphSchema,
  ui_layout: UiLayoutSchema
});

// ============================================================================
// 6. ROOT BIFURCATION & CANONICAL OUTPUT CONTRACT
// ============================================================================

export const StructuredDataSchema = z.object({
  analysis: AnalysisSchema,
  presentation: PresentationSchema
});

export const CanonicalCareerAnalysisSchema = z.object({
  $schema: z.string().optional(),
  report_markdown: z.string().min(1, "Markdown report must not be empty"),
  structured_data: StructuredDataSchema
});

// ============================================================================
// 7. TYPE EXPORTS (INFERRED FROM ZOD)
// ============================================================================

export type CanonicalId = z.infer<typeof CanonicalIdSchema>;
export type NormalizedScore = z.infer<typeof NormalizedScoreSchema>;
export type IsoCountryCode = z.infer<typeof IsoCountryCodeSchema>;
export type RelationType = z.infer<typeof RelationTypeEnum>;
export type ValidationStatus = z.infer<typeof ValidationStatusEnum>;

export type Identity = z.infer<typeof IdentitySchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;
export type Validation = z.infer<typeof ValidationSchema>;
export type UniversalEntity = z.infer<typeof UniversalEntitySchema>;

export type OrganizationProperties = z.infer<typeof OrganizationPropertiesSchema>;
export type OrganizationEntity = z.infer<typeof OrganizationEntitySchema>;
export type RoleProperties = z.infer<typeof RolePropertiesSchema>;
export type RoleEntity = z.infer<typeof RoleEntitySchema>;
export type SearchQueryProperties = z.infer<typeof SearchQueryPropertiesSchema>;
export type SearchQueryEntity = z.infer<typeof SearchQueryEntitySchema>;

export type Metadata = z.infer<typeof MetadataSchema>;
export type PipelineStep = z.infer<typeof PipelineStepSchema>;
export type Pipeline = z.infer<typeof PipelineSchema>;
export type ConsistencyCluster = z.infer<typeof ConsistencyClusterSchema>;
export type Consistency = z.infer<typeof ConsistencySchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;

export type SemanticGraphNode = z.infer<typeof SemanticGraphNodeSchema>;
export type SemanticGraphEdge = z.infer<typeof SemanticGraphEdgeSchema>;
export type SemanticGraph = z.infer<typeof SemanticGraphSchema>;
export type ConcentricRing = z.infer<typeof ConcentricRingSchema>;
export type PriorityGroup = z.infer<typeof PriorityGroupSchema>;
export type DefaultViews = z.infer<typeof DefaultViewsSchema>;
export type UiLayout = z.infer<typeof UiLayoutSchema>;
export type Presentation = z.infer<typeof PresentationSchema>;

export type StructuredData = z.infer<typeof StructuredDataSchema>;
export type CanonicalCareerAnalysis = z.infer<typeof CanonicalCareerAnalysisSchema>;
