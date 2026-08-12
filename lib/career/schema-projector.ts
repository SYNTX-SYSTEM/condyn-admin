import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import { 
  CanonicalCareerAnalysisSchema,
  UniversalEntitySchema,
  OrganizationEntitySchema,
  RoleEntitySchema,
  SearchQueryEntitySchema,
  NormalizedScoreSchema,
  ConsistencyClusterSchema,
  CanonicalIdSchema
} from "./schema";

const InferenceEntitySchema = UniversalEntitySchema.omit({ validation: true });
const InferenceOrgSchema = OrganizationEntitySchema.omit({ validation: true });
const InferenceRoleSchema = RoleEntitySchema.omit({ validation: true });
const InferenceQuerySchema = SearchQueryEntitySchema.omit({ validation: true });

export const GeminiInferenceSchema = z.object({
  report_markdown: z.string().min(1, "Markdown report must not be empty"),
  structured_data: z.object({
    analysis: z.object({
      consistency: z.object({
        overall_cohesion_score: NormalizedScoreSchema,
        summary: z.string().optional(),
        clusters: z.array(ConsistencyClusterSchema).default([]),
        outlier_doc_ids: z.array(CanonicalIdSchema).default([]),
        contradictions: z.array(z.string()).default([])
      }),
      documents: z.array(InferenceEntitySchema).default([]),
      capabilities: z.array(InferenceEntitySchema).default([]),
      domains: z.array(InferenceEntitySchema).default([]),
      organization_classes: z.array(InferenceEntitySchema).default([]),
      organizations: z.array(InferenceOrgSchema).default([]),
      roles: z.array(InferenceRoleSchema).default([]),
      opportunities: z.array(InferenceEntitySchema).default([]),
      strategies: z.array(InferenceEntitySchema).default([]),
      search_queries: z.array(InferenceQuerySchema).default([])
    })
  })
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
export function getGeminiCareerResponseJsonSchema() {
  const schema = zodToJsonSchema(GeminiInferenceSchema, {
    target: "jsonSchema2019-09",
    name: "GeminiCareerInference",
    definitionPath: "$defs"
  });

  sanitizeSchema(schema);

  return schema as any;
}
