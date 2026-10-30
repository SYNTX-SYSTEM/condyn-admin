"use client";

import React, { useState, useEffect } from "react";
import { DemoCareerIntelligenceData } from "../../../career/demo/demo-data";
import { SIL_TOKENS } from "./SILTokens";
import { IdentityCoreDropZone } from "./IdentityCoreDropZone";
import { OrbitalResonanceBubble } from "./OrbitalResonanceBubble";
import {
  SilOrbitEmptyState,
  SilOrbitEmptyStateCopy
} from "./SilOrbitEmptyState";
import { SourceDock, type SourceDockHandle } from "./SourceDock";
import { SemanticGuideDrawer } from "./SemanticGuideDrawer";
import { SystemCodexModal } from "./SystemCodexModal";
import { GuidedOnboardingOverlay } from "./GuidedOnboardingOverlay";
import { OrbitalSubspaceView, SemanticZoomLevel } from "./OrbitalSubspaceView";
import CapabilityCosmosView from "./CapabilityCosmosView";
import CapabilityDeepFocusView from "./CapabilityDeepFocusView";
import { OrbitalCosmosView } from "./OrbitalCosmosView";
import { OrbitalDeepFocusView } from "./OrbitalDeepFocusView";
import { InferenceTelemetryHUD } from "./InferenceTelemetryHUD";
import { HrDecisionLoopDock } from "./HrDecisionLoopDock";
import { SyntxField } from "./SyntxField";
import { SyntxFieldSelector } from "./SyntxFieldSelector";
import { SyntxInvestigationSelector } from "./SyntxInvestigationSelector";
import { SyntxEnergyRay, SyntxPlanetariumBackdrop } from "./manifestation/SyntxPlanetarium";
import { FocusTransitionStageShell } from "./manifestation/SyntxFocusShell";
import { observationFromParams, type SyntxObservation } from "../../../../lib/career/job-pool/syntx-field-view-model";
import { useJobPoolWorkflow } from "../../../../lib/career/ui/useJobPool";
import { useJobScopeValidation } from "../../../../lib/career/ui/useJobScope";
import { useAnalysisBoundary, useSelectedRoleCoverage } from "../../../../lib/career/ui/useRoleInvestigation";
import { useAnalysisResult } from "../../../../lib/career/ui/useAnalysisResult";
import { ANALYSIS_JOB_URL_PARAM, DISCOVERY_POOLS_URL_PARAM, ROLE_INVESTIGATION_URL_PARAM, analysisJobIdFromParam, discoveryPoolsFromParam, roleInvestigationIdFromParam, writeCareerDemoUrl } from "../../../../lib/career/ui/career-demo-url";
import { careerJobHandoff } from "../../../../lib/career/ui/career-job-handoff";
import { useAnalysisPicker } from "../../../../lib/career/ui/analysis-picker";
import { AnalysisPicker } from "./AnalysisPicker";
import { RoleDiscoveryEntry, RoleDiscoveryPanel } from "./RoleDiscoveryPanel";
import { useRoleDiscovery } from "../../../../lib/career/ui/role-discovery";
import { useSemanticInvestigation, type InvestigationRoleKey } from "../../../../lib/career/ui/semantic-investigation";
import { NAVIGATION_COPY } from "./navigation-copy";
import { decodeAnalysisResult, demoStateFromResult, firstScreenCoverageRequest, projectPxjFirstScreen, showsAnalysis, withoutLegacyOrbits, type AnalysisResultState } from "../../../../lib/career/view-model/pxj-first-screen";
import { PxjAnalysisJobOffer, PxjFirstScreen, pxjFirstScreenVisible } from "./PxjFirstScreen";
import { legacyJobComparisonPermitted } from "../../../../lib/career/investigation/client";
import { JOB_SCOPE_REQUIRED_MESSAGE, JOB_SCOPE_URL_PARAMS, isJobScopeErrorCode, jobScopeFromParams, type JobScope } from "../../../../lib/career/job-pool/job-scope";
import type { SyntxCapabilityGatePresentation, SyntxJobScopePresentation } from "./SyntxFieldSelector";
import { fieldEntryState, gateCauseOf } from "../../../../lib/career/view-model/field-entry-state";
import { DEFAULT_INVESTIGATION_MODE, INVESTIGATION_URL_PARAM, declareAnalysis, investigationModeFromParam, isInvestigationErrorCode, type InvestigationMode } from "../../../../lib/career/job-pool/investigation-mode";
import { describeAnalysisSource } from "../../../../lib/career/job-pool/frontend-presentation";
import { buildEvidenceGraph } from "../../../../lib/career/evidence/traversal";
import { computeGraphFocus } from "../../../../lib/career/evidence/highlight";
import { DecisionGraphInspector } from "./DecisionGraphInspector";
import { buildSilSourcePresentation } from "../../../../lib/career/view-model/source-presentation";
import { buildSilClusterPresentation } from "../../../../lib/career/view-model/cluster-presentation";
import { useCareerAnalysisJob } from "../../../../lib/career/ui/useCareerAnalysisJob";
import { SIL_COPY, type SilLocale } from "../../../../lib/career/view-model/sil-language";
import { buildSilOrbitEmptyState } from "../../../../lib/career/view-model/orbit-empty-state";
import { buildOrbitFocusProjection, presentSourcePlaceholders } from "../../../../lib/career/view-model/orbit-focus-projection";
import { resolveOrbitalFocusNavigation } from "../../../../lib/career/view-model/orbital-focus-navigation";
import type { SilOrbitStageId } from "../../../../lib/career/view-model/sil-language";
import { decodeCanonicalSilFrontendPresentation, type CanonicalSilFrontendPresentation, type CanonicalSilFrontendRegionName } from "../../../../lib/career/sil-projection/frontend-presentation";

export interface SemanticCareerIntelligenceFieldProps {
  data: DemoCareerIntelligenceData;
  /** Explicit Stage-B association selected by the product workflow, never inferred from Stage A. */
  canonicalSilAssociationId?: string;
  /** Explicit G3 Career Decision Context revision (DCTXREV) selected by the product workflow. */
  careerDecisionContextRevisionId?: string;
  /** Explicit G2 Decision Context revision (DREV) to read as the reconstructed next context. */
  decisionContextRevisionId?: string;
  /** Exact analysis on view (URL analysisId): its persisted result is read for the first screen (owner G1), its boundary decides
   *  the Job Field's comparison; a SUCCEEDED job of this session takes its place. */
  analysisId?: string;
  /** Exact Job Pool upload selected for matching (URL). */
  jobPoolUploadId?: string;
  /** Planetarium focus: CAPABILITY (default) or FIELD (the SYNTX Job Field, URL focus=FIELD; JOB and POOL are accepted as legacy aliases). Without an explicit focus, an exact jobPoolUploadId opens the field. */
  fieldFocus?: "CAPABILITY" | "FIELD";
  /** Exact observation point of the field (URL jobOrganizationId / jobRoleId / jobRequirementId); never inferred. */
  jobOrganizationId?: string;
  jobRoleId?: string;
  jobRequirementId?: string;
  /** Exact selected job scope (URL jobScopePoolUploadId / jobScopeRoleId); never inferred, kept across both fields and every depth. */
  jobScopePoolUploadId?: string;
  jobScopeRoleId?: string;
  /** Explicitly chosen investigation mode (URL investigationMode = PERSON | PERSON_X_JOB | JOB); never inferred. Without a choice the
   *  ground state is PERSON_X_JOB (JOB POOL FIRST), so every earlier link keeps its meaning. */
  investigationMode?: string;
  /** The analysis job of the URL (N-2 B-RUN): a run still going when the page was reloaded, followed by reading it only. */
  analysisJobId?: string;
  /** Role discovery (owner D-RD-1 = B): the pool uploads released for the PERSON analysis on view (URL discoveryPoolUploadId). */
  discoveryPoolUploadIds?: string[];
  /** RI-URL: the semantic investigation of the released pools, read again by its own id only (URL roleInvestigationId). */
  roleInvestigationId?: string;
  /** The application shell's brand surface follows the active field (Decision Loop Labs in the Job Field context). */
  onFieldFocusChange?: (focus: "CAPABILITY" | "FIELD") => void;
  initialAnalysisState?: {
    isAnalyzing?: boolean;
    analysisStep?: string | null;
    analysisError?: string | null;
    analysisSuccess?: boolean;
    inferenceTelemetry?: any;
  };
  initialLocale?: SilLocale;
  initialFocus?: {
    stageId?: SilOrbitStageId | null;
    zoomLevel?: SemanticZoomLevel;
  };
}

export { FocusTransitionStageShell, type FocusTransitionStageShellProps } from "./manifestation/SyntxFocusShell";

/**
 * CONDYN / SYNTX — Semantic Interface Language (SIL v3.0 Phase 3c Continuous Semantic Space)
 * SemanticCareerIntelligenceField: The living radial Bedeutungsraum organism with L0-L4 Semantic Zoom.
 */
export function resolveSilHudClusterId(
  stageId: string,
  activeData: DemoCareerIntelligenceData
): string | null {
  const clusters = buildSilClusterPresentation(
    stageId,
    true,
    { labels: [], titles: [] },
    activeData
  );

  return clusters[0]?.id ?? null;
}

/**
 * The legacy evidence graph has synthetic confidence/evidence fallback rules.
 * Proposal capabilities remain visible in the Capability Field, but must never
 * enter that legacy graph and acquire semantics the proposal projection lacks.
 */
export function excludeCapabilityProposalsFromEvidenceGraph(
  data: DemoCareerIntelligenceData
): DemoCareerIntelligenceData {
  if (!data.capabilities.some((capability) => capability.projectionState === "PROPOSED")) {
    return data;
  }
  return {
    ...data,
    capabilities: data.capabilities.filter(
      (capability) => capability.projectionState !== "PROPOSED"
    )
  };
}

export function resolveFocusedOrbitEmptyState(
  activeStageId: string | null,
  zoomLevel: number,
  activeData: DemoCareerIntelligenceData,
  locale: SilLocale
) {
  if (activeStageId === null || zoomLevel !== 1) {
    return null;
  }

  return buildSilOrbitEmptyState(
    activeStageId,
    activeData,
    locale
  );
}

export type SilFocusedOrbitPresentation =
  | {
      kind: "EMPTY_PROJECTION";
      stateLabel: string;
      evidenceLabel: string;
      emptyState: NonNullable<
        ReturnType<typeof buildSilOrbitEmptyState>
      >;
    }
  | {
      kind: "PROJECTED";
      stateLabel: null;
      evidenceLabel: null;
      emptyState: null;
    };

export function resolveSilFocusedOrbitPresentation(
  activeStageId: string | null,
  zoomLevel: number,
  activeData: DemoCareerIntelligenceData,
  locale: SilLocale
): SilFocusedOrbitPresentation | null {
  if (
    activeStageId === null ||
    zoomLevel !== 1 ||
    !["01", "02", "03", "04", "05", "06"].includes(
      activeStageId
    )
  ) {
    return null;
  }

  const emptyState = buildSilOrbitEmptyState(
    activeStageId,
    activeData,
    locale
  );

  if (emptyState) {
    const focusCopy = SIL_COPY[locale].focus;

    return {
      kind: "EMPTY_PROJECTION",
      stateLabel:
        focusCopy.emptyProjectionState,
      evidenceLabel:
        focusCopy.noneProjectedEvidence,
      emptyState
    };
  }

  return {
    kind: "PROJECTED",
    stateLabel: null,
    evidenceLabel: null,
    emptyState: null
  };
}

export type SilOrbitAttentionState =
  | "EMPTY_PROJECTION_ATTENTION"
  | null;

export function resolveSilOrbitAttentionState(
  stageId: string,
  activeData: DemoCareerIntelligenceData,
  jobState: string
): SilOrbitAttentionState {
  if (jobState !== "SUCCEEDED") {
    return null;
  }

  const emptyState = buildSilOrbitEmptyState(
    stageId,
    activeData,
    SIL_COPY.defaultLocale
  );

  return emptyState
    ? "EMPTY_PROJECTION_ATTENTION"
    : null;
}

/**
 * V-08 (PINK D-S10-1): the running worker fails a job with errorCode EXECUTION_FAILED and its message as errorSummary; a PDF the
 * loader cannot parse has a message that starts with the code ERR_PDF_PARSE_FAILURE (lib/career/loaders/pdf.ts). The code is read
 * as an exact token — bounded by non-code characters on both sides — in the code or the summary; no free-text heuristic.
 */
