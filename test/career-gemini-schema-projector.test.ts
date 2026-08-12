import { describe, it, expect } from "vitest";
import { getGeminiCareerResponseJsonSchema } from "../lib/career/schema-projector";
import { RelationTypeEnum } from "../lib/career/schema";

describe("BUG 010B: Gemini Schema Projector Reference Integrity", () => {
  it("should project a fully resolvable Gemini-compatible schema without unsupported keywords", () => {
    const schema = getGeminiCareerResponseJsonSchema();

    // 2. The final schema must contain NO `definitions` keyword (Gemini expects `$defs`)
    expect(schema.definitions).toBeUndefined();

    // 3. If refs are used (which they are), `$defs` must exist to hold their targets
    expect(schema.$defs).toBeDefined();

    // 1. Every local `$ref` must resolve inside the returned schema
    const refs: string[] = [];
    function extractRefs(obj: any) {
      if (!obj || typeof obj !== "object") return;
      if (Array.isArray(obj)) {
        obj.forEach(extractRefs);
        return;
      }
      if (obj.$ref) {
        refs.push(obj.$ref);
      }
      for (const k of Object.keys(obj)) {
        if (k !== "$ref") extractRefs(obj[k]);
      }
    }
    extractRefs(schema);
    
    expect(refs.length).toBeGreaterThan(0);

    const unresolved: string[] = [];
    for (const ref of refs) {
      if (!ref.startsWith("#/")) {
        unresolved.push(ref);
        continue;
      }
      const parts = ref.split("/").slice(1);
      let current: any = schema;
      let ok = true;
      for (const part of parts) {
        if (current === undefined || current === null) {
          ok = false;
          break;
        }
        current = current[part];
      }
      if (!ok || current === undefined) {
        unresolved.push(ref);
      }
    }

    // Expected RED: If the projector generates `#/definitions/...` but `schema.definitions` is deleted,
    // these refs will fail to resolve.
    expect(unresolved).toHaveLength(0);

    // 4. The canonical relationship enum remains exact
    const schemaStr = JSON.stringify(schema);
    const canonicalEnumValues = RelationTypeEnum.options;
    canonicalEnumValues.forEach((enumValue) => {
      expect(schemaStr).toContain(`"${enumValue}"`);
    });

    // 5. Unsupported Gemini schema keywords are absent
    // Zod's unsupported generator keywords that we found:
    const keywords = new Set<string>();
    function extractKeywords(obj: any) {
      if (!obj || typeof obj !== "object") return;
      if (Array.isArray(obj)) {
        obj.forEach(extractKeywords);
        return;
      }
      for (const k of Object.keys(obj)) {
        keywords.add(k);
        const val = obj[k];
        
        if (k === "properties") {
          for (const propSchema of Object.values(val)) {
            extractKeywords(propSchema);
          }
        } else if (k === "$defs" || k === "definitions") {
          for (const defSchema of Object.values(val)) {
            extractKeywords(defSchema);
          }
        } else if (k === "items" || k === "additionalProperties") {
          extractKeywords(val);
        } else if (k === "anyOf" || k === "oneOf") {
          if (Array.isArray(val)) val.forEach(extractKeywords);
        }
        // Do not blindly recurse into unknown object values to avoid treating 
        // domain property names or definition names as schema keywords.
      }
    }
    extractKeywords(schema);
    
    const allKeywords = Array.from(keywords);
    expect(allKeywords).not.toContain("$schema");
    expect(allKeywords).not.toContain("minLength");
    expect(allKeywords).not.toContain("pattern");
    expect(allKeywords).not.toContain("default");
    expect(allKeywords).not.toContain("definitions");
  });
});
