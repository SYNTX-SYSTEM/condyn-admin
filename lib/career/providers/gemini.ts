import { GoogleGenAI } from "@google/genai";
import { InferenceProvider, PromptBuilderOutput } from "../adapter";
import { getGeminiCareerResponseJsonSchema } from "../schema-projector";
import * as crypto from "crypto";

export const DEFAULT_GEMINI_MODEL_CASCADE = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash"
];

export interface AttemptedModelTelemetry {
  model: string;
  status: "SUCCESS" | "RATE_LIMITED" | "FAILED";
  latencyMs: number;
  error?: string;
}

export interface InferenceTelemetry {
  modelsAttempted: AttemptedModelTelemetry[];
  activeModel: string;
  fallbackTriggered: boolean;
  totalLatencyMs: number;
  finishReason?: string;
  outputTokens?: number;
  inputTokens?: number;
  continuations?: number;
  structuredRegenerations?: number;
  complete?: boolean;
}

export interface GeminiProviderOptions {
  apiKey?: string;
  model?: string;
  modelCascade?: string[];
}

function formatGeminiError(
  err: any,
  model: string,
  attemptIndex: number,
  totalAttempts: number,
  step: number,
  schema: any,
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens: number,
  temperature: number,
  tokenMetrics?: { exactInputTokens: number, modelInputLimit: number, modelOutputLimit: number, requestedOutputTokens: number, errorString?: string }
): string {
  const httpStatus = err?.status || err?.response?.status || "UNKNOWN";
  const code = err?.code || err?.error?.code || "UNKNOWN";
  const status = err?.status || err?.error?.status || "UNKNOWN";
  const message = err?.message || err?.error?.message || String(err);
  
  let schemaBytes = 0;
  let schemaProps = 0;
  let schemaRefs = 0;
  let schemaDefs = 0;
  let schemaDepth = 0;
  let schemaRootKeys = 0;
  
  if (schema) {
    try {
      schemaBytes = JSON.stringify(schema).length;
      schemaRootKeys = Object.keys(schema).length;
      if (schema.$defs) {
        schemaDefs = Object.keys(schema.$defs).length;
      }
      
      const scan = (obj: any, currentDepth: number) => {
        if (!obj || typeof obj !== "object") return;
        schemaDepth = Math.max(schemaDepth, currentDepth);
        if (Array.isArray(obj)) {
          obj.forEach(o => scan(o, currentDepth));
          return;
        }
        if (obj.$ref) schemaRefs++;
        if (obj.type === "object" && obj.properties) {
           schemaProps += Object.keys(obj.properties).length;
        }
        for (const k of Object.keys(obj)) {
          scan(obj[k], currentDepth + 1);
        }
      };
      scan(schema, 1);
    } catch (e) {}
  }

  const detailsObj = err?.details || err?.errorDetails || err?.error?.details;
  const detailsStr = detailsObj ? JSON.stringify(detailsObj) : "NONE";

  let tokenMetricsStr = "";
  if (tokenMetrics) {
    const errorStr = tokenMetrics.errorString ? `\nMETRICS ERROR: ${tokenMetrics.errorString}` : "";
    tokenMetricsStr = `
EXACT INPUT TOKENS: ${tokenMetrics.exactInputTokens > -1 ? tokenMetrics.exactInputTokens : "UNKNOWN"}
MODEL INPUT TOKEN LIMIT: ${tokenMetrics.modelInputLimit > -1 ? tokenMetrics.modelInputLimit : "UNKNOWN"}
MODEL OUTPUT TOKEN LIMIT: ${tokenMetrics.modelOutputLimit > -1 ? tokenMetrics.modelOutputLimit : "UNKNOWN"}
REQUESTED OUTPUT TOKENS: ${tokenMetrics.requestedOutputTokens}
INPUT + REQUESTED OUTPUT: ${tokenMetrics.exactInputTokens > -1 ? tokenMetrics.exactInputTokens + tokenMetrics.requestedOutputTokens : "UNKNOWN"}${errorStr}
`;
  }

  return `
GEMINI REQUEST FAILURE
MODEL: ${model}
ATTEMPT: ${attemptIndex + 1}/${totalAttempts}
STEP: ${step}
HTTP: ${httpStatus}
CODE: ${code}
STATUS: ${status}
MESSAGE: ${message}
DETAILS: ${detailsStr}
${tokenMetricsStr}
REQUEST:
responseMimeType: application/json
responseJsonSchema: ${schema ? "YES" : "NO"}
schemaBytes: ${schemaBytes}
schemaDepth: ${schemaDepth}
schemaProperties: ${schemaProps}
schemaRefs: ${schemaRefs}
schemaDefs: ${schemaDefs}
schemaRootKeys: ${schemaRootKeys}
systemPromptChars: ${systemPrompt?.length || 0}
userPromptChars: ${userPrompt?.length || 0}
maxOutputTokens: ${maxOutputTokens}
temperature: ${temperature}
`.trim();
}