const PDF_PARSE_TOKEN = /(?:^|[^A-Z0-9_])ERR_PDF_PARSE_FAILURE(?![A-Z0-9_])/;
export function isPdfParseFailure(code: string | null | undefined, summary: string | null | undefined): boolean {
  return code === "ERR_PDF_PARSE_FAILURE" || (code === "EXECUTION_FAILED" && typeof summary === "string" && PDF_PARSE_TOKEN.test(summary));
}

export function SemanticCareerIntelligenceField({
  data,
  canonicalSilAssociationId,
  careerDecisionContextRevisionId,
  decisionContextRevisionId,
  analysisId,
  jobPoolUploadId,
  fieldFocus: initialFieldFocus,
  jobOrganizationId: initialJobOrganizationId,
  jobRoleId: initialJobRoleId,
  jobRequirementId: initialJobRequirementId,
  jobScopePoolUploadId: initialJobScopePoolUploadId,
  jobScopeRoleId: initialJobScopeRoleId,
  investigationMode: initialInvestigationMode,
  analysisJobId: initialAnalysisJobId,
  discoveryPoolUploadIds: initialDiscoveryPools,
  roleInvestigationId: initialRoleInvestigationId,
  onFieldFocusChange,
  initialAnalysisState,
  initialLocale = SIL_COPY.defaultLocale,
  initialFocus
}: SemanticCareerIntelligenceFieldProps) {
  const [locale, setLocale] = useState<SilLocale>(initialLocale);
  const t = SIL_COPY[locale];
  const [canonicalSilPresentation, setCanonicalSilPresentation] = useState<CanonicalSilFrontendPresentation | null>(null);
  const [requestedStageId, setActiveStageId] = useState<string | null>(
    initialFocus?.stageId ?? null
  );
  const [requestedHoverStageId, setHoveredStageId] = useState<string | null>(null);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [requestedZoomLevel, setZoomLevel] = useState<SemanticZoomLevel>(
    initialFocus?.zoomLevel ?? 0
  );
  const [requestedClusterId, setSelectedClusterId] = useState<string | null>(null);
  
  const job = useCareerAnalysisJob();
  const jobState = job.state.state;
  /** N-2 B-RUN: the URL's running job, followed after a reload by GET only (no POST, no second job, no retry); a value in another
   *  format is no job id and is removed. Polling the job stays the controller's; the field only names it. */
  const [resumedJobId] = useState<string | null>(() => analysisJobIdFromParam(initialAnalysisJobId));
  /** V-06: the banner of a job followed from the URL (FAILED or not found) can be closed: one push without analysisJobId (a reload of
   *  that entry shows no banner, Back returns to the entry that names the job); no retry, no POST. */
  const [dismissedJobId, setDismissedJobId] = useState<string | null>(null);
  const resumedJobOnView = resumedJobId !== null && job.state.activeJobId === resumedJobId;
  const jobBannerDismissed = resumedJobOnView && dismissedJobId === resumedJobId;
  useEffect(() => {
    if (resumedJobId !== null) job.resumeJob(resumedJobId);
    else writeCareerDemoUrl({ [ANALYSIS_JOB_URL_PARAM]: null }, "replace"); // nothing to write when the URL names none
  }, []);
  /** The run's job id stands in the URL while it runs (written on the 202, a replace: the system's addendum), so a reload follows it. */
  useEffect(() => {
    if (jobState === "SUBMITTING") writeCareerDemoUrl({ [ANALYSIS_JOB_URL_PARAM]: null }, "replace");
    else if ((jobState === "PENDING" || jobState === "RUNNING") && job.state.activeJobId) writeCareerDemoUrl({ [ANALYSIS_JOB_URL_PARAM]: job.state.activeJobId }, "replace");
  }, [jobState, job.state.activeJobId]);
  const isAnalyzing = jobState === "SUBMITTING" || jobState === "PENDING" || jobState === "RUNNING" || jobState === "LOADING_RESULT";
  /** O-NAV-SUBMIT: a job whose 202 reached the previous mount after its unmount is taken over once this field runs none of its own:
   *  followed by GET only (resumeJob), and named in the entry on view by the replace above (PENDING writes analysisJobId). */
  const [handedOver, setHandedOver] = useState(() => careerJobHandoff.version());
  useEffect(() => careerJobHandoff.subscribe(() => setHandedOver(careerJobHandoff.version())), []);
  useEffect(() => {
    if (isAnalyzing) return;
    const jobId = analysisJobIdFromParam(careerJobHandoff.take() ?? undefined);
    if (jobId !== null) job.resumeJob(jobId);
  }, [handedOver, isAnalyzing]);
  const showsRuntimeTelemetry = isAnalyzing || jobState === "FAILED";
  const runtimePresentationOperation =
    jobState === "SUBMITTING" || jobState === "LOADING_RESULT" || jobState === "FAILED"
      ? null
      : job.state.currentOperation;
  /** The backend's failure as delivered: HTTP status only for a rejected request, the code (ERR_…) always shown with its message. */
  const analysisError = jobState === "FAILED"
    ? { status: typeof job.state.httpStatus === "number" ? job.state.httpStatus : null, code: job.state.errorCode ?? null, message: job.state.errorSummary || "Job Failed" }
    : null;
  const analysisSuccess = jobState === "SUCCEEDED";
  const analysisStep = jobState; // fallback mapping

  /** The investigation boundary (owner GO "DEMO FRONTEND", 2026-10-15): one explicit mode for both fields, written to the URL only
   *  when chosen. A mode change never removes the selected job (G-05) and never touches sources or analyses. */
  const [investigationMode, setInvestigationMode] = useState<InvestigationMode>(() => investigationModeFromParam(initialInvestigationMode) ?? DEFAULT_INVESTIGATION_MODE);
  const selectInvestigationMode = (next: InvestigationMode) => {
    setInvestigationMode(next);
    writeCareerDemoUrl({ [INVESTIGATION_URL_PARAM]: next }, "push");
  };
  /** N-3 O-RF-1: a mode the URL names that is none (unknown, empty or repeated) is removed on mount, so the URL says what the
   *  interface shows: the same default as without the parameter (a replace; nothing to write when the URL names none). */
  useEffect(() => {
    if (investigationModeFromParam(initialInvestigationMode) === null) writeCareerDemoUrl({ [INVESTIGATION_URL_PARAM]: null }, "replace");
  }, []);
  /** Role discovery (D-RD-1 = B): the pools the user released, from the URL; released again only by the user (one push). A value
   *  the parser does not accept (not upload ids, repeated, more than 10) is no release: removed on mount (a replace). */
  const [discoveryPools, setDiscoveryPools] = useState<string[] | null>(() => initialDiscoveryPools ?? null);
  useEffect(() => {
    if (typeof window === "undefined" || initialDiscoveryPools !== undefined) return;
    const named = new URLSearchParams(window.location.search).getAll(DISCOVERY_POOLS_URL_PARAM);
    if (named.length > 0 && discoveryPoolsFromParam(named) === undefined) writeCareerDemoUrl({ [DISCOVERY_POOLS_URL_PARAM]: null }, "replace");
  }, []);
  // RI-URL: a roleInvestigationId not in the server's own format is no investigation at all — removed on mount, like the pools above.
  useEffect(() => {
    if (typeof window === "undefined" || initialRoleInvestigationId !== undefined) return;
    const named = new URLSearchParams(window.location.search).getAll(ROLE_INVESTIGATION_URL_PARAM);
    if (named.length > 0) writeCareerDemoUrl({ [ROLE_INVESTIGATION_URL_PARAM]: null }, "replace");
  }, []);
  /** RI-URL: the investigation named in the URL (GET only on mount / reload); cleared whenever the release it belonged to ends. */
  const [roleInvestigationId, setRoleInvestigationId] = useState<string | null>(() => initialRoleInvestigationId ?? null);
  const releaseDiscoveryPools = (ids: readonly string[]) => {
    const next = discoveryPoolsFromParam(ids) ?? null;
    setDiscoveryPools(next);
    setRoleInvestigationId(null);
    pushUrl({ [DISCOVERY_POOLS_URL_PARAM]: next ?? null, [ROLE_INVESTIGATION_URL_PARAM]: null });
  };
  /** RD-PANEL: opened only by the explicit DISCOVER JOBS (not a URL state); a release in the URL opens it on its own (NAV ≡ RELOAD). */
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const closeDiscovery = () => {
    setDiscoveryOpen(false);
    if (discoveryPools !== null) releaseDiscoveryPools([]);
  };
  const investigationCopy = t.syntx.investigation;

  // Job Connection: one workflow read shared by the control panel and the Job Field focus (presentation only).
  /** The analysis on view (the job result, else the URL's), independent of the mode: the GEMINI OUTPUT inspector reads it. */
  /** The URL's analysis as it stands now: the mount's, replaced by every SUCCEEDED analysis written to the URL (GELB F-RF-2). A new
   *  run clears the job's result, so without this the mount's id, not the URL's, would return while it runs or after it FAILED. */
  const [urlAnalysisId, setUrlAnalysisId] = useState<string | null>(analysisId ?? null);
  /** D-PICK: an existing analysis chosen explicitly takes the place of this session's SUCCEEDED one (as a reload of the URL would
   *  show it) until the next run is submitted. */
  const [analysisPicked, setAnalysisPicked] = useState(false);
  useEffect(() => { if (jobState === "SUBMITTING") setAnalysisPicked(false); }, [jobState]);
  const viewedAnalysisSource = describeAnalysisSource(jobState === "SUCCEEDED" && !analysisPicked ? job.state.resultAnalysisId : null, urlAnalysisId);
  /** SFE job-scope invariant: one selected job for both fields; independent of the observation point (return, field change and pool change keep it). */
  const [jobScope, setJobScope] = useState<JobScope | null>(() => jobScopeFromParams(initialJobScopePoolUploadId, initialJobScopeRoleId));
  const jobScopeValidation = useJobScopeValidation(jobScope);
  /** URL BOUNDARY CLOSURE (owner, 2026-10-15): analysisId → the boundary its job was persisted with → the projection. One rule for
   *  every analysis on view (job result or URL); never guessed from the interface state. */
  const analysisBoundary = useAnalysisBoundary(viewedAnalysisSource.kind === "NONE" ? null : viewedAnalysisSource.analysisId);
  const viewedAnalysisMode: "PERSON" | "PERSON_X_JOB" | null = analysisBoundary.state === "RESOLVED" ? analysisBoundary.value.mode : null;
  /** The pool the analysis was investigated in (its persisted PERSON_X_JOB scope's upload); never the interface's. */
  const analysisPool: string | null = analysisBoundary.state === "RESOLVED" && analysisBoundary.value.mode === "PERSON_X_JOB" ? analysisBoundary.value.jobScopeSelection?.jobPoolUploadId ?? null : null;
  /** The requested field. Job Pool first (owner "JOB POOL FIRST / CAPABILITY GATE"): the Job Field is the ground state; CAPABILITY is
   *  only requested here — it becomes the active field only while the job scope is VALID (`activeFieldFocus`, below). */
  const [fieldFocus, setFieldFocus] = useState<"CAPABILITY" | "FIELD">(initialFieldFocus ?? "FIELD");
  /** Capability gate: PERSON always open (the person needs no job); PERSON × JOB open only for a VALID job scope (a loaded, ACTIVE,
   *  mapped pool and one of its roles); JOB closed (no person). Closed, the Job Field is the active field whatever was requested;
   *  the request is kept, so the field returns to Capability as soon as the gate opens again. */
  const capabilityGateOpen = investigationMode === "PERSON" || (investigationMode === "PERSON_X_JOB" && jobScopeValidation.state === "VALID");
  const activeFieldFocus: "CAPABILITY" | "FIELD" = fieldFocus === "CAPABILITY" && capabilityGateOpen ? "CAPABILITY" : "FIELD";
  /** The Job Field compares an analysis with a pool only in PERSON × JOB, only for an analysis whose persisted boundary is
   *  PERSON_X_JOB, and only with the very pool it was investigated in (GELB legacyJobComparisonPermitted: no comparison across job
   *  scopes, also not with another version of the pool). The role is not a condition (the legacy comparison is pool-wide; the
   *  role-exact one is B2). A PERSON analysis, a boundary still being read, one the server cannot name, or another pool compare
   *  nothing (no misleading matching); the pool is never switched silently. JOB reads no analysis. */
  const comparisonCandidate = investigationMode === "PERSON_X_JOB" && analysisPool !== null;
  // The legacy pool comparison (/matches) is the Job Field's: read only while the Job Field is the active field (owner G1, A-02).
  const jobPoolWorkflow = useJobPoolWorkflow({ analysisId: comparisonCandidate && activeFieldFocus === "FIELD" && viewedAnalysisSource.kind !== "NONE" ? viewedAnalysisSource.analysisId : null, analysisJobPoolUploadId: analysisPool, initialJobPoolUploadId: jobPoolUploadId ?? null });
  const jobComparisonAllowed = investigationMode === "PERSON_X_JOB" && viewedAnalysisSource.kind !== "NONE" && jobPoolWorkflow.selectedJobPoolUploadId !== null
    && legacyJobComparisonPermitted(analysisBoundary.state === "RESOLVED" ? analysisBoundary : null, { analysisId: viewedAnalysisSource.analysisId, jobPoolUploadId: jobPoolWorkflow.selectedJobPoolUploadId });
  const comparisonWithheld: "RESOLVING" | "PERSON" | "UNRESOLVED" | "OTHER_POOL" | null = investigationMode !== "PERSON_X_JOB" || viewedAnalysisSource.kind === "NONE" || jobComparisonAllowed ? null : analysisBoundary.state === "RESOLVING" || analysisBoundary.state === "IDLE" ? "RESOLVING" : viewedAnalysisMode === "PERSON" ? "PERSON" : analysisPool !== null ? (jobPoolWorkflow.selectedJobPoolUploadId === null ? null : "OTHER_POOL") : "UNRESOLVED";
  const jobPoolAnalysisSource = jobComparisonAllowed ? viewedAnalysisSource : describeAnalysisSource(null, null);
  const [observation, setObservation] = useState<SyntxObservation>(() => observationFromParams(initialJobOrganizationId, initialJobRoleId, initialJobRequirementId));
  /** N-1 B-NAV: every decision the user takes here is one history entry (push; several parameters of one action share it); what the
   *  system adds afterwards replaces the entry on view. Back / Forward remount the field from the entry's URL (CareerDemoHistory). */
  const pushUrl = (changes: Record<string, string | readonly string[] | null>) => writeCareerDemoUrl(changes, "push");
  /** The field is always written explicitly (focus=FIELD / focus=CAPABILITY), so a reload reopens the field that was chosen (B-POOL-INITIAL-FOCUS). */
  const FIELD_LEVEL: SyntxObservation = { kind: "FIELD", organizationId: null, roleId: null, requirementId: null, apertureSignId: null };
  const writeObservation = (next: SyntxObservation) => pushUrl({
    jobOrganizationId: next.kind === "FIELD" ? null : next.organizationId,
    jobRoleId: next.kind === "ROLE" || next.kind === "REQUIREMENT" ? next.roleId : null,
    jobRequirementId: next.kind === "REQUIREMENT" ? next.requirementId : null
  });
  /** Field changes since mount: each one is crossed by one calm veil (the shell's transition; none on the first paint). */
  const [fieldSwitches, setFieldSwitches] = useState(0);
  const switchFieldFocus = (next: "CAPABILITY" | "FIELD") => {
    // Capability gate: closed — no VALID job in PERSON × JOB, or the mode JOB — the Capability Field cannot be entered (every path:
    // selector, keys, exit, return).
    if (next === "CAPABILITY" && !capabilityGateOpen) return;
    if (next !== activeFieldFocus) setFieldSwitches(count => count + 1);
    setFieldFocus(next);
    onFieldFocusChange?.(next);
    pushUrl({ focus: next });
    if (next === "CAPABILITY") { setObservation(FIELD_LEVEL); writeObservation(FIELD_LEVEL); }
  };
  /** Selection reorganises the field and is reversible; the observation point is written to the URL (the aperture never is). */
  const observeField = (next: SyntxObservation) => { setObservation(next); writeObservation(next); };
  const selectJobPool = (id: string) => { jobPoolWorkflow.select(id); pushUrl({ jobPoolUploadId: id }); observeField(FIELD_LEVEL); };
  const selectJobScope = (poolRoleId: string) => {
    const uploadId = jobPoolWorkflow.selectedJobPoolUploadId;
    const next = uploadId === null ? null : jobScopeFromParams(uploadId, poolRoleId);
    if (next === null) return;
    setJobScope(next);
    pushUrl({ [JOB_SCOPE_URL_PARAMS.jobPoolUploadId]: next.jobPoolUploadId, [JOB_SCOPE_URL_PARAMS.poolRoleId]: next.poolRoleId });
  };
  /** Owner G-05: the selected job is removed only by this explicit action. Afterwards no job scope is selected: ANALYZE is blocked and
   *  the Capability gate closes (the Job Field stays the field). Staged sources and existing analyses are not touched. */
  const clearJobScope = () => {
    setJobScope(null);
    pushUrl({ [JOB_SCOPE_URL_PARAMS.jobPoolUploadId]: null, [JOB_SCOPE_URL_PARAMS.poolRoleId]: null });
    switchFieldFocus("FIELD");
  };
  /** The shell indicator opens the selected job in the Job Field (its pool selected, the role observed), or the field to choose one. */
  const openJobScope = () => {
    switchFieldFocus("FIELD");
    if (jobScopeValidation.state !== "VALID") return;
    const scope = jobScopeValidation.scope;
    if (jobPoolWorkflow.selectedJobPoolUploadId !== scope.jobPoolUploadId) { jobPoolWorkflow.select(scope.jobPoolUploadId); pushUrl({ jobPoolUploadId: scope.jobPoolUploadId }); }
    observeField({ kind: "ROLE", organizationId: jobScopeValidation.organizationId, roleId: scope.poolRoleId, requirementId: null, apertureSignId: null });
  };
  const jobScopeCopy = t.syntx.jobScope;
  /** The role id is part of the detail: two roles of one organization may carry the same title (GELB F-RF-5). */
  const validJobPresentation: SyntxJobScopePresentation | null = jobScopeValidation.state === "VALID" ? { state: "VALID", label: jobScopeCopy.label, title: jobScopeValidation.roleTitle, detail: [jobScopeValidation.organizationName, jobScopeValidation.poolName, jobScopeValidation.scope.poolRoleId].filter((part): part is string => part !== null && part.length > 0).join(" · ") || null, hint: jobScopeCopy.open } : null;
  /** PERSON uses no job scope: the shell says so (the selected job stays selected, unused, and is named as such). */
  const jobScopePresentation: SyntxJobScopePresentation = investigationMode === "PERSON"
    ? { state: jobScopeValidation.state, used: false, label: jobScopeCopy.labelUnused, title: investigationCopy.personScope, detail: validJobPresentation === null || jobScopeValidation.state !== "VALID" ? null : `${investigationCopy.personScopeKept}${validJobPresentation.title} · ${jobScopeValidation.scope.poolRoleId}`, hint: jobScopeCopy.open }
    : jobScopeValidation.state === "VALID"
    ? { state: "VALID", label: jobScopeCopy.label, title: jobScopeValidation.roleTitle, detail: [jobScopeValidation.organizationName, jobScopeValidation.poolName, jobScopeValidation.scope.poolRoleId].filter((part): part is string => part !== null && part.length > 0).join(" · ") || null, hint: jobScopeCopy.open }
    : jobScopeValidation.state === "CHECKING"
      ? { state: "CHECKING", label: jobScopeCopy.label, title: jobScopeCopy.checking, detail: null, hint: jobScopeCopy.choose }
      : jobScopeValidation.state === "INVALID"
        ? { state: "INVALID", label: jobScopeCopy.label, title: jobScopeCopy.invalid, detail: jobScopeValidation.scope.poolRoleId, hint: jobScopeCopy.choose }
        : { state: "NONE", label: jobScopeCopy.label, title: jobScopeCopy.none, detail: null, hint: jobScopeCopy.choose };
  /** ANALYZE per mode: PERSON needs no job; PERSON × JOB only with a VALID scope (otherwise the owner's sentence stands at the
   *  trigger, verbatim); JOB is no document analysis. */
  const analyzeBlockedMessage = investigationMode === "PERSON" ? null : investigationMode === "JOB" ? investigationCopy.jobNotAnalyzable : jobScopeValidation.state === "VALID" ? null : JOB_SCOPE_REQUIRED_MESSAGE;
  /** SFE::SEMIOTIC_ENTRY_FIX (owner, 2026-10-30): the entry into the Capability Field as ONE field state (field-entry-state.ts) —
   *  a calm sentence, the next context, at most one existing action; never a prohibition. The gate (capabilityGateOpen) and the
   *  mode logic are unchanged: this only names where the field stands. PERSON inside the Capability Field says nothing (T-07). */
  const observedRoleId = observation.kind === "ROLE" || observation.kind === "REQUIREMENT" ? observation.roleId : null;
  const fieldEntry = fieldEntryState({
    mode: investigationMode, gateOpen: capabilityGateOpen, focus: activeFieldFocus, scope: jobScopeValidation.state,
    pools: jobPoolWorkflow.pools.state, poolOpen: jobPoolWorkflow.selectedJobPoolUploadId !== null, roleOpen: observedRoleId !== null
  });
  const entryCopy = t.syntx.entry;
  const capabilityGateCause = fieldEntry === null ? null : gateCauseOf(fieldEntry);
  const capabilityGate: SyntxCapabilityGatePresentation | null = fieldEntry === null ? null : {
    state: capabilityGateCause,
    entry: fieldEntry,
    label: `${investigationCopy.modes[investigationMode]} ${investigationMode === "JOB" ? "·" : "⟶"} ${entryCopy.target}`,
    reason: fieldEntry === "INVALID" && jobScopeValidation.state === "INVALID" ? `${entryCopy.line.INVALID.replace(/\.$/, "")} · ${jobScopeValidation.reason}.` : entryCopy.line[fieldEntry],
    way: entryCopy.next[fieldEntry],
    action: fieldEntry === "PERSON_OPEN" ? { id: "capability", label: entryCopy.action.capability, onActivate: () => switchFieldFocus("CAPABILITY") }
      : fieldEntry === "ROLE_NOT_CHOSEN" && observedRoleId !== null ? { id: "choose-role", label: entryCopy.action.chooseRole, onActivate: () => selectJobScope(observedRoleId) }
      : fieldEntry === "CHECKING" || fieldEntry === "INVALID" ? null
      : { id: "person", label: entryCopy.action.person, onActivate: () => selectInvestigationMode("PERSON") }
  };
  /** The closed controls' tooltip says exactly what the line says (R-05, consistent with the visible state). */
  const capabilityGateTitle = capabilityGate === null || capabilityGate.state === null ? undefined : `${capabilityGate.reason} ${capabilityGate.way}`;
  /** The shell's brand follows the active field: directly on a switch (above), and here when the gate itself moves the field (a job
   *  becoming VALID after a reload with focus=CAPABILITY, or the selected job turning invalid). */
  useEffect(() => { onFieldFocusChange?.(activeFieldFocus); }, [activeFieldFocus]);

  /* PERSON × JOB · the first screen (owner G1, 2026-10-22): analysisId → persisted result → boundary → B2 → one closed state. */
  /** Once an analysis SUCCEEDED its id is written to the URL with the interface's mode (§03.1). The interface's mode, not the one the
   *  run was declared with: a mode chosen during the run stays chosen, and the session and a reload show the same (GELB F-RF-1). */
  useEffect(() => {
    if (jobState !== "SUCCEEDED" || !job.state.resultAnalysisId) return;
    // A release is given for one analysis (RD-PANEL): a new analysis on view starts without released pools.
    writeCareerDemoUrl({ analysisId: job.state.resultAnalysisId, [INVESTIGATION_URL_PARAM]: investigationMode, [ANALYSIS_JOB_URL_PARAM]: null, [DISCOVERY_POOLS_URL_PARAM]: null, [ROLE_INVESTIGATION_URL_PARAM]: null }, "replace");
    setUrlAnalysisId(job.state.resultAnalysisId);
    setDiscoveryPools(null);
  }, [jobState, job.state.resultAnalysisId]);
  /** The session's own result (M-01) has precedence; it is decoded exactly like a reload's. */
  const sessionResult = React.useMemo(
    () => viewedAnalysisSource.kind === "JOB_RESULT" && job.state.canonicalAnalysis ? decodeAnalysisResult(job.state.canonicalAnalysis, viewedAnalysisSource.analysisId) : null,
    [viewedAnalysisSource.kind, viewedAnalysisSource.kind === "NONE" ? null : viewedAnalysisSource.analysisId, job.state.canonicalAnalysis]
  );
  /** Reload or deep link: the same route read again (GET), only while no session result is on view and the mode reads analyses. */
  const persistedResult = useAnalysisResult(sessionResult === null && investigationMode !== "JOB" && viewedAnalysisSource.kind !== "NONE" ? viewedAnalysisSource.analysisId : null);
  const resultState: AnalysisResultState = sessionResult === null ? persistedResult : sessionResult.ok ? { state: "AVAILABLE", result: sessionResult.result } : { state: "FAILED", code: sessionResult.code };
  const firstScreenInput = {
    mode: investigationMode,
    analysisId: viewedAnalysisSource.kind === "NONE" ? null : viewedAnalysisSource.analysisId,
    result: resultState,
    boundary: analysisBoundary,
    selection: jobScopeValidation.state === "VALID" ? jobScopeValidation.scope : null,
    pendingSelection: jobScopeValidation.state === "CHECKING" ? { state: "CHECKING" as const, scope: jobScopeValidation.scope } : jobScopeValidation.state === "INVALID" ? { state: "INVALID" as const, scope: jobScopeValidation.scope, reason: jobScopeValidation.reason } : null
  };
  /** B2 is read only on the Capability Field, in PERSON × JOB, for the analysis's own selected job (P-01); with the existing hook. */
  const coverageRequest = activeFieldFocus === "CAPABILITY" ? firstScreenCoverageRequest(firstScreenInput) : null;
  const firstScreenCoverage = useSelectedRoleCoverage(coverageRequest?.analysisId ?? null, coverageRequest?.scope ?? null);
  const firstScreen = projectPxjFirstScreen({ ...firstScreenInput, coverage: firstScreenCoverage });
  /** RD-PANEL: role discovery belongs to the PERSON result on view (its boundary resolved PERSON, its result read) — while that
   *  result is loading, missing or of another mode, the first screen speaks and nothing is discovered; the pools are released for
   *  that analysis only. */
  const discoveryAnalysisId = investigationMode === "PERSON" && firstScreen.state === "PERSON_RESULT" ? firstScreen.analysisId : null;
  /** RI-START: "re-read the plan" is the user's explicit second GET of the same release (after a run or a changed call count). */
  const [discoveryRevision, setDiscoveryRevision] = useState(0);
  const roleDiscovery = useRoleDiscovery(discoveryAnalysisId, discoveryPools, undefined, discoveryRevision);
  /** RI-START: the semantic check of picked roles — one POST per click of START, never by a load, an open or a reload; a named
   *  roleInvestigationId is read again by GET only (RI-URL, NAV ≡ RELOAD). */
  const semanticInvestigation = useSemanticInvestigation(discoveryAnalysisId, discoveryPools, roleInvestigationId);
  const startSemanticInvestigation = (roles: InvestigationRoleKey[], confirmedCalls: number) => {
    void semanticInvestigation.start(roles, confirmedCalls).then(result => {
      if (result?.state === "STORED") { setRoleInvestigationId(result.investigation.investigationId); writeCareerDemoUrl({ [ROLE_INVESTIGATION_URL_PARAM]: result.investigation.investigationId }, "replace"); }
    });
  };
  // F-RI-1 / O-RI-1 (PINK §3.76): once a stored investigation is known — from this START or from the GET on mount/reload — the
  // plan is read again once for that id, so its numbers are never the pre-run ones beside a completed/partial status.
  const storedSemanticInvestigationId = semanticInvestigation.state.state === "STORED" ? semanticInvestigation.state.investigation.investigationId : null;
  useEffect(() => {
    if (storedSemanticInvestigationId !== null) setDiscoveryRevision(previous => previous + 1);
  }, [storedSemanticInvestigationId]);
  /** D-PICK (UX-05): in PERSON × JOB with a valid selected job, at NO_ANALYSIS on the first screen and at the selected job's role in
   *  the Job Field; V-06: also when the analysis on view is not found (a way out besides Back). Read only while opened there (GET only); chosen only by the explicit OPEN — one push of analysisId (from the role
   *  view with focus=CAPABILITY, one decision), never by itself. Opening runs the first screen's B2 checks unchanged. */
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerSelection = investigationMode === "PERSON_X_JOB" && jobScopeValidation.state === "VALID" ? jobScopeValidation.scope : null;
  const pickerAtRole = activeFieldFocus === "FIELD" && pickerSelection !== null && (observation.kind === "ROLE" || observation.kind === "REQUIREMENT") && observation.roleId === pickerSelection.poolRoleId && jobPoolWorkflow.selectedJobPoolUploadId === pickerSelection.jobPoolUploadId;
  const pickerPlace: "first-screen" | "role-view" | null = pickerSelection === null ? null : activeFieldFocus === "CAPABILITY" && (firstScreen.state === "NO_ANALYSIS" || firstScreen.state === "RESULT_NOT_FOUND") ? "first-screen" : pickerAtRole ? "role-view" : null;
  const pickerState = useAnalysisPicker(pickerOpen && pickerPlace !== null, investigationMode, pickerSelection);
  const pickAnalysis = (picked: string) => {
    const fromRole = pickerPlace === "role-view";
    setUrlAnalysisId(picked);
    setAnalysisPicked(true);
    setPickerOpen(false);
    pushUrl({ analysisId: picked, [DISCOVERY_POOLS_URL_PARAM]: null, [ROLE_INVESTIGATION_URL_PARAM]: null });
    setDiscoveryPools(null);
    setRoleInvestigationId(null);
    if (fromRole) switchFieldFocus("CAPABILITY");
  };
  const analysisPicker = (place: "first-screen" | "role-view") => pickerPlace !== place ? undefined : (
    <AnalysisPicker
      place={place}
      state={pickerState}
      open={pickerOpen}
      onToggle={() => setPickerOpen(value => !value)}
      onPick={pickAnalysis}
      locale={locale}
      job={jobScopeValidation.state === "VALID" ? { poolName: jobScopeValidation.poolName, roleTitle: jobScopeValidation.roleTitle } : null}
      onViewAnalysisId={viewedAnalysisSource.kind === "NONE" ? null : viewedAnalysisSource.analysisId}
    />
  );
  /** Whether this analysis is on the Capability Field at all: only in the states that show its proposals. */
  const shownResult = showsAnalysis(firstScreen) ? firstScreen.result : null;
  /** The orbits count as projected (empty-projection presentation, attention, clusters) when this analysis is on the field, or, as
   *  before G1, after a SUCCEEDED job that names no analysis (the field's own data). Never while a state withholds the analysis. */
  const resultOnView = shownResult !== null || (jobState === "SUCCEEDED" && firstScreen.state === "NO_ANALYSIS");
  /** Q1: under PERSON × JOB the legacy orbits (03 resonance, 04 roles, 05 tension, 06 evolution) are not shown: no orbit, count, HUD
   *  action, coupling line, inspector node or text. A focus requested on one of them is not shown either.
   */
  const legacyHidden = investigationMode === "PERSON_X_JOB";
  const legacyStage = (stageId: string | null) => legacyHidden && stageId !== null && ["03", "04", "05", "06"].includes(stageId);
  const stageMasked = legacyStage(requestedStageId);
  const activeStageId = stageMasked ? null : requestedStageId;
  const hoveredStageId = legacyStage(requestedHoverStageId) ? null : requestedHoverStageId;
  const zoomLevel: SemanticZoomLevel = stageMasked ? 0 : requestedZoomLevel;
  const selectedClusterId = stageMasked ? null : requestedClusterId;
  const activeData = React.useMemo(() => {
    const shown = canonicalSilPresentation !== null || shownResult === null ? data : legacyHidden ? withoutLegacyOrbits(demoStateFromResult(shownResult)) : demoStateFromResult(shownResult);
    // §07: a placeholder is named as one (title / hash not delivered), never shown as a title or a hash; in every mode.
    return { ...shown, sources: presentSourcePlaceholders(shown.sources, { title: t.pxjFirst.titleNotDelivered, hash: t.pxjFirst.hashNotDelivered }) };
  }, [data, canonicalSilPresentation, shownResult, legacyHidden, t]);
  const focusedOrbitPresentation =
    resultOnView
      ? resolveSilFocusedOrbitPresentation(
          activeStageId,
          zoomLevel,
          activeData,
          locale
        )
      : null;
  /** RD-HANDOVER ("Gezielt untersuchen"): the discovered role becomes the selected job and the investigation PERSON × JOB, as one
   *  push. No analysis is carried over (analysisId leaves the URL, the session's result steps back as after an explicit choice), the
   *  release ends with its analysis, nothing is started: PERSON × JOB then shows NO_ANALYSIS for exactly this role (D-PICK / ANALYZE). */
  const investigateDiscoveredRole = (scope: JobScope) => {
    setJobScope(scope);
    setInvestigationMode("PERSON_X_JOB");
    setUrlAnalysisId(null);
    setAnalysisPicked(true);
    setDiscoveryPools(null);
    setRoleInvestigationId(null);
    setDiscoveryOpen(false);
    pushUrl({ [JOB_SCOPE_URL_PARAMS.jobPoolUploadId]: scope.jobPoolUploadId, [JOB_SCOPE_URL_PARAMS.poolRoleId]: scope.poolRoleId, [INVESTIGATION_URL_PARAM]: "PERSON_X_JOB", analysisId: null, [DISCOVERY_POOLS_URL_PARAM]: null, [ROLE_INVESTIGATION_URL_PARAM]: null });
  };
  /** ROLE_MISMATCH offers the analysis's own job as an explicit choice; the selection changes only by this action. */
  const selectAnalysisJob = (scope: JobScope) => {
    setJobScope(scope);
    pushUrl({ [JOB_SCOPE_URL_PARAMS.jobPoolUploadId]: scope.jobPoolUploadId, [JOB_SCOPE_URL_PARAMS.poolRoleId]: scope.poolRoleId });
  };
  const [inferenceTelemetry, setInferenceTelemetry] = useState<any>(initialAnalysisState?.inferenceTelemetry ?? null);
  const [lastStagedDocs, setLastStagedDocs] = useState<any[]>([]);
  /** DLL-full path review point 3: SourceDock owns its own staged-file state; a drop on the identity core reaches the same
   *  intake (stageFile) this ref exposes — no new validation, the exact path the file button already uses. */
  const sourceDockRef = React.useRef<SourceDockHandle>(null);
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    let active = true;
    if (!canonicalSilAssociationId) {
      setCanonicalSilPresentation(null);
      return () => { active = false; };
    }
    void fetch(`/api/career/canonical-sil/${encodeURIComponent(canonicalSilAssociationId)}`)
      .then(async response => response.ok ? response.json() : null)
      .then(payload => {
        const presentation = payload && typeof payload === "object"
          ? decodeCanonicalSilFrontendPresentation(Reflect.get(payload, "canonicalSil"))
          : null;
        if (active) setCanonicalSilPresentation(presentation);
      })
      .catch(() => { if (active) setCanonicalSilPresentation(null); });
    return () => { active = false; };
  }, [canonicalSilAssociationId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const seen = localStorage.getItem("condyn_onboarding_seen");
        if (!seen) {
          setIsOnboardingOpen(true);
        }
      } catch (err) {}
    }
  }, []);

  useEffect(() => {
    if (canonicalSilPresentation === null && job.state.state === "SUCCEEDED" && job.state.canonicalAnalysis) {
      const canonical = job.state.canonicalAnalysis;
      if (canonical.inferenceTelemetry) {
        setInferenceTelemetry(canonical.inferenceTelemetry);
      }
      // The Capability Field's data follows the first screen's state (above): the session's result passes the same decoder and
      // adapters as a reload's (adaptCanonicalToDemoState, then the F11 proposal overlay), and is not shown where its state says no.
    }
  }, [job.state.state, job.state.canonicalAnalysis, canonicalSilPresentation]);

  const handleHudAction = (action: "OPEN EVIDENCE" | "INSPECT SOURCES" | "VIEW MATCHES", stageId: string) => {
    // No legacy matching in PERSON × JOB (Q1): the action is not rendered there, and not acted on either.
    if (legacyHidden && (action === "VIEW MATCHES" || legacyStage(stageId))) return;
    setActiveStageId(stageId);

    if (stageId !== "02") {
      const items = buildOrbitFocusProjection(stageId, activeData);
      const firstItem = items[0];
      if ((action === "OPEN EVIDENCE" || action === "INSPECT SOURCES") && firstItem) {
        setSelectedClusterId(firstItem.id);
        setZoomLevel(2);
      } else {
        setSelectedClusterId(null);
        setZoomLevel(1);
      }
      return;
    }

    if (action === "OPEN EVIDENCE" || action === "INSPECT SOURCES") {
      const firstClusterId = resolveSilHudClusterId(stageId, activeData);

      if (firstClusterId === null) {
        setSelectedClusterId(null);
        setZoomLevel(1);
        return;
      }

      setSelectedClusterId(firstClusterId);
      setZoomLevel(2);
    } else if (action === "VIEW MATCHES") {
      setZoomLevel(1);
      setSelectedClusterId(null);
    }
  };

  const handleAnalyze = async (stagedDocs: any[]) => {
    // SFE invariant: no execution without an explicit investigation boundary — PERSON, or PERSON × JOB with a VALID selected job; JOB
    // is no document analysis (the controller re-checks the payload).
    const declared = declareAnalysis(investigationMode, jobScopeValidation);
    if (!declared.ok) return;
    setLastStagedDocs(stagedDocs);
    const documentsPayload = stagedDocs.map((doc) => {
      if (doc.type === "pdf") {
        return { type: "pdf", content: doc.content, title: doc.title, docId: doc.id };
      }
      if (doc.type === "github" || doc.type === "website") {
        return { type: doc.type, url: doc.url, title: doc.title, docId: doc.id };
      }
      return { type: "text", content: doc.content, title: doc.title, docId: doc.id };
    });

    job.submitAnalysis({ documents: documentsPayload, ...declared.declaration });
  };

  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(null);

  const evidenceGraph = React.useMemo(() => {
    return buildEvidenceGraph({
      structured_data: excludeCapabilityProposalsFromEvidenceGraph(activeData)
    }, []);
  }, [activeData]);

  const sourcePresentation = React.useMemo(() => {
    return buildSilSourcePresentation(activeData);
  }, [activeData]);

  const graphFocus = React.useMemo(() => {
    if (!selectedGraphNodeId) return null;
    return computeGraphFocus(evidenceGraph, selectedGraphNodeId);
  }, [evidenceGraph, selectedGraphNodeId]);

  const canonicalRegionsByStage: Readonly<Record<string, CanonicalSilFrontendRegionName>> = {
    "01": "identity", "02": "capability", "03": "resonance", "04": "role", "05": "tension", "06": "evolution",
  };
  const canonicalRegionForStage = (stageId: string): CanonicalSilFrontendRegionName | null => canonicalRegionsByStage[stageId] ?? null;
  const canonicalStage = (stageId: string) => {
    const name = canonicalRegionForStage(stageId);
    return name === null || canonicalSilPresentation === null ? null : canonicalSilPresentation.regions[name];
  };
  const canonicalDisplayState = (stageId: string): "AVAILABLE" | "EMPTY" | "NOT_PRODUCED" | "UNKNOWN" | "FAILED" | "PRE_CANONICAL" => canonicalStage(stageId)?.state ?? "PRE_CANONICAL";
  const stages = [
    {
      stageId: "01",
      stageName: t.orbits["01"].name,
      subtitle: t.orbits["01"].subtitle,
      count: canonicalStage("01")?.count ?? activeData.sources.length,
      glyph: "◈",
      angleDeg: -90,
      color: "#38e5ff",
      animationDelay: "0s",
      photonOutDur: "3.6s",
      photonInDur: "4.4s",
      previewItems: canonicalStage("01")?.artifactIds.slice(0, 3) ?? activeData.sources.slice(0, 3).map((s) => s.sourceTitle || (s as any).name || "Source document"),
      canonicalState: canonicalDisplayState("01")
    },
    {
      stageId: "02",
      stageName: t.orbits["02"].name,
      subtitle: t.orbits["02"].subtitle,
      count: canonicalStage("02")?.count ?? activeData.capabilities.length,
      glyph: "⬡",
      angleDeg: -30,
      color: "#00ffd5",
      animationDelay: "-4s",
      photonOutDur: "4.2s",
      photonInDur: "5.0s",
      previewItems: canonicalStage("02")?.artifactIds.slice(0, 3) ?? activeData.capabilities.slice(0, 3).map((c) => c.name),
      canonicalState: canonicalDisplayState("02")
    },
    {
      stageId: "03",
      stageName: t.orbits["03"].name,
      subtitle: t.orbits["03"].subtitle,
      count: canonicalStage("03")?.count ?? activeData.companyMatches.length,
      glyph: "◎",
      angleDeg: 30,
      color: "#6b8eff",
      animationDelay: "-8s",
      photonOutDur: "4.8s",
      photonInDur: "5.6s",
      previewItems: canonicalStage("03")?.artifactIds.slice(0, 3) ?? activeData.companyMatches.slice(0, 3).map((c) => c.organizationName),
      canonicalState: canonicalDisplayState("03")
    },
    {
      stageId: "04",
      stageName: t.orbits["04"].name,
      subtitle: t.orbits["04"].subtitle,
      count: canonicalStage("04")?.count ?? activeData.roleMatches.length,
      glyph: "⎔",
      angleDeg: 90,
      color: "#b87fff",
      animationDelay: "-12s",
      photonOutDur: "3.9s",
      photonInDur: "4.7s",
      previewItems: canonicalStage("04")?.artifactIds.slice(0, 3) ?? activeData.roleMatches.slice(0, 3).map((r) => r.roleTitle),
      canonicalState: canonicalDisplayState("04")
    },
    {
      stageId: "05",
      stageName: t.orbits["05"].name,
      subtitle: t.orbits["05"].subtitle,
      count: canonicalStage("05")?.count ?? activeData.capabilityGaps.length,
      glyph: "⟁",
      angleDeg: 150,
      color: "#ff7c5c",
      animationDelay: "-16s",
      photonOutDur: "4.5s",
      photonInDur: "5.3s",
      previewItems: canonicalStage("05")?.artifactIds.slice(0, 3) ?? activeData.capabilityGaps.slice(0, 3).map((g) => g.capabilityName),
      canonicalState: canonicalDisplayState("05")
    },
    {
      stageId: "06",
      stageName: t.orbits["06"].name,
      subtitle: t.orbits["06"].subtitle,
      count: canonicalStage("06")?.count ?? activeData.nextActions.length,
      glyph: "∿",
      angleDeg: 210,
      color: "#38ff8b",
      animationDelay: "-20s",
      photonOutDur: "5.1s",
      photonInDur: "6.0s",
      previewItems: canonicalStage("06")?.artifactIds.slice(0, 3) ?? activeData.nextActions.slice(0, 3).map((a) => a.title),
      canonicalState: canonicalDisplayState("06")
    }
  ].filter((stage) => !legacyStage(stage.stageId));

  const radius = 330;
  const center = 400;
  const focusedStageId = hoveredStageId || activeStageId;

  const activeStageObj = stages.find((s) => s.stageId === activeStageId);
  const activeAngleRad = activeStageObj ? (activeStageObj.angleDeg * Math.PI) / 180 : 0;
  const activeOrbitX = Math.cos(activeAngleRad) * radius;
  const activeOrbitY = Math.sin(activeAngleRad) * radius;

  let cameraScale = 1;
  let cameraTranslateX = 0;
  let cameraTranslateY = 0;

  const orbitItems = React.useMemo(
    () => buildOrbitFocusProjection(activeStageId, activeData),
    [activeStageId, activeData]
  );
  const isCapabilityCosmosFocus = activeStageId === "02" && zoomLevel === 1;
  const isCapabilityDeepFocus = activeStageId === "02" && zoomLevel >= 2 && selectedClusterId !== null;
  const isOrbitCosmosFocus = activeStageId !== null && zoomLevel === 1;
  const isOrbitDeepFocus = activeStageId !== null && zoomLevel >= 2 && selectedClusterId !== null;
  const isOrbitStageFocus = isOrbitCosmosFocus || isOrbitDeepFocus;
  const hasFocusedEmptyProjection =
    focusedOrbitPresentation?.kind === "EMPTY_PROJECTION";

  const subClusters = buildSilClusterPresentation(
    activeStageId,
    resultOnView,
    sourcePresentation,
    activeData
  );

  return (
    <div
      data-testid="semantic-career-intelligence-field"
      data-zoom-level={zoomLevel}
      data-focused-stage-id={activeStageId || ""}
      data-sil-mode={canonicalSilPresentation?.mode ?? "PRE_CANONICAL_DISCOVERY"}
      data-hr-decision-loop-context={careerDecisionContextRevisionId ?? ""}
      data-job-pool-upload={jobPoolUploadId ?? ""}
      data-field-focus={activeFieldFocus}
      data-capability-gate={capabilityGateOpen ? "OPEN" : investigationMode === "JOB" ? "JOB_MODE" : "AWAITING_JOB"}
      data-investigation-mode={investigationMode}
      data-camera-scale={cameraScale}
      onClick={() => {
        if (graphFocus) {
          setSelectedGraphNodeId(null);
        }
      }}
      style={{
        backgroundColor: SIL_TOKENS.colors.void,
        color: SIL_TOKENS.colors.textPrimary,
        minHeight: "960px",
        height: "100vh",
        width: "100%",
        fontFamily: SIL_TOKENS.typography.mono,
        position: "relative",
        overflow: "hidden"
      }}
    >

      {/* Phase 3c: Floating Mini-HUD Camera Instrument at top center */}
      <div
        data-testid="semantic-zoom-telemetry"
        className="semantic-zoom-telemetry--core"
        style={{
          position: "absolute",
          top: "-46px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 40,
          maxWidth: "560px",
          width: "max-content",
          backgroundColor: "rgba(6, 14, 24, 0.65)",
          border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
          boxShadow: `0 0 16px rgba(56, 229, 255, 0.22)`,
          backdropFilter: "blur(10px)",
          borderRadius: "16px",
          padding: "6px 14px",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}
      >
        {[
          { level: 0 as SemanticZoomLevel, label: "L0", title: "PLANETARIUM", isEnabled: true },
          { level: 1 as SemanticZoomLevel, label: "L1", title: "CLUSTER", isEnabled: activeStageId !== null },
          { level: 2 as SemanticZoomLevel, label: "L2", title: "EVIDENCE", isEnabled: selectedClusterId !== null },
          { level: 3 as SemanticZoomLevel, label: "L3", title: "SOURCE", isEnabled: false },
          { level: 4 as SemanticZoomLevel, label: "L4", title: "ORIGINAL", isEnabled: false }
        ].map((item, idx) => {
          const isCurrent = zoomLevel === item.level;
          return (
            <React.Fragment key={item.level}>
              {idx > 0 && <span style={{ color: "rgba(56, 229, 255, 0.3)", fontSize: "10.5px" }}>●──</span>}
              <button
                suppressHydrationWarning
                type="button"
                disabled={item.isEnabled ? undefined : true}
                aria-current={isCurrent ? "step" : undefined}
                aria-disabled={item.isEnabled ? undefined : true}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!item.isEnabled) return;
                  if (item.level === 0) {
                    setZoomLevel(0);
                    setActiveStageId(null);
                    setSelectedClusterId(null);
                  } else {
                    if (item.level === 1 && activeStageId !== null) {
                      setSelectedClusterId(null);
                      setSelectedGraphNodeId(null);
                    }
                    setZoomLevel(item.level);
                  }
                }}
                style={{
                  background: isCurrent ? "rgba(56, 229, 255, 0.22)" : "transparent",
                  border: isCurrent ? `1px solid ${SIL_TOKENS.colors.cyanActive}` : "1px solid transparent",
                  borderRadius: "8px",
                  color: isCurrent ? "#ffffff" : item.isEnabled ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.35)",
                  cursor: item.isEnabled ? "pointer" : "not-allowed",
                  padding: "3px 8px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  fontFamily: SIL_TOKENS.typography.mono,
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease"
                }}
              >
                {`${item.label} ${item.title}`}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Left Compact SourceDock */}
      <div style={{
        position: "absolute",
        top: "50%",
        transform: isOrbitStageFocus ? "translateY(-50%) scale(0.72)" : "translateY(-50%) scale(1)",
        left: "40px",
        zIndex: 30,
        opacity: isOrbitStageFocus ? 0.12 : 1,
        filter: isOrbitStageFocus ? "blur(3px)" : undefined,
        pointerEvents: isOrbitStageFocus ? "none" : "auto",
        transition: "transform 0.62s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.56s ease, filter 0.56s ease"
      }}>
        <SourceDock ref={sourceDockRef} onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} locale={locale} analyzeBlockedMessage={analyzeBlockedMessage} investigation={{ mode: investigationMode, label: `${investigationCopy.group} · ${investigationCopy.modes[investigationMode]}`, hint: investigationCopy.hints[investigationMode] }} />
      </div>

      {/* Telemetry Ingestion Status Banner */}
      {isAnalyzing && (
        <div
          data-testid="intake-telemetry-banner"
          style={{
            position: "absolute",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(10, 14, 20, 0.92)",
            border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
            borderRadius: "8px",
            padding: "8px 16px",
            color: SIL_TOKENS.colors.cyanActive,
            fontFamily: SIL_TOKENS.typography.mono,
            fontSize: "12px",
            zIndex: 100,
            boxShadow: "0 0 20px rgba(56, 229, 255, 0.35)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <span style={{ animation: "atmosphereGlow 1.5s infinite" }}>●</span>
          <span>INTAKE TELEMETRY // STEP: {jobState === "PENDING" ? "QUEUED" : (jobState === "RUNNING" ? "ANALYZING SOURCES..." : jobState.toUpperCase())}</span>
        </div>
      )}

      {analysisSuccess && (
        <div
          data-testid="intake-success-banner"
          style={{
            position: "absolute",
            bottom: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(10, 24, 20, 0.95)",
            border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
            borderRadius: "8px",
            padding: "10px 18px",
            color: SIL_TOKENS.colors.cyanActive,
            fontFamily: SIL_TOKENS.typography.mono,
            fontSize: "12px",
            zIndex: 100,
            boxShadow: "0 0 24px rgba(56, 229, 255, 0.4)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px"
          }}
        >
          <div style={{ fontWeight: 700 }}>{t.analysis.successTitle}</div>
          <div style={{ fontSize: "11.5px", color: SIL_TOKENS.colors.textPrimary }}>
            {t.analysis.successSubtitle}
          </div>
          {viewedAnalysisMode !== null && <div data-testid="intake-success-investigation" data-investigation-mode={viewedAnalysisMode} style={{ fontSize: "11px", letterSpacing: "1.2px", color: "rgba(196, 236, 248, 0.86)" }}>{investigationCopy.result[viewedAnalysisMode]}{analysisBoundary.state === "RESOLVED" && analysisBoundary.value.jobScopeSelection !== null ? ` · ${analysisBoundary.value.jobScopeSelection.poolRoleId}` : ""}</div>}
        </div>
      )}

      {analysisError && !jobBannerDismissed && (() => {
        const errData = { status: analysisError.status, issues: [{ code: analysisError.code, message: analysisError.message }] };
        const scopeFailure = isJobScopeErrorCode(analysisError.code);
        const boundaryFailure = isInvestigationErrorCode(analysisError.code);
        /** N-2: a job the URL named that the server does not know is its own state; nothing is restarted or guessed. */
        const jobNotFound = resumedJobOnView && analysisError.status === 404;
        const navigationCopy = NAVIGATION_COPY[locale];
        /** V-08: a source the worker cannot parse fails the same way on every retry: no RETRY, the way to a readable source instead. */
        const formatFailure = isPdfParseFailure(analysisError.code, analysisError.message);

        return (
        <div
          data-testid="intake-error-banner"
          data-error-code={analysisError.code ?? ""}
          data-http-status={analysisError.status ?? ""}
          data-job-resume={resumedJobOnView ? (jobNotFound ? "NOT_FOUND" : "FAILED") : undefined}
          style={{
            position: "absolute",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(26, 9, 11, 0.96)",
            border: "1px solid #ff3333",
            borderRadius: "8px",
            padding: "16px 24px",
            color: "#ff5555",
            fontFamily: SIL_TOKENS.typography.mono,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "0 0 30px rgba(255, 51, 51, 0.25)",
            maxWidth: "600px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "18px" }}>
            <div style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "1px" }}>
              {jobNotFound ? navigationCopy.jobNotFoundTitle : scopeFailure ? t.analysis.jobScopeTitle : boundaryFailure ? t.analysis.investigationTitle : errData.status === 422 ? "SEMANTIC BOUNDARY VIOLATION" : errData.status === 503 ? "PROVIDER TRUNCATION" : t.analysis.failed}
            </div>
            {errData.status !== null && <div style={{ fontSize: "11.5px", color: "rgba(255, 85, 85, 0.7)" }}>HTTP {errData.status}</div>}
          </div>
          
          <div style={{ fontSize: "12px", color: "#ffbaba", lineHeight: "1.5" }}>
            {jobNotFound && navigationCopy.jobNotFound}
            {!jobNotFound && !scopeFailure && !boundaryFailure && errData.status === 422 && t.analysis.semanticBoundary}
            {!scopeFailure && !boundaryFailure && errData.status === 503 && t.analysis.providerTruncation}
          </div>

          <div style={{ maxHeight: "150px", overflowY: "auto", borderTop: "1px solid rgba(255, 51, 51, 0.3)", paddingTop: "8px", marginTop: "4px" }}>
            {errData.issues.map((issue: any, i: number) => (
              <div key={i} style={{ fontSize: "11.5px", marginBottom: "6px", display: "flex", gap: "8px" }}>
                <span style={{ color: "#ff3333" }}>•</span>
                <div>
                  {issue.code && <strong style={{ color: "#ff3333", display: "block" }}>[{issue.code}]</strong>}
                  <span style={{ color: "#ff8888" }}>{issue.message}</span>
                </div>
              </div>
            ))}
          </div>

          {resumedJobOnView && <div data-testid="intake-error-job-id" style={{ fontSize: "11.5px", color: "#ffbaba" }}>{navigationCopy.jobIdLabel} · {resumedJobId}</div>}
          {resumedJobOnView && <button type="button" data-testid="intake-error-dismiss" onClick={() => { setDismissedJobId(resumedJobId); writeCareerDemoUrl({ [ANALYSIS_JOB_URL_PARAM]: null }, "push"); }} style={{ alignSelf: "flex-end", padding: "6px 14px", borderRadius: "6px", border: "1px solid rgba(255, 186, 186, 0.6)", background: "transparent", color: "#ffbaba", fontFamily: SIL_TOKENS.typography.mono, fontSize: "11.5px", fontWeight: 700, letterSpacing: "1px", cursor: "pointer" }}>× {navigationCopy.dismiss}</button>}

          {/* A job followed from the URL has no staged sources in this mount: no retry here (no POST, no second job). */}
          {!resumedJobOnView && formatFailure && <div data-testid="intake-error-format" role="note" style={{ fontSize: "12px", lineHeight: 1.5, color: "#ffc46b" }}>{navigationCopy.formatFailure}</div>}
          {!resumedJobOnView && !formatFailure && <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", marginTop: "8px" }}>
            {analyzeBlockedMessage !== null && <span data-testid="retry-job-scope-required" role="status" style={{ fontSize: "12px", fontWeight: 700, color: "#ffc46b" }}>{analyzeBlockedMessage}</span>}
            <button
              data-testid="retry-intake-btn"
              disabled={analyzeBlockedMessage !== null}
              onClick={() => handleAnalyze(lastStagedDocs)}
              style={{
                padding: "8px 16px",
                opacity: analyzeBlockedMessage !== null ? 0.4 : 1,
                backgroundColor: "#ff3333",
                color: "#0a0e14",
                border: "none",
                borderRadius: "4px",
                fontWeight: 800,
                fontSize: "12px",
                cursor: analyzeBlockedMessage !== null ? "not-allowed" : "pointer",
                letterSpacing: "1px",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#ff5555"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#ff3333"}
            >
              {t.analysis.retry}
            </button>
          </div>}
        </div>
      );})()}

      <div style={{
                opacity: isOrbitStageFocus ? 0.12 : 1,
                filter: isOrbitStageFocus ? "blur(3px)" : undefined,
                pointerEvents: isOrbitStageFocus ? "none" : "auto",
        transition: "opacity 0.56s ease, filter 0.56s ease"
      }}>
        <InferenceTelemetryHUD
          telemetry={inferenceTelemetry}
          isAnalyzing={isAnalyzing}
          locale={locale}
          runtimeProgress={showsRuntimeTelemetry ? {
            lifecycleState: jobState,
            currentOperation: runtimePresentationOperation,
            attemptCount: job.state.attemptCount
          } : null}
        />
      </div>

      <div style={{
                opacity: isOrbitStageFocus ? 0.12 : 1,
                filter: isOrbitStageFocus ? "blur(3px)" : undefined,
                pointerEvents: isOrbitStageFocus ? "none" : "auto",
        transition: "opacity 0.56s ease, filter 0.56s ease"
      }}>
        <DecisionGraphInspector
          graph={evidenceGraph}
          focus={graphFocus}
          locale={locale}
          onSelectNode={(id) => setSelectedGraphNodeId(id)}
        />
      </div>

      {/* Center Radial Organism Field */}
      <style>{`
        @keyframes fieldFocusSwitchBreath { 0%, 100% { box-shadow: 0 0 12px rgba(56, 229, 255, 0.18); } 50% { box-shadow: 0 0 22px rgba(56, 229, 255, 0.45); } }
        @media (prefers-reduced-motion: reduce) { [data-testid="field-focus-strip"] button { animation: none !important; } }
        /* Exactly one field: with the Job Field selected the Capability Field is hidden entirely (kept mounted — no state lost);
           the application shell (selector, top controls, guide, HR dock, codex, onboarding) stays. */
        [data-testid="semantic-career-intelligence-field"][data-field-focus="FIELD"] > :not([data-sx-shell]):not([data-sx-field="job"]):not([data-testid="guided-onboarding-overlay"]):not([data-testid="system-codex-modal-backdrop"]):not(style) { visibility: hidden !important; }
        @keyframes rotateClockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes rotateCounterClockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
      `}</style>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "800px",
          height: "800px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translate(calc(-50% + ${cameraTranslateX}px), calc(-50% + ${cameraTranslateY}px)) scale(${cameraScale})`,
          transition: "transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: 5
        }}
      >
        {/* SVG Energy Flow Overlay connecting core to orbitals */}
            <svg
              data-testid="resonance-energy-paths"
              width="800"
              height="800"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
                zIndex: 1,
                opacity: isOrbitStageFocus ? 0.18 : 1,
                filter: isOrbitStageFocus ? "blur(2px)" : undefined,
                transition: "opacity 0.72s cubic-bezier(0.16, 1, 0.3, 1), filter 0.72s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            >
              <SyntxPlanetariumBackdrop center={center} radius={radius} glowOpacity={focusedStageId ? "0.32" : "0.22"} />

              {/* Phase 2d: Inter-Orbital Coupling weighted relationships */}
              {!legacyHidden && <g data-testid="inter-orbital-coupling">
                <path
                  d="M 565 685.79 Q 540 320 235 685.79"
                  fill="none"
                  stroke={SIL_TOKENS.colors.cyanActive}
                  strokeWidth="2.2"
                  strokeDasharray="6 4"
                  opacity="0.45"
                />
                <path
                  d="M 70 400 Q 290 520 565 114.21"
                  fill="none"
                  stroke="rgba(56, 229, 255, 0.22)"
                  strokeWidth="1.2"
                  strokeDasharray="3 5"
                />
              </g>}

              {/* Energy Rays Connecting Core to Each Orbital Node */}
              {stages.map((st) => {
                const angleRad = (st.angleDeg * Math.PI) / 180;
                const targetX = Math.round((center + Math.cos(angleRad) * radius) * 100) / 100;
                const targetY = Math.round((center + Math.sin(angleRad) * radius) * 100) / 100;
                const isRayActive = focusedStageId === st.stageId;
                
                let isRayRelated = false;
                if (graphFocus) {
                  const focusSet = new Set([graphFocus.focusNodeId, ...graphFocus.upstreamNodes, ...graphFocus.downstreamNodes]);
                  if (st.stageId === "01") isRayRelated = evidenceGraph.sourceNodes.some(n => focusSet.has(n.id)) || evidenceGraph.evidenceNodes.some(n => focusSet.has(n.id));
                  if (st.stageId === "02") isRayRelated = evidenceGraph.capabilityNodes.some(n => focusSet.has(n.id));
                  if (st.stageId === "03") isRayRelated = evidenceGraph.organisationNodes.some(n => focusSet.has(n.id));
                  if (st.stageId === "04") isRayRelated = evidenceGraph.jobNodes.some(n => focusSet.has(n.id)) || evidenceGraph.requirementNodes.some(n => focusSet.has(n.id));
                }
                
                const rayStroke = graphFocus 
                  ? (isRayRelated ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.05)")
                  : (isRayActive ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.28)");

                return (
                  <SyntxEnergyRay
                    key={`ray-${st.stageId}`}
                    testId={`energy-ray-${st.stageId}`}
                    x1={center}
                    y1={center}
                    x2={targetX}
                    y2={targetY}
                    stroke={rayStroke}
                    strokeWidth={isRayActive || (graphFocus && isRayRelated) ? "2.5" : "1.2"}
                    dash={isRayActive || (graphFocus && isRayRelated) ? undefined : "3 3"}
                    photons={{
                      out: { r: isRayActive || (graphFocus && isRayRelated) ? "3" : "1.8", fill: isRayActive || (graphFocus && isRayRelated) ? "#ffffff" : SIL_TOKENS.colors.cyanActive, opacity: isRayActive || (graphFocus && isRayRelated) ? 1 : (graphFocus ? 0.1 : 0.65), dur: isRayActive ? "1.6s" : st.photonOutDur },
                      in: { r: isRayActive ? "3" : "1.8", fill: isRayActive ? "#38e5ff" : "#8eefff", opacity: isRayActive ? 0.95 : 0.6, dur: isRayActive ? "2.1s" : st.photonInDur }
                    }}
                    bead={{ r: isRayActive ? "4" : "2", fill: isRayActive ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.6)" }}
                  />
                );
              })}
            </svg>

            {/* Central Identity Core DropZone with subtle hover reaction */}
            <div
              data-testid="identity-core-wrapper"
              style={{
                zIndex: 10,
                opacity: isOrbitStageFocus ? 0.12 : focusedStageId ? 0.35 : 1,
                transform: isOrbitStageFocus ? "scale(0.62)" : focusedStageId ? "scale(0.85)" : "scale(1)",
                filter: isOrbitStageFocus ? "blur(3px) grayscale(92%)" : focusedStageId ? "grayscale(80%)" : undefined,
                pointerEvents: focusedStageId || isOrbitStageFocus ? "none" : "auto",
                transition: "all 0.5s ease"
              }}
            >
              <IdentityCoreDropZone sources={activeData.sources} isCommunicating={!!focusedStageId} onDropFile={file => sourceDockRef.current?.stageFile(file)} />
            </div>

            {/* Orbiting Resonance Bubbles */}
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                // The hover HUD lives inside this orbital stacking context.
                // Raise the whole layer only while a HUD is visible so the
                // opaque observation surface can actually composite above
                // the Identity Core (z-index 10).
                zIndex: hoveredStageId !== null ? 60 : 6
              }}
            >
              {stages.map((st) => {
                const angleRad = (st.angleDeg * Math.PI) / 180;
                const x = Math.round(Math.cos(angleRad) * radius * 100) / 100;
                const y = Math.round(Math.sin(angleRad) * radius * 100) / 100;
                const isStageActive = activeStageId === st.stageId;
                const isStageHovered = hoveredStageId === st.stageId;
                const isCosmosAnchor = isOrbitStageFocus && st.stageId === activeStageId;
                const isCosmosBackground = isOrbitStageFocus && !isCosmosAnchor;
                
                let isStageRelated = false;
                if (graphFocus) {
                  const focusSet = new Set([graphFocus.focusNodeId, ...graphFocus.upstreamNodes, ...graphFocus.downstreamNodes]);
                  if (st.stageId === "01") isStageRelated = evidenceGraph.sourceNodes.some(n => focusSet.has(n.id)) || evidenceGraph.evidenceNodes.some(n => focusSet.has(n.id));
                  if (st.stageId === "02") isStageRelated = evidenceGraph.capabilityNodes.some(n => focusSet.has(n.id));
                  if (st.stageId === "03") isStageRelated = evidenceGraph.organisationNodes.some(n => focusSet.has(n.id));
                  if (st.stageId === "04") isStageRelated = evidenceGraph.jobNodes.some(n => focusSet.has(n.id)) || evidenceGraph.requirementNodes.some(n => focusSet.has(n.id));
                }

                // If a focus exists, stages are dimmed unless they are related
                const isStageDimmed = graphFocus ? !isStageRelated : (focusedStageId !== null && focusedStageId !== st.stageId);


                return (
                  <FocusTransitionStageShell
                    key={st.stageId}
                    stageId={st.stageId}
                    x={x}
                    y={y}
                    isCosmosAnchor={isCosmosAnchor}
                    isCosmosBackground={isCosmosBackground}
                    showFocusPulse={focusedStageId === st.stageId}
                    copyAboveAnchorOpacity
                    emptyVisualUnderlay={
                      isCosmosAnchor &&
                      resultOnView &&
                      focusedOrbitPresentation?.kind === "EMPTY_PROJECTION" &&
                      focusedOrbitPresentation.emptyState ? (
                        <SilOrbitEmptyState
                          stageId={st.stageId}
                          state={focusedOrbitPresentation.emptyState}
                          showCopy={false}
                          towardCore={{ x: 0, y: 0 }}
                        />
                      ) : undefined
                    }
                    emptyCopyForeground={
                      isCosmosAnchor &&
                      resultOnView &&
                      focusedOrbitPresentation?.kind === "EMPTY_PROJECTION" &&
                      focusedOrbitPresentation.emptyState ? (
                        <SilOrbitEmptyStateCopy
                          stageId={st.stageId}
                          state={focusedOrbitPresentation.emptyState}
                        />
                      ) : undefined
                    }
                  >
                    <OrbitalResonanceBubble
                      stageId={st.stageId}
                      stageName={`${st.glyph} ${st.stageName}`}
                      subtitle={st.subtitle}
                      itemCount={st.count}
                      previewItems={st.previewItems}
                      angle={st.angleDeg}
                      isActive={isStageActive}
                      isHovered={isStageHovered}
                      isDimmed={isStageDimmed}
                      animationDelay={st.animationDelay}
                      sourcePresentation={sourcePresentation}
                      canonicalState={st.canonicalState}
                      locale={locale}
                      attentionState={resolveSilOrbitAttentionState(
                        st.stageId,
                        activeData,
                        resultOnView ? "SUCCEEDED" : "WITHHELD"
                      )}
                        hideViewMatches={legacyHidden}
                      onClick={() => {
                        const nextFocus = resolveOrbitalFocusNavigation({
                          activeStageId: activeStageId as SilOrbitStageId | null,
                          selectedItemId: selectedClusterId,
                          requestedStageId: st.stageId as SilOrbitStageId,
                          requestedItemId: null,
                          itemIds: buildOrbitFocusProjection(st.stageId, activeData).map((item) => item.id)
                        });
                        setActiveStageId(nextFocus.activeStageId);
                        setSelectedClusterId(nextFocus.selectedItemId);
                        setZoomLevel(nextFocus.zoomLevel);
                        if (!nextFocus.activeStageId) {
                          setSelectedGraphNodeId(null);
                        }
                      }}
                      onMouseEnter={() => {
                        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                        setHoveredStageId(st.stageId);
                      }}
                      onMouseLeave={() => {
                        hoverTimeoutRef.current = setTimeout(() => {
                          setHoveredStageId(null);
                        }, 250);
                      }}
                      onHudAction={handleHudAction}
                      accentColor={st.color}
                    />
                  </FocusTransitionStageShell>
                );
              })}
            </div>

            {/* Phase 3c: Continuous Semantic Space Sub-Clusters (L1) */}
            {zoomLevel >= 1 && activeStageId && !isOrbitStageFocus && (
              <div
                style={{
                  position: "absolute",
                  left: `${center + activeOrbitX}px`,
                  top: `${center + activeOrbitY}px`,
                  width: 0,
                  height: 0,
                  zIndex: 14,
                  animation: "rotateClockwise 160s linear infinite"
                }}
              >
                <svg
                  width="800"
                  height="800"
                  style={{
                    position: "absolute",
                    top: -400,
                    left: -400,
                    pointerEvents: "none",
                  }}
                >
                  {subClusters.map((cluster) => (
                    <line
                      key={`line-${cluster.id}`}
                      x1={400}
                      y1={400}
                      x2={Math.round((400 + cluster.dx) * 100) / 100}
                      y2={Math.round((400 + cluster.dy) * 100) / 100}
                      stroke={(graphFocus && (cluster.id === graphFocus.focusNodeId || graphFocus.upstreamNodes.includes(cluster.id) || graphFocus.downstreamNodes.includes(cluster.id))) ? SIL_TOKENS.colors.cyanActive : (graphFocus ? "rgba(56, 229, 255, 0.05)" : SIL_TOKENS.colors.cyanActive)}
                      strokeWidth={(graphFocus && (cluster.id === graphFocus.focusNodeId || graphFocus.upstreamNodes.includes(cluster.id) || graphFocus.downstreamNodes.includes(cluster.id))) ? "2.5" : "1.5"}
                      strokeDasharray={(graphFocus && (cluster.id === graphFocus.focusNodeId || graphFocus.upstreamNodes.includes(cluster.id) || graphFocus.downstreamNodes.includes(cluster.id))) ? undefined : "3 3"}
                      style={{ transition: "all 0.3s ease" }}
                    />
                  ))}
                </svg>

                {subClusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    data-testid="subspace-cluster"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClusterId(cluster.id);
                      setSelectedGraphNodeId(cluster.id);
                      setZoomLevel(2);
                    }}
                    style={{
                      position: "absolute",
                      left: `${Math.round((cluster.dx - 68) * 100) / 100}px`,
                      top: `${Math.round((cluster.dy - 25) * 100) / 100}px`,
                      width: "135px",
                      backgroundColor: "rgba(10, 18, 30, 0.92)",
                      border: `1px solid ${selectedClusterId === cluster.id ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.45)"}`,
                      borderRadius: "6px",
                      padding: "6px 8px",
                      cursor: "pointer",
                      zIndex: 15,
                      boxShadow: (graphFocus && cluster.id === graphFocus.focusNodeId) ? "0 0 25px rgba(56, 229, 255, 0.6)" : "0 0 16px rgba(56, 229, 255, 0.18)",
                      opacity: (graphFocus && cluster.id !== graphFocus.focusNodeId && !graphFocus.upstreamNodes.includes(cluster.id) && !graphFocus.downstreamNodes.includes(cluster.id)) ? 0.3 : 1,
                      filter: (graphFocus && cluster.id !== graphFocus.focusNodeId && !graphFocus.upstreamNodes.includes(cluster.id) && !graphFocus.downstreamNodes.includes(cluster.id)) ? "grayscale(80%)" : undefined,
                      transition: "all 0.3s ease",
                      transformOrigin: "center center",
                      animation: "rotateCounterClockwise 160s linear infinite"
                    }}
                  >
                    <div style={{ fontSize: "9px", color: SIL_TOKENS.colors.cyanActive, fontWeight: 700 }}>
                      {t.field.clusterNode} {cluster.projectionState === "PROPOSED"
                        ? "// PROPOSED"
                        : cluster.confidence ? `// ${cluster.confidence}` : "// N/A"}
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 700, margin: "3px 0", lineHeight: "1.2" }}>
                      {cluster.title}
                    </div>
                    <div style={{ fontSize: "9px", color: SIL_TOKENS.colors.textMuted }}>
                      {cluster.evidenceCount !== undefined ? `${cluster.evidenceCount} ${t.field.evidences}` : t.field.noEvidence}
                    </div>
                    {cluster.projectionState === "PROPOSED" && (
                      <div style={{ fontSize: "9px", color: SIL_TOKENS.colors.textMuted, marginTop: "3px" }}>
                        EVIDENCE PASSED // SEMANTIC DEFINITION NOT RUN
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Phase 3c: Continuous Semantic Space Evidence Nodes (L2) */}
            {zoomLevel >= 2 && selectedClusterId && !isOrbitDeepFocus && (
              <>
                {subClusters
                  .filter((cl) => cl.id === selectedClusterId)
                  .flatMap((cl) => cl.evidences)
                  .map((ev, i) => (
                    <div
                      key={ev.id}
                      data-testid="evidence-node"
                      style={{
                        position: "absolute",
                        left: `${Math.round((center + activeOrbitX + (i === 0 ? -190 : 20)) * 100) / 100}px`,
                        top: `${Math.round((center + activeOrbitY + (i === 0 ? 35 : 45)) * 100) / 100}px`,
                        width: "160px",
                        backgroundColor: "rgba(6, 12, 20, 0.95)",
                        border: "1px solid #38e5ff",
                        borderRadius: "6px",
                        padding: "8px",
                        zIndex: 16
                      }}
                    >
                      <div style={{ fontSize: "9px", color: "#38e5ff", fontWeight: 700 }}>
                        EVIDENCE // {ev.sourceType}
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: 700, margin: "3px 0" }}>
                        {ev.title}
                      </div>
                      <div style={{ fontSize: "10px", color: SIL_TOKENS.colors.textMuted }}>
                        {ev.snippet}
                      </div>
                    </div>
                  ))}
              </>
            )}
      </div>

      {isCapabilityCosmosFocus && !hasFocusedEmptyProjection && (
        <CapabilityCosmosView
          clusters={subClusters}
          onSelectCluster={(clusterId) => {
            setSelectedClusterId(clusterId);
            setSelectedGraphNodeId(null);
            setZoomLevel(2);
          }}
          onExit={() => {
            setActiveStageId(null);
            setSelectedClusterId(null);
            setSelectedGraphNodeId(null);
            setZoomLevel(0);
          }}
        />
      )}

      {isCapabilityDeepFocus && selectedClusterId && (
        <CapabilityDeepFocusView
          clusters={subClusters}
          selectedClusterId={selectedClusterId}
          onSelectCluster={(clusterId) => {
            setSelectedClusterId(clusterId);
            setSelectedGraphNodeId(null);
          }}
          onBack={() => {
            setSelectedClusterId(null);
            setSelectedGraphNodeId(null);
            setZoomLevel(1);
          }}
        />
      )}

      {isOrbitCosmosFocus &&
        !hasFocusedEmptyProjection &&
        activeStageId &&
        activeStageId !== "02" && (
        <OrbitalCosmosView
          stageId={activeStageId}
          stageName={stages.find((stage) => stage.stageId === activeStageId)?.stageName || activeStageId}
          items={orbitItems}
          onSelectItem={(itemId) => {
            setSelectedClusterId(itemId);
            setSelectedGraphNodeId(null);
            setZoomLevel(2);
          }}
          onExit={() => {
            setActiveStageId(null);
            setSelectedClusterId(null);
            setSelectedGraphNodeId(null);
            setZoomLevel(0);
          }}
        />
      )}

      {isOrbitDeepFocus && activeStageId && activeStageId !== "02" && selectedClusterId && (
        <OrbitalDeepFocusView
          stageId={activeStageId}
          stageName={stages.find((stage) => stage.stageId === activeStageId)?.stageName || activeStageId}
          selectedItemId={selectedClusterId}
          items={orbitItems}
          onSelectItem={(itemId) => {
            setSelectedClusterId(itemId);
            setSelectedGraphNodeId(null);
          }}
          onBack={() => {
            setSelectedClusterId(null);
            setSelectedGraphNodeId(null);
            setZoomLevel(1);
          }}
        />
      )}

      {/* Phase 3a: Compact Scientific Focus Detail Panel when an orbit is focused */}
      {activeStageId && (
        <div
          data-testid="semantic-focus-panel"
          style={{
            position: "absolute",
            bottom: "32px",
            right: "32px",
            zIndex: 25,
            backgroundColor: "rgba(6, 11, 18, 0.92)",
            border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
            boxShadow: `0 0 30px ${SIL_TOKENS.colors.cyanGlowStrong}`,
            backdropFilter: "blur(12px)",
            borderRadius: "6px",
            padding: "10px 18px",
            display: "flex",
            alignItems: "center",
            gap: "18px",
            color: SIL_TOKENS.colors.textPrimary,
            fontSize: "12px",
            opacity: isOrbitStageFocus ? 0.12 : 1,
            filter: isOrbitStageFocus ? "blur(2px)" : undefined,
            pointerEvents: isOrbitStageFocus ? "none" : "auto",
            transition: "opacity 0.56s ease, filter 0.56s ease"
          }}
        >
          <div>
            <div style={{ fontSize: "10.5px", color: SIL_TOKENS.colors.cyanActive, fontWeight: 700, letterSpacing: "1px" }}>
              {t.focus.activeFocus} // ORBIT {activeStageId}
            </div>
            <div style={{ fontWeight: 600, fontSize: "13px", marginTop: "2px" }}>
              {stages.find((s) => s.stageId === activeStageId)?.stageName}
            </div>
          </div>
          {focusedOrbitPresentation?.kind ===
            "EMPTY_PROJECTION" && (
            <>
              <div
                style={{
                  height: "24px",
                  width: "1px",
                  backgroundColor:
                    "rgba(255, 56, 68, 0.34)"
                }}
              />
              <div
                data-testid="semantic-focus-empty-projection"
                style={{
                  display: "flex",
                  gap: "12px",
                  fontSize: "11.5px",
                  color:
                    SIL_TOKENS.colors.textMuted
                }}
              >
                <span>
                  {t.focus.state}:{" "}
                  <strong
                    style={{
                      color:
                        "rgba(255, 91, 101, 0.96)"
                    }}
                  >
                    {
                      focusedOrbitPresentation
                        .stateLabel
                    }
                  </strong>
                </span>

                <span>
                  {t.focus.evidence}:{" "}
                  <strong
                    style={{
                      color:
                        SIL_TOKENS.colors
                          .textPrimary
                    }}
                  >
                    {
                      focusedOrbitPresentation
                        .evidenceLabel
                    }
                  </strong>
                </span>
              </div>
            </>
          )}
          <button
            onClick={() => {
              setActiveStageId(null);
              setSelectedClusterId(null);
              setSelectedGraphNodeId(null);
              setZoomLevel(0);
            }}
            style={{
              backgroundColor: "transparent",
              border: `1px solid rgba(56, 229, 255, 0.35)`,
              color: SIL_TOKENS.colors.cyanActive,
              fontSize: "10.5px",
              padding: "4px 8px",
              borderRadius: "3px",
              cursor: "pointer"
            }}
          >
            {t.focus.reset}
          </button>
        </div>
      )}

      {/* PERSON × JOB · the first screen: the closed state of the chain and, when available, the B2 coverage of the selected role. */}
      {activeFieldFocus === "CAPABILITY" && investigationMode !== "JOB" && pxjFirstScreenVisible(firstScreen, investigationMode) && (
        <div style={{ opacity: isOrbitStageFocus ? 0.12 : 1, filter: isOrbitStageFocus ? "blur(3px)" : undefined, pointerEvents: isOrbitStageFocus ? "none" : "auto", transition: "opacity 0.56s ease, filter 0.56s ease" }}>
          <PxjFirstScreen screen={firstScreen} mode={investigationMode} locale={locale} onSwitchMode={selectInvestigationMode} onSelectRole={selectAnalysisJob} noAnalysis={analysisPicker("first-screen")} />
        </div>
      )}
      {activeFieldFocus === "FIELD" && investigationMode === "PERSON_X_JOB" && <PxjAnalysisJobOffer screen={firstScreen} locale={locale} onSelectRole={selectAnalysisJob} />}

      {/* RD-PANEL (GELB stage 2, additive): role discovery for the PERSON analysis on view, beside the six orbits; never without an
          analysis, never under PERSON × JOB or JOB. */}
      {activeFieldFocus === "CAPABILITY" && discoveryAnalysisId !== null && (discoveryOpen || discoveryPools !== null) && (
        <div style={{ opacity: isOrbitStageFocus ? 0.12 : 1, filter: isOrbitStageFocus ? "blur(3px)" : undefined, pointerEvents: isOrbitStageFocus ? "none" : "auto", transition: "opacity 0.56s ease, filter 0.56s ease" }}>
          <RoleDiscoveryPanel locale={locale} pools={jobPoolWorkflow.pools} released={discoveryPools} discovery={roleDiscovery} onRelease={releaseDiscoveryPools} onClose={closeDiscovery} onInvestigate={investigateDiscoveredRole}
            investigation={semanticInvestigation.state} onStart={startSemanticInvestigation} onReread={() => setDiscoveryRevision(previous => previous + 1)}
            onGoToJobField={() => switchFieldFocus("FIELD")} />
        </div>
      )}
      {activeFieldFocus === "CAPABILITY" && discoveryAnalysisId !== null && !discoveryOpen && discoveryPools === null && !isOrbitStageFocus && (
        <RoleDiscoveryEntry locale={locale} onOpen={() => setDiscoveryOpen(true)} />
      )}

      {/* Persistent Top-Right How This Works / Codex Button */}
      <div
        data-sx-shell="controls"
        style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 60,
          display: "flex",
          gap: "10px"
        }}
      >
        <button
          data-testid="how-this-works-btn"
          onClick={() => setIsOnboardingOpen(true)}
          style={{
            padding: "8px 14px",
            backgroundColor: "rgba(10, 20, 30, 0.9)",
            border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
            borderRadius: "8px",
            color: SIL_TOKENS.colors.cyanActive,
            fontFamily: SIL_TOKENS.typography.mono,
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: `0 0 16px rgba(56, 229, 255, 0.25)`
          }}
        >
          ? {t.controls.howThisWorks}
        </button>
        <button
          data-testid="open-system-codex-btn"
          onClick={() => setIsCodexOpen(true)}
          style={{
            padding: "8px 14px",
            backgroundColor: "rgba(56, 229, 255, 0.15)",
            border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
            borderRadius: "8px",
            color: SIL_TOKENS.colors.cyanActive,
            fontFamily: SIL_TOKENS.typography.mono,
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: `0 0 16px rgba(56, 229, 255, 0.3)`
          }}
        >
          📖 {t.controls.systemCodex} [DE|EN]
        </button>
      </div>

      {/* Right Collapsible Semantic Guide Drawer */}
      <div data-sx-shell="guide" style={{ zIndex: 10 }}>
        <SemanticGuideDrawer locale={locale} />
      </div>

      {/* Right HR Decision Loop Dock: rendered only for an explicit exact DCTXREV; it owns no planetarium geometry. */}
      {careerDecisionContextRevisionId && (
        <div data-sx-shell="hr-dock" style={{ display: "contents" }}>
        <HrDecisionLoopDock
          careerDecisionContextRevisionId={careerDecisionContextRevisionId}
          decisionContextRevisionId={decisionContextRevisionId ?? null}
          locale={locale}
        />
        </div>
      )}

      {/* FIELD focus: the SYNTX semiontic field — the selected Job Pool as the relational field; the capability planetarium recedes underneath (still rendered, not interactive). */}
      {activeFieldFocus === "FIELD" && (
        <SyntxField
          workflow={jobComparisonAllowed ? jobPoolWorkflow : { ...jobPoolWorkflow, matches: { state: "IDLE" } }}
          analysisSource={jobPoolAnalysisSource}
          observation={observation}
          onObserve={observeField}
          onSelectPool={selectJobPool}
          onExit={() => switchFieldFocus("CAPABILITY")}
          locale={locale}
          jobScope={jobScope}
          onSelectJobScope={selectJobScope}
          onClearJobScope={clearJobScope}
          capabilityAvailable={capabilityGateOpen}
          capabilityGatedHint={capabilityGateTitle}
          analysisPicker={analysisPicker("role-view")}
          investigation={{ mode: investigationMode, analysisId: viewedAnalysisSource.kind === "NONE" ? null : viewedAnalysisSource.analysisId, analysisMode: viewedAnalysisMode, comparisonWithheld, analysisPool, onOpenAnalysisPool: analysisPool === null ? undefined : () => selectJobPool(analysisPool), jobId: viewedAnalysisSource.kind === "JOB_RESULT" ? job.state.activeJobId : null, scopeValid: jobScopeValidation.state === "VALID" }}
        />
      )}

      {/* SYNTX field selector (application shell): the two fields of one system, exactly one active, centred in the upper area. */}
      <SyntxFieldSelector
        focus={activeFieldFocus}
        capabilityGated={!capabilityGateOpen}
        capabilityGatedHint={capabilityGateTitle}
        capabilityGate={capabilityGate}
        groupLabel={t.syntx.selector.group}
        capabilityLabel={t.syntx.selector.capability}
        jobLabel={t.syntx.toggle}
        onSelect={switchFieldFocus}
        jobScope={jobScopePresentation}
        onJobScopeActivate={openJobScope}
      />
      {/* The investigation boundary on the same shell row, right of the field selector (mirroring the job scope on the left). */}
      <SyntxInvestigationSelector mode={investigationMode} copy={investigationCopy} onSelect={selectInvestigationMode} />
      {/* One calm veil per field change (.42 s, void → clear); pointer-transparent; REDUCED: none. */}
      {fieldSwitches > 0 && <div key={fieldSwitches} data-sx-field-veil data-sx-shell="veil" aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 50, pointerEvents: "none", backgroundColor: SIL_TOKENS.colors.void, opacity: 0, animation: "syntxFieldVeil 0.42s cubic-bezier(0.16, 1, 0.3, 1)" }} />}

      <SystemCodexModal
        isOpen={isCodexOpen}
        onClose={() => setIsCodexOpen(false)}
        locale={locale}
        onLocaleChange={setLocale}
      />

      <GuidedOnboardingOverlay
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        locale={locale}
        onOpenCodex={() => setIsCodexOpen(true)}
      />
    </div>
  );
}
