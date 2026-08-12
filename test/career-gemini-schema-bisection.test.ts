import { describe, it, expect } from "vitest";
import { GoogleGenAI } from "@google/genai";
import { getGeminiCareerResponseJsonSchema } from "../lib/career/schema-projector";
import * as fs from "fs";
import * as path from "path";

// Attempt to load .env.local strictly for this diagnostic
try {
  const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  envFile.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
} catch (e) {}

const runBisection = process.env.RUN_GEMINI_BISECTION === "1";

describe.runIf(runBisection)("Gemini Schema Deterministic Bisection", () => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = "gemini-3.5-flash"; // Fixed controlled baseline model
  
  function getUsedDefs(obj: any, allDefs: any) {
    const used = new Set<string>();
    const scan = (o: any) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(scan); return; }
      if (o.$ref && o.$ref.startsWith('#/$defs/')) {
        used.add(o.$ref.replace('#/$defs/', ''));
      }
      for (const k of Object.keys(o)) scan(o[k]);
    };
    scan(obj);
    let lastSize = 0;
    while(used.size > lastSize) {
      lastSize = used.size;
      for (const def of Array.from(used)) {
        if (allDefs[def]) scan(allDefs[def]);
      }
    }
    const filtered: any = {};
    for (const def of used) {
      if (allDefs[def]) filtered[def] = allDefs[def];
    }
    return Object.keys(filtered).length > 0 ? filtered : undefined;
  }

  function countProperties(obj: any): number {
    if (!obj || typeof obj !== 'object') return 0;
    let count = 0;
    if (obj.properties) count += Object.keys(obj.properties).length;
    if (Array.isArray(obj)) {
      for (const item of obj) count += countProperties(item);
    } else {
      for (const k of Object.keys(obj)) count += countProperties(obj[k]);
    }
    return count;
  }

  function getDepth(obj: any): number {
    if (!obj || typeof obj !== 'object') return 0;
    let max = 0;
    for (const k of Object.keys(obj)) {
      max = Math.max(max, getDepth(obj[k]));
    }
    return 1 + max;
  }

  function resolveLocalRef(schema: any, ref: string) {
    if (!ref.startsWith("#/")) return undefined;
    const parts = ref.split("/").slice(1);
    let current = schema;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }

  function checkRefs(schema: any) {
    const refs = new Set<string>();
    const scan = (o: any) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(scan); return; }
      if (o.$ref) refs.add(o.$ref);
      for (const k of Object.keys(o)) scan(o[k]);
    };
    scan(schema);
    let unresolved = 0;
    for (const ref of refs) {
      if (!resolveLocalRef(schema, ref)) {
         unresolved++;
      }
    }
    if (unresolved > 0) {
      throw new Error(`Ref-integrity check failed: ${unresolved} unresolved refs`);
    }
  }

  it("Execute Bisection Sequence", async () => {
    expect(apiKey).toBeDefined();
    const ai = new GoogleGenAI({ apiKey: apiKey! });
    const fullSchema = getGeminiCareerResponseJsonSchema();
    const allDefs = fullSchema.$defs || {};

    const canonicalRoot = fullSchema.$ref ? resolveLocalRef(fullSchema, fullSchema.$ref) : fullSchema;
    expect(canonicalRoot).toBeDefined();
    expect(canonicalRoot.type).toBe("object");
    expect(canonicalRoot.properties).toBeDefined();

    console.log(`\nBISECTION TRACE (${model})`);
    console.log("ID   | PATH                      | BYTES | DEPTH | PROPS | HTTP | PASS/FAIL | REASON");
    console.log("-----------------------------------------------------------------------------------------");

    async function testSchema(id: string, pathLabel: string, schema: any) {
      const bytes = JSON.stringify(schema).length;
      const depth = getDepth(schema);
      const props = countProperties(schema);
      
      let status = "FAIL";
      let http = "";
      let reason = "";
      
      try {
        checkRefs(schema);
        await ai.models.generateContent({
          model,
          contents: "Erstelle ein kurzes Profil für einen Software Entwickler.",
          config: {
            responseMimeType: "application/json",
            responseJsonSchema: schema as any,
            temperature: 0.1
          }
        });
        status = "PASS";
        http = "200";
      } catch (e: any) {
        status = "FAIL";
        http = String(e?.status || (e?.message?.includes("404") ? "404" : e?.message?.includes("400") ? "400" : "ERR"));
        reason = (e?.message || "").split("\n")[0].substring(0, 45);
      }
      
      console.log(`${id.padEnd(4)} | ${pathLabel.padEnd(25)} | ${String(bytes).padEnd(5)} | ${String(depth).padEnd(5)} | ${String(props).padEnd(5)} | ${http.padEnd(4)} | ${status.padEnd(9)} | ${reason}`);
      return status === "PASS";
    }

    const buildSub = (name: string, schemaFrag: any) => ({
      type: "object",
      properties: { [name]: schemaFrag },
      $defs: getUsedDefs(schemaFrag, allDefs)
    });

    // S0: Control
    await testSchema("S0", "Control (Tiny)", {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"]
    });

    // S1: report_markdown
    const passS1 = await testSchema("S1", "report_markdown", buildSub("report_markdown", canonicalRoot.properties.report_markdown));
    
    // S2: structured_data
    const sdProp = canonicalRoot.properties.structured_data;
    const passS2 = await testSchema("S2", "structured_data", buildSub("structured_data", sdProp));

    if (!passS2) {
      // Bisect structured_data children
      let sdTarget = sdProp;
      if (sdTarget.$ref) {
          sdTarget = resolveLocalRef(fullSchema, sdTarget.$ref);
      }
      if (sdTarget && sdTarget.properties) {
        const passAnalysis = await testSchema("S3a", "structured_data.analysis", buildSub("analysis", sdTarget.properties.analysis));
        const passPresent = await testSchema("S3b", "structured_data.presentation", buildSub("presentation", sdTarget.properties.presentation));

        if (!passAnalysis) {
          let analysisTarget = sdTarget.properties.analysis;
          if (analysisTarget.$ref) {
             analysisTarget = resolveLocalRef(fullSchema, analysisTarget.$ref);
          }
          if (analysisTarget && analysisTarget.properties) {
             let id = 1;
             for (const key of Object.keys(analysisTarget.properties)) {
               await testSchema(`S4_${id++}`, `analysis.${key}`, buildSub(key, analysisTarget.properties[key]));
             }
          }
        }
      }
    }
    
    console.log("-----------------------------------------------------------------------------------------\n");
  }, 600000);
});
