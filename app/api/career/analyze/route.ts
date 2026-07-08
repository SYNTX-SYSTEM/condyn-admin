import { NextResponse } from "next/server";
import { executeCareerAnalysisPipeline, DocumentLoaderInput } from "../../../../lib/career/pipeline";
import { getCareerInferenceProvider } from "../../../../lib/career/providers";
import { getCareerAnalysisRepository } from "../../../../lib/career/repositories";
import { projectTopology } from "../../../../lib/career/perception";
import { buildViewModel } from "../../../../lib/career/view-model";
import { buildRadialLayout } from "../../../../lib/career/layout";
import { toReactFlow } from "../../../../lib/career/adapters/react-flow";

// Request/Demo-scoped in-memory repository persistence for Step 7
const requestScopedRepository = getCareerAnalysisRepository();

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const documents: DocumentLoaderInput[] = body.documents || [];

    if (!Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        {
          success: false,
          status: "FAILED",
          issues: [{ code: "ERR_NO_DOCUMENTS", message: "No documents provided for analysis." }]
        },
        { status: 400 }
      );
    }

    // Verify content non-empty
    for (const doc of documents) {
      if (!doc.content || !doc.content.trim()) {
        return NextResponse.json(
          {
            success: false,
            status: "FAILED",
            issues: [{ code: "ERR_EMPTY_CONTENT", message: `Document content cannot be empty (Title: ${doc.title || "Untitled"}).` }]
          },
          { status: 400 }
        );
      }
    }

    // Provider choice resolved dynamically via getCareerInferenceProvider() (toggled via USE_GEMINI_PROVIDER)
    const provider = getCareerInferenceProvider();

    // Execute 8-layer domain pipeline on server
    const validationResult = await executeCareerAnalysisPipeline(documents, provider);

    if (validationResult.status === "FAILED" || !validationResult.data) {
      return NextResponse.json(
        {
          success: false,
          status: "FAILED",
          issues: validationResult.issues
        },
        { status: 422 }
      );
    }

    const verifiedAnalysis = validationResult.data;

    // Save to request/demo-scoped repository
    await requestScopedRepository.save(verifiedAnalysis);

    // Execute server-side perception transformation chain
    const projection = projectTopology(verifiedAnalysis);
    const viewModel = buildViewModel(projection);
    const layout = buildRadialLayout(viewModel);
    const reactFlowGraph = toReactFlow(layout);

    const analysisId = verifiedAnalysis.structured_data.analysis.metadata.analysis_id;
    const metadata = verifiedAnalysis.structured_data.analysis.metadata;

    return NextResponse.json({
      success: true,
      status: "VERIFIED",
      analysisId,
      metadata,
      reactFlowGraph
    });
  } catch (err: any) {
    console.error("Fatal error in /api/career/analyze:", err);
    const errorMsg = err.message || String(err);
    if (errorMsg.startsWith("ERR_PROVIDER_FAILURE")) {
      return NextResponse.json(
        {
          success: false,
          status: "FAILED",
          issues: [{ code: "ERR_PROVIDER_FAILURE", message: errorMsg }]
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        status: "FAILED",
        issues: [{ code: "ERR_SERVER_FATAL", message: errorMsg || "Internal server error during analysis execution." }]
      },
      { status: 500 }
    );
  }
}
