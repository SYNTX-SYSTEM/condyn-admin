import { describe, it } from "vitest";
import { GoogleGenAI } from "@google/genai";
import { getGeminiCareerResponseJsonSchema } from "../lib/career/schema-projector";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  UniversalEntitySchema,
  OrganizationEntitySchema,
  RoleEntitySchema,
  SearchQueryEntitySchema,
  ConsistencyClusterSchema
} from "../lib/career/schema";

try {
  const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  envFile.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
} catch (e) {}

describe.skipIf(!process.env.RUN_GEMINI_DIAGNOSTICS)("BUG010J: Schema Bisection", () => {
  it("should run phase 1 and 2", async () => {
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
    const uniqueKeywords = new Set<string>();
    const unsupportedKeywords = new Map<string, string>();
    const illegalRefSiblings = new Map<string, string[]>();

    function walkSchema(node: any, pathStr: string, depth: number) {
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
      return;
    }

    async function testSchema(name: string, schema: any) {
      const bytes = JSON.stringify(schema).length;
      let retries = 3;
      while (retries > 0) {
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
          fs.appendFileSync("bisection_results.txt", `PROBE | ${name.padEnd(25)} | ${bytes} | HTTP: 200\\n`);
          return true;
        } catch (err: any) {
          const status = err?.status || err?.response?.status || 400;
          if (status === 503 || status === 429) {
            console.log(`PROBE | ${name.padEnd(25)} | ${bytes} | HTTP: ${status} (RETRYING)`);
            retries--;
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          console.log(`PROBE | ${name.padEnd(25)} | ${bytes} | HTTP: ${status} (FAIL)`);
          fs.appendFileSync("bisection_results.txt", `PROBE | ${name.padEnd(25)} | ${bytes} | HTTP: ${status} (FAIL)\\n`);
          return false;
        }
      }
      return false;
    }

    console.log("\\n────────────────────────────────────");
    console.log("PHASE 2 — LIVE STRUCTURAL BISECTION");
    console.log("────────────────────────────────────");

    const getSub = (zodNode: any) => {
      let s = zodToJsonSchema(zodNode, { target: "jsonSchema2019-09", name: "GeminiCareerInference", definitionPath: "$defs" }) as any;
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
      const delKeys = (obj: any) => {
        if (!obj || typeof obj !== "object") return;
        if (Array.isArray(obj)) return obj.forEach(delKeys);
        delete obj["$schema"]; delete obj["minLength"]; delete obj["pattern"]; delete obj["default"];
        Object.keys(obj).forEach(k => delKeys(obj[k]));
      };
      delKeys(fin);
      return fin;
    };

    console.log("\\n────────────────────────────────────");
    console.log("PHASE 3 — COMPOSITION TEST");
    console.log("────────────────────────────────────");
  
    const InferenceEntitySchema = UniversalEntitySchema.omit({ validation: true });
    const InferenceOrgSchema = OrganizationEntitySchema.omit({ validation: true });
    const InferenceRoleSchema = RoleEntitySchema.omit({ validation: true });
    const InferenceQuerySchema = SearchQueryEntitySchema.omit({ validation: true });

    const m1 = getSub(z.object({ report_markdown: z.string(), structured_data: z.object({ analysis: z.object({ consistency: z.object({ clusters: z.array(ConsistencyClusterSchema).default([]) }) }) }) }));
    const m2 = getSub(z.object({ report_markdown: z.string(), structured_data: z.object({ analysis: z.object({ consistency: z.object({ clusters: z.array(ConsistencyClusterSchema).default([]) }), documents: z.array(InferenceEntitySchema).default([]) }) }) }));
    const m3 = getSub(z.object({ report_markdown: z.string(), structured_data: z.object({ analysis: z.object({ consistency: z.object({ clusters: z.array(ConsistencyClusterSchema).default([]) }), documents: z.array(InferenceEntitySchema).default([]), capabilities: z.array(InferenceEntitySchema).default([]) }) }) }));
    const m4 = getSub(z.object({ report_markdown: z.string(), structured_data: z.object({ analysis: z.object({ consistency: z.object({ clusters: z.array(ConsistencyClusterSchema).default([]) }), documents: z.array(InferenceEntitySchema).default([]), capabilities: z.array(InferenceEntitySchema).default([]), organizations: z.array(InferenceOrgSchema).default([]) }) }) }));
    const m5 = getSub(z.object({ report_markdown: z.string(), structured_data: z.object({ analysis: z.object({ consistency: z.object({ clusters: z.array(ConsistencyClusterSchema).default([]) }), documents: z.array(InferenceEntitySchema).default([]), capabilities: z.array(InferenceEntitySchema).default([]), organizations: z.array(InferenceOrgSchema).default([]), roles: z.array(InferenceRoleSchema).default([]) }) }) }));
    const m6 = getSub(z.object({ report_markdown: z.string(), structured_data: z.object({ analysis: z.object({ consistency: z.object({ clusters: z.array(ConsistencyClusterSchema).default([]) }), documents: z.array(InferenceEntitySchema).default([]), capabilities: z.array(InferenceEntitySchema).default([]), organizations: z.array(InferenceOrgSchema).default([]), roles: z.array(InferenceRoleSchema).default([]), search_queries: z.array(InferenceQuerySchema).default([]) }) }) }));
  
    expect(await testSchema("M1_consistency", m1)).toBe(true);
    expect(await testSchema("M2_documents", m2)).toBe(true);
    expect(await testSchema("M3_capabilities", m3)).toBe(true);
    expect(await testSchema("M4_organizations", m4)).toBe(true);
    expect(await testSchema("M5_roles", m5)).toBe(true);
    expect(await testSchema("M6_queries", m6)).toBe(true);

  }, 1200000); // 20 mins
});
