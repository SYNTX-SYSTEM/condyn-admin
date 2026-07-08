/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * END-TO-END INFERENCE PIPELINE (`lib/career/pipeline.ts`)
 * 
 * Status: TDD Step 4.4 Skeleton
 * Scope: Document ingestion, ID assignment, prompt building, provider invocation, output processing, and stamping.
 */

import { DocumentInput, InferenceProvider, buildCareerAnalysisPrompt, processLlmOutput } from "./adapter";
import { ValidationResult } from "./validator";
import { CanonicalCareerAnalysis, CanonicalIdSchema } from "./schema";
import { BatchDocumentInput, BatchProgress, loadDocumentBatch } from "./loaders/batch";

export interface DocumentLoaderInput {
  docId?: string;
  title?: string;
  content: string;
}

/**
 * Loads text/markdown documents and assigns canonical IDs (DOC_001, DOC_002) if omitted.
 * Validates custom IDs against CanonicalIdSchema and ensures they strictly use the DOC_ prefix.
 */
export function loadDocuments(inputs: DocumentLoaderInput[]): DocumentInput[] {
  return inputs.map((input, index) => {
    let docId = input.docId;

    if (!docId || !docId.trim()) {
      docId = `DOC_${String(index + 1).padStart(3, '0')}`;
    } else {
      const parseResult = CanonicalIdSchema.safeParse(docId);
      if (!parseResult.success) {
        throw new Error(`ERR_INVALID_DOCUMENT_ID: Document ID "${docId}" violates CanonicalIdSchema.`);
      }
      if (!docId.startsWith("DOC_")) {
        throw new Error(`ERR_INVALID_DOCUMENT_ID: Document ID "${docId}" must strictly use the DOC_ prefix.`);
      }
    }

    return {
      docId,
      title: input.title,
      content: input.content
    };
  });
}

/**
 * Orchestrates the end-to-end career analysis inference pipeline.
 * Document Loader -> Prompt Builder -> InferenceProvider -> Output Processor -> Validator -> Canonical Model.
 */
export async function executeCareerAnalysisPipeline(
  inputs: DocumentLoaderInput[],
  provider: InferenceProvider
): Promise<ValidationResult<CanonicalCareerAnalysis>> {
  const docs = loadDocuments(inputs);
  const promptBundle = buildCareerAnalysisPrompt(docs);
  const rawOutput = await provider.execute(promptBundle);
  return processLlmOutput(rawOutput);
}

/**
 * Orchestrates the end-to-end career analysis inference pipeline for a mixed batch of documents
 * (text, markdown, PDF buffers/base64), reporting progress and ensuring stable ID assignment.
 */
export async function executeCareerAnalysisBatchPipeline(
  batch: BatchDocumentInput[],
  provider: InferenceProvider,
  onProgress?: (progress: BatchProgress) => void
): Promise<ValidationResult<CanonicalCareerAnalysis>> {
  const docs = await loadDocumentBatch(batch, onProgress);
  const promptBundle = buildCareerAnalysisPrompt(docs);
  const rawOutput = await provider.execute(promptBundle);
  return processLlmOutput(rawOutput);
}

