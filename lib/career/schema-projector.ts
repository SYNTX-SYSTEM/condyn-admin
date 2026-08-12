import { zodToJsonSchema } from "zod-to-json-schema";
import { CanonicalCareerAnalysisSchema } from "./schema";

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
 * Generates a Gemini-compatible JSON Schema from the SSOT CanonicalCareerAnalysisSchema.
 * Targets jsonSchema2019-09 to natively emit $defs instead of definitions.
 */
export function getGeminiCareerResponseJsonSchema() {
  const schema = zodToJsonSchema(CanonicalCareerAnalysisSchema, {
    target: "jsonSchema2019-09",
    name: "CanonicalCareerAnalysis",
    definitionPath: "$defs"
  });

  sanitizeSchema(schema);

  return schema as any;
}
