import { NextResponse } from "next/server";
import { createProductionCanonicalSilStageBProductService } from "../../../../../lib/career/runtime/canonical-sil-execution";

function policyConfiguration() {
  const tensionClassificationPolicyVersion = process.env.CAREER_TENSION_CLASSIFICATION_POLICY_VERSION;
  const evolutionInputDerivationPolicyVersion = process.env.CAREER_EVOLUTION_INPUT_DERIVATION_POLICY_VERSION;
  if (!tensionClassificationPolicyVersion || !evolutionInputDerivationPolicyVersion) {
    throw new Error("ERR_CANONICAL_SIL_STAGE_B_POLICY_CONFIGURATION_INVALID");
  }
  return { tensionClassificationPolicyVersion, evolutionInputDerivationPolicyVersion };
}

/** Exact association read: there is intentionally no analysis/latest/current lookup. */
export async function GET(_: Request, { params }: { params: Promise<{ associationId: string }> }) {
  try {
    const { associationId } = await params;
    if (!associationId) {
      return NextResponse.json({ success: false, status: "FAILED", issues: [{ code: "ERR_CANONICAL_SIL_RUNTIME_ASSOCIATION_NOT_FOUND", message: "associationId is required" }] }, { status: 400 });
    }
    const result = await createProductionCanonicalSilStageBProductService(policyConfiguration()).read(associationId);
    return NextResponse.json({ success: true, association: result.association, identities: result.identities, canonicalSil: result.model });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ERR_CANONICAL_SIL_READ_FAILED";
    const status = code === "ERR_CANONICAL_SIL_RUNTIME_ASSOCIATION_NOT_FOUND" ? 404 : code === "ERR_CANONICAL_SIL_STAGE_B_POLICY_CONFIGURATION_INVALID" ? 500 : 400;
    return NextResponse.json({ success: false, status: "FAILED", issues: [{ code, message: code }] }, { status });
  }
}
