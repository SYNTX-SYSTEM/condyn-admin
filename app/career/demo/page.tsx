import React from "react";
import { CareerIntelligenceDashboard } from "../../components/career/demo/CareerIntelligenceDashboard";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "./demo-data";

interface CareerIntelligenceDemoSearchParams {
  canonicalSilAssociationId?: string;
  /** Exact G3 DCTXREV; opens the HR Decision Loop dock. Never inferred. */
  careerDecisionContextRevisionId?: string;
  /** Exact G2 DREV read as the reconstructed next decision context. */
  decisionContextRevisionId?: string;
}

export default async function CareerIntelligenceDemoPage({ searchParams }: { searchParams: Promise<CareerIntelligenceDemoSearchParams> }) {
  const { canonicalSilAssociationId, careerDecisionContextRevisionId, decisionContextRevisionId } = await searchParams;
  return (
    <CareerIntelligenceDashboard
      data={EMPTY_CAREER_INTELLIGENCE_DATA}
      canonicalSilAssociationId={canonicalSilAssociationId}
      careerDecisionContextRevisionId={careerDecisionContextRevisionId}
      decisionContextRevisionId={decisionContextRevisionId}
    />
  );
}
