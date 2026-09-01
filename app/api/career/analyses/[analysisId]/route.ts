import { NextResponse } from "next/server";
import { getCareerAnalysisRepository } from "../../../../../lib/career/repositories";
import { projectTopology } from "../../../../../lib/career/perception";
import { buildViewModel } from "../../../../../lib/career/view-model";
import { buildRadialLayout } from "../../../../../lib/career/layout";
import { toReactFlow } from "../../../../../lib/career/adapters/react-flow";
import { matchCareerAnalysisAgainstPool } from "../../../../../lib/career/matching/engine";
import { DEMO_COMPANY_POOL } from "../../../../../lib/career/matching/demo-pool";
import { generateCareerRecommendations } from "../../../../../lib/career/recommendations/gaps";
import { db } from "../../../../../lib/career/db/client";
import { PostgresCapabilityCoreRepository, PostgresCapabilityProposalProjectionReferenceRepository, createCapabilityProposalProjectionReader } from "../../../../../lib/career/capability-core";

export async function GET(req: Request, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    const resolvedParams = await params;
    const { analysisId } = resolvedParams;

    if (!analysisId) {
      return NextResponse.json(
        {
          success: false,
          status: "FAILED",
          issues: [{ code: "ERR_MISSING_ID", message: "Analysis ID parameter is required." }]
        },
        { status: 400 }
      );
    }

    const repository = getCareerAnalysisRepository();
    const analysis = await repository.load(analysisId);

    if (!analysis) {
      return NextResponse.json(
        {
          success: false,
          status: "FAILED",
          issues: [{ code: "ERR_ANALYSIS_NOT_FOUND", message: `No analysis found with ID "${analysisId}".` }]
        },
        { status: 404 }
      );
    }

    // Execute server-side perception transformation chain
    const projection = projectTopology(analysis);
    const viewModel = buildViewModel(projection);
    const layout = buildRadialLayout(viewModel);
    const reactFlowGraph = toReactFlow(layout);

    const metadata = analysis.structured_data.analysis.metadata;

    const matching = matchCareerAnalysisAgainstPool(analysis, DEMO_COMPANY_POOL);
    const recommendations = generateCareerRecommendations(analysis, matching);
    // This is a separately namespaced, exact-lineage sidecar. Its absence is
    // normal for historical analyses and never changes the legacy result status.
    const capabilityProposalProjection = await createCapabilityProposalProjectionReader({
      references: new PostgresCapabilityProposalProjectionReferenceRepository(db),
      capabilityRepository: new PostgresCapabilityCoreRepository(db)
    }).read(analysisId);

    return NextResponse.json({
      success: true,
      status: "VERIFIED",
      analysisId,
      metadata,
      matching,
      recommendations,
      capabilityProposalProjection,
      analysis,
      reactFlowGraph
    });
  } catch (err: any) {
    console.error(`Error loading analysis in /api/career/analyses/[analysisId]:`, err);
    return NextResponse.json(
      {
        success: false,
        status: "FAILED",
        issues: [{ code: "ERR_SERVER_FATAL", message: err.message || "Failed to load analysis details." }]
      },
      { status: 500 }
    );
  }
}
