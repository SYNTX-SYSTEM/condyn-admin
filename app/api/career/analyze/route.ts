import { NextResponse } from "next/server";
import { executeCareerAnalysisPipeline } from "../../../../lib/career/pipeline";
import { loadWebsiteDocument } from "../../../../lib/career/loaders/website";
import { loadGitHubRepositoryDocuments } from "../../../../lib/career/loaders/github";
import { loadDocumentBatch } from "../../../../lib/career/loaders/batch";
import { DocumentInput } from "../../../../lib/career/adapter";
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
    const documents = body.documents || [];

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

    // Provider choice resolved dynamically via getCareerInferenceProvider() (toggled via USE_GEMINI_PROVIDER)
    const provider = getCareerInferenceProvider();

    // Normalize multi-source input items (text, markdown, pdf, website, github)
    const normalizedDocs: DocumentInput[] = [];
    const pendingBatch: any[] = [];

    const flushPendingBatch = async () => {
      if (pendingBatch.length > 0) {
        const batchDocs = await loadDocumentBatch(pendingBatch);
        normalizedDocs.push(...batchDocs);
        pendingBatch.length = 0;
      }
    };

    for (const item of documents) {
      if (item.type === "website") {
        await flushPendingBatch();
        if (!item.url || !String(item.url).trim()) {
          throw new Error("ERR_MISSING_SOURCE_URL: Missing url property for website source.");
        }
        const doc = await loadWebsiteDocument(item.url, item.title, item.docId);
        normalizedDocs.push(doc);
      } else if (item.type === "github") {
        await flushPendingBatch();
        if (!item.url || !String(item.url).trim()) {
          throw new Error("ERR_MISSING_SOURCE_URL: Missing url property for github source.");
        }
        const docs = await loadGitHubRepositoryDocuments(item.url);
        normalizedDocs.push(...docs);
      } else {
        pendingBatch.push(item);
      }
    }
    await flushPendingBatch();

    // Execute 8-layer domain pipeline on server
    const validationResult = await executeCareerAnalysisPipeline(normalizedDocs, provider);

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
    if (errorMsg.startsWith("ERR_")) {
      const code = errorMsg.split(":")[0];
      return NextResponse.json(
        {
          success: false,
          status: "FAILED",
          issues: [{ code, message: errorMsg }]
        },
        { status: 400 }
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
