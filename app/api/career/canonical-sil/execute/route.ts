import { NextResponse } from "next/server";
import { createProductionCanonicalSilStageBProductService } from "../../../../../lib/career/runtime/canonical-sil-execution";
import type { CanonicalSilExecutionInput } from "../../../../../lib/career/runtime/canonical-sil-execution";

function policyConfiguration() {
  const tensionClassificationPolicyVersion = process.env.CAREER_TENSION_CLASSIFICATION_POLICY_VERSION;
  const evolutionInputDerivationPolicyVersion = process.env.CAREER_EVOLUTION_INPUT_DERIVATION_POLICY_VERSION;
  if (!tensionClassificationPolicyVersion || !evolutionInputDerivationPolicyVersion) {
    throw new Error("ERR_CANONICAL_SIL_STAGE_B_POLICY_CONFIGURATION_INVALID");
  }
  return { tensionClassificationPolicyVersion, evolutionInputDerivationPolicyVersion };
}

/** Explicit Stage-B ingress: request IDs are consumed exactly and never selected by this route. */
export async function POST(request: Request) {
  try {
    const input = await request.json() as CanonicalSilExecutionInput;
    const association = await createProductionCanonicalSilStageBProductService(policyConfiguration()).execute(input);
    return NextResponse.json({ success: true, association }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ERR_CANONICAL_SIL_STAGE_B_FAILED";
    return NextResponse.json({ success: false, status: "FAILED", issues: [{ code, message: code }] }, { status: code === "ERR_CANONICAL_SIL_STAGE_B_POLICY_CONFIGURATION_INVALID" ? 500 : 400 });
  }
}
