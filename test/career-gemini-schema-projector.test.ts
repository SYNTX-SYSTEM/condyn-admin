import { describe, it, expect } from "vitest";
import { getGeminiCareerResponseJsonSchema, GeminiInferenceSchema } from "../lib/career/schema-projector";
import { RelationTypeEnum } from "../lib/career/schema";

describe("BUG 010B: Gemini Schema Projector Reference Integrity", () => {
  it("should project a fully resolvable Gemini-compatible schema without unsupported keywords", () => {
    const schema = getGeminiCareerResponseJsonSchema();

    // 0. The schema must be the root object, not a reference to one
    expect(schema.$ref).toBeUndefined();
    expect(schema.type).toBe("object");
    expect(schema.properties).toBeDefined();

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

  it("should explicitly expose specialized property keys in the UniversalInferencePropertiesSchema", () => {
    const schema = getGeminiCareerResponseJsonSchema();
    const schemaStr = JSON.stringify(schema);
    
    // ORGANIZATION
    expect(schemaStr).toContain('"country_iso"');
    expect(schemaStr).toContain('"industry_enum"');
    expect(schemaStr).toContain('"resonance_score"');
    
    // ROLE
    expect(schemaStr).toContain('"seniority"');
    expect(schemaStr).toContain('"domain_focus"');
    
    // SEARCH_QUERY
    expect(schemaStr).toContain('"title"');
    expect(schemaStr).toContain('"query"');
    expect(schemaStr).toContain('"purpose"');
    expect(schemaStr).toContain('"target"');
    expect(schemaStr).toContain('"priority"');
  });
});

describe("BUG010R: Inference Evidence Boundary Contract", () => {
  it("should FAIL inference if evidence is omitted or empty array", () => {
    const payloadMissing = {
      report_markdown: "# Analysis",
      consistency: { overall_cohesion_score: 1.0, clusters: [], outlier_doc_ids: [], contradictions: [] },
      entities: [
        {
          entity_kind: "CAPABILITY",
          entity_id: "CAP_001",
          name: "Test",
          properties: {},
          confidence: 0.9
          // evidence omitted
        }
      ]
    };
    expect(GeminiInferenceSchema.safeParse(payloadMissing).success).toBe(false);

    const payloadEmpty = {
      report_markdown: "# Analysis",
      consistency: { overall_cohesion_score: 1.0, clusters: [], outlier_doc_ids: [], contradictions: [] },
      entities: [
        {
          entity_kind: "CAPABILITY",
          entity_id: "CAP_001",
          name: "Test",
          properties: {},
          confidence: 0.9,
          evidence: [] // empty array
        }
      ]
    };
    expect(GeminiInferenceSchema.safeParse(payloadEmpty).success).toBe(false);
  });

  it("should PASS inference if one complete valid evidence item exists", () => {
    const payloadValid = {
      report_markdown: "# Analysis",
      consistency: { overall_cohesion_score: 1.0, clusters: [], outlier_doc_ids: [], contradictions: [] },
      entities: [
        {
          entity_kind: "CAPABILITY",
          entity_id: "CAP_001",
          name: "Test",
          properties: {},
          confidence: 0.9,
          evidence: [
            { doc_id: "DOC_001", location: "loc", context_quote: "this is a sufficiently long quote", evidence_score: 0.9 }
          ]
        }
      ]
    };
    expect(GeminiInferenceSchema.safeParse(payloadValid).success).toBe(true);
  });

  it("should explicitly project evidence in required and evidence.minItems === 1", () => {
    const schema = getGeminiCareerResponseJsonSchema();
    
    // Resolve entities schema dynamically
    expect(schema.properties).toBeDefined();
    expect(schema.properties.entities).toBeDefined();
    
    let entityDef = schema.properties.entities.items;
    
    // If it's a $ref, resolve it
    if (entityDef.$ref) {
      const refPath = entityDef.$ref.split('/').slice(1);
      let current = schema;
      for (const part of refPath) {
        current = current[part];
      }
      entityDef = current;
    }
    
    expect(entityDef).toBeDefined();
    expect(entityDef.type).toBe("object");
    
    // evidence must be in required
    expect(entityDef.required).toContain("evidence");
    
    // evidence must have minItems === 1
    const evidenceSchema = entityDef.properties.evidence;
    expect(evidenceSchema.type).toBe("array");
    expect(evidenceSchema.minItems).toBe(1);
    
    // context_quote minimum should be preserved if not stripped
    // Check evidence item definition for context_quote
    let evidenceItemDef = evidenceSchema.items;
    
    // If evidence items is a $ref, resolve it
    if (evidenceItemDef.$ref) {
      const refPath = evidenceItemDef.$ref.split('/').slice(1);
      let current = schema;
      for (const part of refPath) {
        current = current[part];
      }
      evidenceItemDef = current;
    }
    
    expect(evidenceItemDef.required).toContain("context_quote");
  });
});

describe("BUG010R: Final Source Reference Ownership Fix", () => {
  it("should project dynamic doc_id enum for evidence items when given valid source doc_ids", () => {
    const allowedDocs = ["DOC_001", "DOC_002"];
    const schema = getGeminiCareerResponseJsonSchema(allowedDocs);

    let entityDef = schema.properties.entities.items;
    if (entityDef.$ref) {
      const refPath = entityDef.$ref.split('/').slice(1);
      let current = schema;
      for (const part of refPath) { current = current[part]; }
      entityDef = current;
    }

    let evidenceItemDef = entityDef.properties.evidence.items;
    if (evidenceItemDef.$ref) {
      const refPath = evidenceItemDef.$ref.split('/').slice(1);
      let current = schema;
      for (const part of refPath) { current = current[part]; }
      evidenceItemDef = current;
    }

    expect(evidenceItemDef.properties.doc_id.enum).toEqual(["DOC_001", "DOC_002"]);
  });

  it("should omit doc_id enum constraint if no source doc_ids are provided", () => {
    const schema = getGeminiCareerResponseJsonSchema();
    let entityDef = schema.properties.entities.items;
    if (entityDef.$ref) {
      const refPath = entityDef.$ref.split('/').slice(1);
      let current = schema;
      for (const part of refPath) { current = current[part]; }
      entityDef = current;
    }

    let evidenceItemDef = entityDef.properties.evidence.items;
    if (evidenceItemDef.$ref) {
      const refPath = evidenceItemDef.$ref.split('/').slice(1);
      let current = schema;
      for (const part of refPath) { current = current[part]; }
      evidenceItemDef = current;
    }

    expect(evidenceItemDef.properties.doc_id.enum).toBeUndefined();
    expect(evidenceItemDef.properties.doc_id.type).toBe("string");
  });
});
