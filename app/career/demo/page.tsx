import React from "react";
import { CareerIntelligenceDashboard } from "../../components/career/demo/CareerIntelligenceDashboard";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "./demo-data";

interface CareerIntelligenceDemoSearchParams {
  canonicalSilAssociationId?: string;
  /** Exact G3 DCTXREV; opens the HR Decision Loop dock. Never inferred. */
  careerDecisionContextRevisionId?: string;
  /** Exact G2 DREV read as the reconstructed next decision context. */
  decisionContextRevisionId?: string;
  /** Exact analysis fed to the Job Pool match panel only; it loads nothing into the planetarium. */
  analysisId?: string;
  /** Exact Job Pool upload selected for matching. Never inferred, never a latest pool. */
  jobPoolUploadId?: string;
  /** Planetarium focus: FIELD opens the SYNTX Job Field (JOB and POOL are accepted as legacy aliases); anything else is the capability field (an exact jobPoolUploadId without focus opens the field). */
  focus?: string;
  /** Exact observation point of the field; never inferred. */
  jobOrganizationId?: string;
  jobRoleId?: string;
  jobRequirementId?: string;
  /** Exact selected job scope (SFE invariant: no analysis without it); never inferred, independent of the observation point. */
  jobScopePoolUploadId?: string;
  jobScopeRoleId?: string;
}

export default async function CareerIntelligenceDemoPage({ searchParams }: { searchParams: Promise<CareerIntelligenceDemoSearchParams> }) {
  const { canonicalSilAssociationId, careerDecisionContextRevisionId, decisionContextRevisionId, analysisId, jobPoolUploadId, focus, jobOrganizationId, jobRoleId, jobRequirementId, jobScopePoolUploadId, jobScopeRoleId } = await searchParams;
  return (
    <CareerIntelligenceDashboard
      data={EMPTY_CAREER_INTELLIGENCE_DATA}
      canonicalSilAssociationId={canonicalSilAssociationId}
      careerDecisionContextRevisionId={careerDecisionContextRevisionId}
      decisionContextRevisionId={decisionContextRevisionId}
      analysisId={analysisId}
      jobPoolUploadId={jobPoolUploadId}
      fieldFocus={focus === "FIELD" || focus === "JOB" || focus === "POOL" ? "FIELD" : focus === "CAPABILITY" ? "CAPABILITY" : undefined}
      jobOrganizationId={jobOrganizationId}
      jobRoleId={jobRoleId}
      jobRequirementId={jobRequirementId}
      jobScopePoolUploadId={jobScopePoolUploadId}
      jobScopeRoleId={jobScopeRoleId}
    />
  );
}
