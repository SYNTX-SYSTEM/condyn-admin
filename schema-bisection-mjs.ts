import { GoogleGenAI } from "@google/genai";
import { getGeminiCareerResponseJsonSchema } from "./lib/career/schema-projector.ts";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  GeminiInferenceSchema,
  UniversalEntitySchema,
  OrganizationEntitySchema,
  RoleEntitySchema,
  SearchQueryEntitySchema,
  NormalizedScoreSchema,
  ConsistencyClusterSchema,
  CanonicalIdSchema
} from "./lib/career/schema-projector.ts";

try {
  const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  envFile.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
} catch (e) {}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const fullSchema = getGeminiCareerResponseJsonSchema();

const SUPPORTED_KEYWORDS = new Set([
  "$id", "$defs", "$ref", "$anchor",
  "type", "format", "title", "description",
  "enum", "items", "prefixItems", "minItems", "maxItems",
  "minimum", "maximum", "anyOf", "oneOf",
  "properties", "additionalProperties", "required", "propertyOrdering"
]);

let schemaBytes = JSON.stringify(fullSchema).length;
let maxDepth = 0;
let propCount = 0;
let refCount = 0;
let defCount = Object.keys(fullSchema.$defs || {}).length;
const uniqueKeywords = new Set();
const unsupportedKeywords = new Map();
const illegalRefSiblings = new Map();

function walkSchema(node, pathStr, depth) {
  if (!node || typeof node !== "object") return;
  maxDepth = Math.max(maxDepth, depth);

  if (Array.isArray(node)) {
    node.forEach((item, idx) => walkSchema(item, `${pathStr}[${idx}]`, depth + 1));
    return;
  }

  const keys = Object.keys(node);
  if (keys.includes("$ref")) {
    refCount++;
    const nonRefKeys = keys.filter(k => k !== "$ref" && !k.startsWith("$"));
    if (nonRefKeys.length > 0) {
      illegalRefSiblings.set(pathStr, nonRefKeys);
    }
  }

  for (const k of keys) {
    if (k === "properties") {
      const props = node[k];
      for (const pk of Object.keys(props)) {
        propCount++;
        walkSchema(props[pk], `${pathStr}.properties.${pk}`, depth + 1);
      }
      uniqueKeywords.add(k);
    } else if (k === "$defs") {
      const defs = node[k];
      for (const dk of Object.keys(defs)) {
        walkSchema(defs[dk], `${pathStr}.$defs.${dk}`, depth + 1);
      }
    } else {
      uniqueKeywords.add(k);
      if (!SUPPORTED_KEYWORDS.has(k)) {
        unsupportedKeywords.set(pathStr, k);
      }
      if (typeof node[k] === "object") {
        walkSchema(node[k], `${pathStr}.${k}`, depth + 1);
      }
    }
  }
}

walkSchema(fullSchema, "root", 0);

console.log("────────────────────────────────────");
console.log("PHASE 1 — STATIC COMPLIANCE AUDIT");
console.log("────────────────────────────────────");
console.log("SCHEMA BYTES:", schemaBytes);
console.log("DEPTH:", maxDepth);
console.log("PROPERTY COUNT:", propCount);
console.log("REF COUNT:", refCount);
console.log("DEF COUNT:", defCount);
console.log("UNIQUE STRUCTURAL KEYWORDS:", Array.from(uniqueKeywords).join(", "));
console.log("UNSUPPORTED KEYWORDS:");
for (const [p, k] of unsupportedKeywords.entries()) {
  console.log(`[${p} -> ${k}]`);
}
console.log("REF WITH ILLEGAL SIBLINGS:");
for (const [p, k] of illegalRefSiblings.entries()) {
  console.log(`[${p} -> ${k.join(", ")}]`);
}

if (unsupportedKeywords.size > 0 || illegalRefSiblings.size > 0) {
  console.log("STOPPING DUE TO STATIC COMPLIANCE FAILURE.");
  process.exit(1);
}

// Phase 2: live structural bisection

async function testSchema(name, schema) {
  const bytes = JSON.stringify(schema).length;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "test",
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: schema,
        temperature: 0.1,
        maxOutputTokens: 256
      }
    });
    console.log(`PROBE | ${name.padEnd(25)} | ${bytes} | HTTP: 200`);
    return true;
  } catch (err) {
    const status = err?.status || err?.response?.status || 400;
    console.log(`PROBE | ${name.padEnd(25)} | ${bytes} | HTTP: ${status} (FAIL)`);
    return false;
  }
}