/**
 * Server-Side Google Gemini Inference Provider ("Dumb Consumer" boundary).
 * Implements canonical InferenceProvider contract without leaking SDK or API keys to client.
 * Features an autonomous Multi-Model Failover Cascade and auto-continuation for MAX_TOKENS.
 */
export class GeminiProvider implements InferenceProvider {
  private apiKey?: string;
  private modelCascade: string[];
  public lastTelemetry?: InferenceTelemetry;

  constructor(options?: GeminiProviderOptions) {
    this.apiKey = options?.apiKey || process.env.GEMINI_API_KEY;
    if (options?.modelCascade && options.modelCascade.length > 0) {
      this.modelCascade = options.modelCascade;
    } else if (options?.model || process.env.GEMINI_MODEL) {
      const primary = options?.model || process.env.GEMINI_MODEL!;
      this.modelCascade = [
        primary,
        ...DEFAULT_GEMINI_MODEL_CASCADE.filter((m) => m !== primary)
      ];
    } else {
      this.modelCascade = [...DEFAULT_GEMINI_MODEL_CASCADE];
    }
  }

  /**
   * Executes the prompt bundle against Google Gemini API via @google/genai SDK.
   * Cycles through modelCascade on 503/429 or transient service errors.
   * Automatically continues generation if finishReason === "MAX_TOKENS".
   */
  async execute(prompt: PromptBuilderOutput): Promise<string> {
    const resolvedKey = this.apiKey || process.env.GEMINI_API_KEY;
    if (!resolvedKey) {
      throw new Error("ERR_PROVIDER_FAILURE: Missing GEMINI_API_KEY environment variable or constructor option.");
    }

    const startTime = Date.now();
    const modelsAttempted: AttemptedModelTelemetry[] = [];
    let lastError: Error | null = null;
    let finalDiagnostic = "";

    for (let i = 0; i < this.modelCascade.length; i++) {
      const currentModel = this.modelCascade[i];
      const attemptStart = Date.now();
      let currentStep = 0;
      let lastRequestConfig: any = null;
      const initialContents = `${prompt.systemPrompt}\n\n${prompt.userPrompt}`;

      try {
        const ai = new GoogleGenAI({ apiKey: resolvedKey });
        
        const MAX_CONTINUATIONS = process.env.GEMINI_MAX_CONTINUATIONS
          ? parseInt(process.env.GEMINI_MAX_CONTINUATIONS, 10)
          : 8;
        const MAX_STRUCTURED_REGENERATIONS = 2;

        let finishReason = "STOP";
        let inputTokens = 0;
        let outputTokens = 0;
        let continuations = 0;
        let structuredRegenerations = 0;
        let fullRawText = "";
        
        let requestedMaxOutputTokens = process.env.GEMINI_MAX_OUTPUT_TOKENS
          ? parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS, 10)
          : 65536;
        
        let effectiveMaxOutputTokens = requestedMaxOutputTokens;
        if (currentModel === "gemini-3.5-flash") {
          effectiveMaxOutputTokens = Math.min(requestedMaxOutputTokens, 65536);
        }

        const schema = getGeminiCareerResponseJsonSchema(prompt.allowedDocIds);
        // Determine if we are running in structured mode (we currently always do for this provider)
        const isStructured = schema !== undefined && schema !== null;

        if (isStructured) {
          // ==========================================
          // BOUNDED ATOMIC REGENERATION (STRUCTURED)
          // ==========================================
          for (let attempt = 0; attempt <= MAX_STRUCTURED_REGENERATIONS; attempt++) {
            currentStep = attempt;
            structuredRegenerations = attempt;
            continuations = 0;

            lastRequestConfig = {
              responseMimeType: "application/json",
              responseJsonSchema: schema,
              temperature: 0.1,
              maxOutputTokens: effectiveMaxOutputTokens
            };

            // INJECTED INSTRUMENTATION
            if (process.env.DEBUG_GEMINI_REQUEST) {
              console.log("=== GEMINI REQUEST BOUNDARY ===");
              console.log("prompt.allowedDocIds:", JSON.stringify(prompt.allowedDocIds));
              console.log("structured output enabled:", isStructured);
              if (isStructured) {
                let entityDef = schema.properties?.entities?.items;
                if (entityDef?.$ref) {
                  const refPath = entityDef.$ref.split('/').slice(1);
                  let current = schema;
                  for (const part of refPath) current = current[part];
                  entityDef = current;
                }
                
                let evidenceItemDef = entityDef?.properties?.evidence?.items;
                if (evidenceItemDef?.$ref) {
                  const refPath = evidenceItemDef.$ref.split('/').slice(1);
                  let current = schema;
                  for (const part of refPath) current = current[part];
                  evidenceItemDef = current;
                }
                
                console.log("evidence.doc_id.enum:", JSON.stringify(evidenceItemDef?.properties?.doc_id?.enum));
              }
              console.log("===============================");
            }

            const response = await ai.models.generateContent({
              model: currentModel,
              contents: initialContents,
              config: lastRequestConfig
            });

            const candidate = (response as any).candidates?.[0];
            finishReason = candidate?.finishReason || "STOP";
            
            let stepOutputTokens = 0;
            const usage = (response as any).usageMetadata;
            if (usage) {
              inputTokens += usage.promptTokenCount || 0;
              stepOutputTokens = usage.candidatesTokenCount || usage.outputTokenCount || 0;
              outputTokens += stepOutputTokens;
            }

            const rawText = typeof (response as any).text === "function" ? await (response as any).text() : response.text;
            if (!rawText || typeof rawText !== "string") {
              throw new Error("Empty or non-string response generated by Gemini API.");
            }

            if (finishReason === "MAX_TOKENS") {
              if (attempt === MAX_STRUCTURED_REGENERATIONS) {
                throw new Error("ERR_PROVIDER_STRUCTURED_OUTPUT_TRUNCATED");
              }
              // Otherwise discard and retry from scratch
              continue;
            } else {
              fullRawText = rawText.trim();
              break;
            }
          }
        } else {
          // ==========================================
          // SUFFIX CONTINUATION (UNSTRUCTURED)
          // ==========================================
          const chunks: string[] = [];
          let contents: any = initialContents;

          for (let step = 0; step <= MAX_CONTINUATIONS; step++) {
            currentStep = step;
            
            lastRequestConfig = {
              responseMimeType: "application/json",
              temperature: 0.1,
              maxOutputTokens: effectiveMaxOutputTokens
            };

            const response = await ai.models.generateContent({
              model: currentModel,
              contents,
              config: lastRequestConfig
            });

            const candidate = (response as any).candidates?.[0];
            finishReason = candidate?.finishReason || "STOP";
            
            let stepOutputTokens = 0;
            const usage = (response as any).usageMetadata;
            if (usage) {
              inputTokens += usage.promptTokenCount || 0;
              stepOutputTokens = usage.candidatesTokenCount || usage.outputTokenCount || 0;
              outputTokens += stepOutputTokens;
            }

            const rawText = typeof (response as any).text === "function" ? await (response as any).text() : response.text;
            if (!rawText || typeof rawText !== "string") {
              if (chunks.length > 0) break;
              throw new Error("Empty or non-string response generated by Gemini API.");
            }

            chunks.push(rawText);

            if (finishReason !== "MAX_TOKENS") {
              break;
            }

            continuations++;
            contents = [
              { role: "user", parts: [{ text: initialContents }] },
              { role: "model", parts: [{ text: chunks.join("\n") }] },
              { role: "user", parts: [{ text: "Continue exactly where you stopped." }] }
            ];
          }
          fullRawText = chunks.join("\n").trim();
        }
        const latencyMs = Date.now() - attemptStart;

        modelsAttempted.push({
          model: currentModel,
          status: "SUCCESS",
          latencyMs
        });

        this.lastTelemetry = {
          modelsAttempted,
          activeModel: currentModel,
          fallbackTriggered: i > 0,
          totalLatencyMs: Date.now() - startTime,
          finishReason,
          outputTokens,
          inputTokens,
          continuations,
          structuredRegenerations,
          complete: finishReason !== "MAX_TOKENS"
        };

        return fullRawText;
      } catch (err: any) {
        const schemaUsed = lastRequestConfig?.responseJsonSchema;
        const maxTokensSent = lastRequestConfig?.maxOutputTokens || 65536;
        
        let exactInputTokens = -1;
        let modelInputLimit = -1;
        let modelOutputLimit = -1;
        let tokenMetricsError = "";

        if (currentStep === 0 && (err?.status === 400 || err?.response?.status === 400)) {
          try {
            const ai = new GoogleGenAI({ apiKey: resolvedKey });
            
            const [tokenCountRes, modelInfoRes] = await Promise.all([
              ai.models.countTokens({
                model: currentModel,
                contents: initialContents
              }),
              
              ai.models.get({ model: currentModel })
            ]);

            if (tokenCountRes?.totalTokens) {
              exactInputTokens = tokenCountRes.totalTokens;
            }
            if (modelInfoRes) {
              modelInputLimit = modelInfoRes.inputTokenLimit || -1;
              modelOutputLimit = modelInfoRes.outputTokenLimit || -1;
            }
          } catch (e: any) {
            tokenMetricsError = `[Metrics Capture Failed] ${e?.name || 'Error'}: ${e?.message || String(e)}`;
          }
        }

        finalDiagnostic = formatGeminiError(
          err, currentModel, i, this.modelCascade.length, currentStep, schemaUsed, 
          prompt.systemPrompt, prompt.userPrompt, maxTokensSent, 0.1,
          { exactInputTokens, modelInputLimit, modelOutputLimit, requestedOutputTokens: maxTokensSent, errorString: tokenMetricsError }
        );
        
        console.error("==================================================");
        console.error(finalDiagnostic);
        console.error("==================================================");

        const latencyMs = Date.now() - attemptStart;
        const errorMsg = err?.message || String(err);
        const isRateLimitOrOverload =
          errorMsg.includes("503") ||
          errorMsg.includes("429") ||
          errorMsg.includes("high demand") ||
          errorMsg.includes("UNAVAILABLE") ||
          errorMsg.includes("RESOURCE_EXHAUSTED");

        modelsAttempted.push({
          model: currentModel,
          status: isRateLimitOrOverload ? "RATE_LIMITED" : "FAILED",
          latencyMs,
          error: errorMsg
        });

        lastError = err;

        if (isRateLimitOrOverload && i < this.modelCascade.length - 1) {
          continue;
        }

        if (!isRateLimitOrOverload) {
          break;
        }
      }
    }

    this.lastTelemetry = {
      modelsAttempted,
      activeModel: "NONE",
      fallbackTriggered: modelsAttempted.length > 1,
      totalLatencyMs: Date.now() - startTime,
      complete: false
    };

    const finalErrorMsg = lastError?.message || String(lastError);
    if (finalErrorMsg.startsWith("ERR_PROVIDER_FAILURE:")) {
      throw lastError;
    }
    throw new Error(`ERR_PROVIDER_FAILURE:\n${finalDiagnostic || finalErrorMsg}`);
  }
}
