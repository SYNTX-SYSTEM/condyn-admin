import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import { 
  CanonicalCareerAnalysisSchema,
  UniversalEntitySchema,
  OrganizationEntitySchema,
  RoleEntitySchema,
  SearchQueryEntitySchema,
  NormalizedScoreSchema,
  RelationTypeEnum,
  IsoCountryCodeSchema
} from "./schema";

const UniversalInferencePropertiesSchema = z.object({
  // ORGANIZATION
  country_iso: IsoCountryCodeSchema.optional(),
  industry_enum: z.string().optional(),
  resonance_score: NormalizedScoreSchema.optional(),

  // ROLE
  seniority: z.string().optional(),
  domain_focus: z.string().optional(),

  // SEARCH_QUERY
  title: z.string().optional(),
  query: z.string().optional(),
  purpose: z.string().optional(),
  target: z.string().optional(),
  priority: z.string().optional()
}).catchall(
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string())
  ])
);

const UniversalInferenceEntitySchema = z.object({
  entity_kind: z.enum([
    "CAPABILITY", "DOMAIN", "ORGANIZATION_CLASS", 
    "ORGANIZATION", "ROLE", "OPPORTUNITY", "STRATEGY", "SEARCH_QUERY"
  ]),
  entity_id: z.string().min(1),
  name: z.string().min(1, "Name must not be empty"),
  code: z.string().optional(),
  properties: UniversalInferencePropertiesSchema,
  relationships: z.array(z.object({
    target_id: z.string().min(1),
    relation_type: RelationTypeEnum,
    weight: z.number().min(0).max(1).default(1.0)
  })).default([]),
  evidence: z.array(z.object({
    doc_id: z.string().min(1),
    location: z.string().min(1),
    context_quote: z.string().min(10),
    evidence_score: NormalizedScoreSchema.default(1.0),
    significance_explanation: z.string().optional()
  })).min(1),
  confidence: NormalizedScoreSchema
});

const InferenceConsistencyClusterSchema = z.object({
  cluster_id: z.string().min(1),
  name: z.string().min(1),
  cohesion_score: NormalizedScoreSchema,
  doc_ids: z.array(z.string().min(1)),
  description: z.string().optional(),
  dominant_concept: z.string().optional()
});

export const GeminiInferenceSchema = z.object({
  report_markdown: z.string().min(1, "Markdown report must not be empty"),
  consistency: z.object({
    overall_cohesion_score: NormalizedScoreSchema,
    summary: z.string().optional(),
    clusters: z.array(InferenceConsistencyClusterSchema).default([]),
    outlier_doc_ids: z.array(z.string().min(1)).default([]),
    contradictions: z.array(z.string()).default([])
  }),
  entities: z.array(UniversalInferenceEntitySchema).default([])
});

/**
 * Recursively strips Gemini-unsupported JSON Schema keywords from the generated schema.
 * Operates strictly on schema keyword positions, leaving property names intact.
 */
function sanitizeSchema(schemaNode: any) {
  if (!schemaNode || typeof schemaNode !== "object") return;
  
  if (Array.isArray(schemaNode)) {
    schemaNode.forEach(sanitizeSchema);
    return;
  }

  // Remove strictly unsupported keywords per Gemini JSON Schema subset
  delete schemaNode["$schema"];
  delete schemaNode["minLength"];
  delete schemaNode["pattern"];
  delete schemaNode["default"];

  // Traverse deeper into schema nodes based on standard structural keywords
  if (schemaNode.properties) {
    for (const key of Object.keys(schemaNode.properties)) {
      sanitizeSchema(schemaNode.properties[key]);
    }
  }
  if (schemaNode.items) {
    sanitizeSchema(schemaNode.items);
  }
  if (schemaNode.additionalProperties && typeof schemaNode.additionalProperties === "object") {
    sanitizeSchema(schemaNode.additionalProperties);
  }
  if (schemaNode.anyOf) {
    schemaNode.anyOf.forEach(sanitizeSchema);
  }
  if (schemaNode.oneOf) {
    schemaNode.oneOf.forEach(sanitizeSchema);
  }
  if (schemaNode.$defs) {
    for (const key of Object.keys(schemaNode.$defs)) {
      sanitizeSchema(schemaNode.$defs[key]);
    }
  }
}

/**
 * Generates a Gemini-compatible JSON Schema from the inference-specific schema.
 * Targets jsonSchema2019-09 to natively emit $defs instead of definitions.
 */
export function getGeminiCareerResponseJsonSchema(allowedDocIds?: string[]) {
  const schema = zodToJsonSchema(GeminiInferenceSchema, {
    target: "jsonSchema2019-09",
    name: "GeminiCareerInference",
    definitionPath: "$defs"
  }) as any;

  // Deterministically unwrap root $ref if present
  let finalSchema = schema;
  if (finalSchema.$ref) {
    const refPath = finalSchema.$ref;
    if (refPath.startsWith("#/$defs/")) {
      const defName = refPath.replace("#/$defs/", "");
      if (finalSchema.$defs && finalSchema.$defs[defName]) {
        const unwrapped = { ...finalSchema.$defs[defName] };
        // Preserve other $defs if there are any
        unwrapped.$defs = finalSchema.$defs;
        finalSchema = unwrapped;
      }
    }
  }

  sanitizeSchema(finalSchema);

  if (allowedDocIds && allowedDocIds.length > 0) {
    function injectEnum(obj: any) {
      if (!obj || typeof obj !== "object") return;
      if (Array.isArray(obj)) {
        obj.forEach(injectEnum);
        return;
      }
      
      // Specifically target doc_id inside evidence items
      // EvidenceItems has doc_id, location, context_quote
      if (obj.properties && obj.properties.doc_id && typeof obj.properties.doc_id === "object") {
        if (obj.properties.context_quote && obj.properties.location) {
          obj.properties.doc_id.enum = allowedDocIds;
        }
      }
      
      for (const k of Object.keys(obj)) {
        injectEnum(obj[k]);
      }
    }
    injectEnum(finalSchema);
  }

  return finalSchema;
}