async function runPhase2() {
  console.log("\\n────────────────────────────────────");
  console.log("PHASE 2 — LIVE STRUCTURAL BISECTION");
  console.log("────────────────────────────────────");

  const getSub = (zodNode) => {
    let s = zodToJsonSchema(zodNode, { target: "jsonSchema2019-09", name: "GeminiCareerInference", definitionPath: "$defs" });
    let fin = s;
    if (fin.$ref) {
      const refPath = fin.$ref;
      if (refPath.startsWith("#/$defs/")) {
        const defName = refPath.replace("#/$defs/", "");
        if (fin.$defs && fin.$defs[defName]) {
          const unwrapped = { ...fin.$defs[defName] };
          unwrapped.$defs = fin.$defs;
          fin = unwrapped;
        }
      }
    }
    const delKeys = (obj) => {
      if (!obj || typeof obj !== "object") return;
      if (Array.isArray(obj)) return obj.forEach(delKeys);
      delete obj["$schema"]; delete obj["minLength"]; delete obj["pattern"]; delete obj["default"];
      Object.keys(obj).forEach(k => delKeys(obj[k]));
    };
    delKeys(fin);
    return fin;
  };

  const c0 = getSub(z.object({ hello: z.string() }));
  await testSchema("C0_TINY", c0);

  const { UniversalEntitySchema, OrganizationEntitySchema, RoleEntitySchema, SearchQueryEntitySchema, ConsistencyClusterSchema } = await import("./lib/career/schema.ts");

  const InferenceEntitySchema = UniversalEntitySchema.omit({ validation: true });
  const InferenceOrgSchema = OrganizationEntitySchema.omit({ validation: true });
  const InferenceRoleSchema = RoleEntitySchema.omit({ validation: true });
  const InferenceQuerySchema = SearchQueryEntitySchema.omit({ validation: true });

  const c1 = getSub(z.object({ report_markdown: z.string() }));
  const c2 = getSub(z.object({ structured_data: z.object({ analysis: z.object({ consistency: z.object({ clusters: z.array(ConsistencyClusterSchema).default([]) }) }) }) }));
  const c3 = getSub(z.object({ structured_data: z.object({ analysis: z.object({ documents: z.array(InferenceEntitySchema).default([]) }) }) }));
  const c4 = getSub(z.object({ structured_data: z.object({ analysis: z.object({ capabilities: z.array(InferenceEntitySchema).default([]) }) }) }));
  const c7 = getSub(z.object({ structured_data: z.object({ analysis: z.object({ organizations: z.array(InferenceOrgSchema).default([]) }) }) }));
  const c8 = getSub(z.object({ structured_data: z.object({ analysis: z.object({ roles: z.array(InferenceRoleSchema).default([]) }) }) }));
  const c11 = getSub(z.object({ structured_data: z.object({ analysis: z.object({ search_queries: z.array(InferenceQuerySchema).default([]) }) }) }));

  const res = {
    c1: await testSchema("C1_report", c1),
    c2: await testSchema("C2_consistency", c2),
    c3: await testSchema("C3_documents", c3),
    c4: await testSchema("C4_capabilities", c4),
    c7: await testSchema("C7_organizations", c7),
    c8: await testSchema("C8_roles", c8),
    c11: await testSchema("C11_queries", c11),
  };

  const anyFail = Object.values(res).some(v => !v);
  if (anyFail) {
    console.log("INDIVIDUAL BRANCH FAILED.");
    
    console.log("\\n────────────────────────────────────");
    console.log("PHASE 4 — ENTITY SUBSCHEMA BISECTION");
    console.log("────────────────────────────────────");
    
    const Universal = UniversalEntitySchema.omit({ validation: true });
    const e1 = getSub(z.object({ entity_id: z.string() }));
    const e2 = getSub(z.object({ entity_id: z.string(), identity: z.object({ name: z.string(), canonical_type: z.string() }) }));
    const e3 = getSub(z.object({ properties: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])) }));
    const e4 = getSub(z.object({ relationships: z.array(z.object({ target_id: z.string(), relation_type: z.string() })) }));
    const e5 = getSub(z.object({ evidence: z.array(z.object({ source_id: z.string(), exact_quote: z.string() })) }));
    
    await testSchema("E1_entity_id", e1);
    await testSchema("E2_identity", e2);
    await testSchema("E3_properties", e3);
    await testSchema("E4_relationships", e4);
    await testSchema("E5_evidence", e5);

    return;
  }

  console.log("\\n────────────────────────────────────");
  console.log("PHASE 3 — COMPOSITION TEST");
  console.log("────────────────────────────────────");

  const m1 = getSub(z.object({ report_markdown: z.string(), structured_data: z.object({ analysis: z.object({ consistency: z.object({ clusters: z.array(ConsistencyClusterSchema).default([]) }) }) }) }));
  const m2 = getSub(z.object({ report_markdown: z.string(), structured_data: z.object({ analysis: z.object({ consistency: z.object({ clusters: z.array(ConsistencyClusterSchema).default([]) }), documents: z.array(InferenceEntitySchema).default([]) }) }) }));
  const m3 = getSub(z.object({ report_markdown: z.string(), structured_data: z.object({ analysis: z.object({ consistency: z.object({ clusters: z.array(ConsistencyClusterSchema).default([]) }), documents: z.array(InferenceEntitySchema).default([]), capabilities: z.array(InferenceEntitySchema).default([]) }) }) }));

  await testSchema("M1_consistency", m1);
  await testSchema("M2_documents", m2);
  await testSchema("M3_capabilities", m3);

}

runPhase2().catch(console.error);
