/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * END-TO-END INFERENCE PIPELINE (`lib/career/pipeline.ts`)
 * 
 * Status: TDD Step 4.4 Skeleton
 * Scope: Document ingestion, ID assignment, prompt building, provider invocation, output processing, and stamping.
 */

import {
  DocumentInput,
  InferenceProvider,
  buildCareerAnalysisPrompt,
  buildCareerAnalysisPromptWithResolver,
  processLlmOutput
} from "./adapter";
import { ValidationResult } from "./validator";
import { CanonicalCareerAnalysis, CanonicalIdSchema } from "./schema";
import { BatchDocumentInput, BatchProgress, loadDocumentBatch } from "./loaders/batch";
import { ActivePromptResolver } from "./prompts/resolver";

import { SourceMetadata } from "./loaders/source";

export interface DocumentLoaderInput {
  docId?: string;
  title?: string;
  content: string;
  metadata?: SourceMetadata;
}

export interface PipelineExecutionOptions {
  promptResolver?: ActivePromptResolver;
  explicitKeyBase64?: string;
  explicitAnalysisId?: string;
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
      content: input.content,
      metadata: input.metadata
    };
  });
}

/**
 * Orchestrates the end-to-end career analysis inference pipeline.
 * Document Loader -> Prompt Builder (optional Registry Resolver) -> InferenceProvider -> Output Processor -> Validator -> Canonical Model.
 */
export async function executeCareerAnalysisPipeline(
  inputs: DocumentLoaderInput[],
  provider: InferenceProvider,
  options?: PipelineExecutionOptions
): Promise<ValidationResult<CanonicalCareerAnalysis>> {
  const startTime = Date.now();
  const docs = loadDocuments(inputs);
  const promptBundle = await buildCareerAnalysisPromptWithResolver(
    docs,
    options?.promptResolver,
    options?.explicitKeyBase64
  );
  const rawOutput = await provider.execute(promptBundle);
  
  const context = {
    analysis_id: options?.explicitAnalysisId || `ANL_${new Date().toISOString().replace(/[-:TZs.]/g, '').substring(0, 14)}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    execution_duration_ms: Date.now() - startTime,
    document_count: docs.length,
    pipeline_steps: [],
    documents: docs
  };

  const result = processLlmOutput(rawOutput, context);

  if (promptBundle.promptMetadata) {
    result.metrics.promptMetadata = promptBundle.promptMetadata;
  }

  return result;
}

/**
 * Orchestrates the end-to-end career analysis inference pipeline for a mixed batch of documents
 * (text, markdown, PDF buffers/base64), reporting progress and ensuring stable ID assignment.
 */
export async function executeCareerAnalysisBatchPipeline(
  batch: BatchDocumentInput[],
  provider: InferenceProvider,
  onProgress?: (progress: BatchProgress) => void,
  options?: PipelineExecutionOptions
): Promise<ValidationResult<CanonicalCareerAnalysis>> {
  const startTime = Date.now();
  const docs = await loadDocumentBatch(batch, onProgress);
  const promptBundle = await buildCareerAnalysisPromptWithResolver(
    docs,
    options?.promptResolver,
    options?.explicitKeyBase64
  );
  const rawOutput = await provider.execute(promptBundle);
  
  const context = {
    analysis_id: options?.explicitAnalysisId || `ANL_${new Date().toISOString().replace(/[-:TZs.]/g, '').substring(0, 14)}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    execution_duration_ms: Date.now() - startTime,
    document_count: docs.length,
    pipeline_steps: [],
    documents: docs
  };

  const result = processLlmOutput(rawOutput, context);

  if (promptBundle.promptMetadata) {
    result.metrics.promptMetadata = promptBundle.promptMetadata;
  }

  return result;
}

