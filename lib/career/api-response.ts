/**
 * PURE RESPONSE ENVELOPE BUILDER
 * Defines the strict, single API success contract for /api/career/analyze.
 * Ensures the validated canonical payload is always exposed at `data`.
 */
export function buildCareerAnalysisSuccessResponse(
  verifiedAnalysis: any,
  context: {
    analysisId: string;
    metadata: any;
    sourceManifest: any[];
    matching: any;
    recommendations: any;
    reactFlowGraph: any;
    inferenceTelemetry: any;
    persistenceWarning?: string;
  }
) {
  return {
    success: true,
    status: "VERIFIED",
    data: verifiedAnalysis, // MUST ALWAYS BE EXPOSED HERE
    analysisId: context.analysisId,
    metadata: context.metadata,
    sourceManifest: context.sourceManifest,
    matching: context.matching,
    recommendations: context.recommendations,
    reactFlowGraph: context.reactFlowGraph,
    inferenceTelemetry: context.inferenceTelemetry,
    persistenceWarning: context.persistenceWarning,
    complete: context.inferenceTelemetry?.complete !== false,
    stop_reason: context.inferenceTelemetry?.finishReason || "STOP",
    continuations: context.inferenceTelemetry?.continuations || 0,
    reportMarkdown: verifiedAnalysis.report_markdown,
    analysis: verifiedAnalysis.report_markdown
  };
}
