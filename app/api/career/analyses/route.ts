import { NextResponse } from "next/server";
import { getCareerAnalysisRepository } from "../../../../lib/career/repositories";

export async function GET(req: Request) {
  try {
    const repository = getCareerAnalysisRepository();
    const analyses = await repository.list();

    return NextResponse.json({
      success: true,
      analyses
    });
  } catch (err: any) {
    console.error("Error listing analyses in /api/career/analyses:", err);
    return NextResponse.json(
      {
        success: false,
        status: "FAILED",
        issues: [{ code: "ERR_SERVER_FATAL", message: err.message || "Failed to retrieve historical analyses." }]
      },
      { status: 500 }
    );
  }
}
