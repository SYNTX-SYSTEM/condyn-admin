import { zodToJsonSchema } from "zod-to-json-schema";
import { CapabilityKernelOutputSchema } from "../schema";

type JsonSchemaNode = Record<string, unknown>;

function sanitizeGeminiSchema(node: unknown): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach(sanitizeGeminiSchema);
    return;
  }

  const schema = node as JsonSchemaNode;
  delete schema.$schema;
  delete schema.minLength;
  delete schema.pattern;
  delete schema.default;

  const properties = schema.properties;
  if (properties && typeof properties === "object" && !Array.isArray(properties)) {
    Object.values(properties).forEach(sanitizeGeminiSchema);
  }
  sanitizeGeminiSchema(schema.items);
  if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
    sanitizeGeminiSchema(schema.additionalProperties);
  }
  for (const keyword of ["anyOf", "oneOf", "allOf"] as const) {
    const alternatives = schema[keyword];
    if (Array.isArray(alternatives)) alternatives.forEach(sanitizeGeminiSchema);
  }
  const definitions = schema.$defs;
  if (definitions && typeof definitions === "object" && !Array.isArray(definitions)) {
    Object.values(definitions).forEach(sanitizeGeminiSchema);
  }
}

export function getGeminiCapabilityKernelResponseJsonSchema(): JsonSchemaNode {
  const generated = zodToJsonSchema(CapabilityKernelOutputSchema, {
    target: "jsonSchema2019-09",
    name: "CapabilityKernelOutput",
    definitionPath: "$defs"
  }) as JsonSchemaNode;

  let projected = generated;
  if (typeof generated.$ref === "string" && generated.$ref.startsWith("#/$defs/")) {
    const definitionName = generated.$ref.slice("#/$defs/".length);
    const definitions = generated.$defs as JsonSchemaNode | undefined;
    const rootDefinition = definitions?.[definitionName];
    if (rootDefinition && typeof rootDefinition === "object" && !Array.isArray(rootDefinition)) {
      projected = { ...(rootDefinition as JsonSchemaNode), ...(definitions ? { $defs: definitions } : {}) };
    }
  }

  sanitizeGeminiSchema(projected);
  return projected;
}
