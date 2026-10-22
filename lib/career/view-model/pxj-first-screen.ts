import type { DemoCareerIntelligenceData } from "../../../app/career/demo/demo-data";
import type { CapabilityProposalProjection } from "../capability-core/projection";
import type { AnalysisInvestigationUnresolvedReason, PersistedAnalysisInvestigation } from "../investigation/persisted";
import type { JobScope } from "../job-pool/job-scope";
import type { SelectedRoleCoverage } from "../job-pool/selected-role-coverage";
import type { InvestigationMode } from "../job-pool/investigation-mode";
import { adaptCanonicalToDemoState } from "../ui-adapter";
import { applyCapabilityProposalProjectionToDemoState } from "../capability-proposal-sil-adapter";

/**
 * PERSON × JOB · the first screen (owner G1, 2026-10-22; CONDYN_PXJ_G1_GRUEN_ASSIGNMENT_2026-10-22.md).
 *
 * Pure: no fetch, no React. One decoder for the persisted result of GET /api/career/analyses/{id}, used by the session (the body
 * the controller already loaded) and after a reload (the same route read again), and one projection of the chain
 *
 *   analysisId → PERSISTED_RESULT → BOUNDARY → SOURCE_IDENTITY → B2_RELATIONS → closed first-screen state.
 *
 * B2 (SELECTED_ROLE_COVERAGE_V1) is the only relation source. Nothing here reads `matching`, `recommendations`, `reactFlowGraph`,
 * `report_markdown` or `capabilityProposalProjection.relations`, and no state falls back to another source.
 */

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";

/* ---------------------------------------------------------------- result decoder (§03.2) */

export interface PersistedDocument {
  /** documents[].entity_id (DOC_…): the identity a quote's sourceDocumentId must name. */
  entityId: string;
  /** documents[].identity.name; null when the analysis delivers none (never a placeholder). */
  title: string | null;
}

export interface DecodedAnalysisResult {
  analysisId: string;
  /** The accepted body, handed unchanged to the existing adapters. */
  body: Record<string, unknown>;
  documents: PersistedDocument[];
  projection: CapabilityProposalProjection | null;
}

export type AnalysisResultRejection =
  | "RESULT_NOT_SUCCESS"
  | "RESULT_NOT_VERIFIED"
  | "RESULT_ANALYSIS_ID_MISMATCH"
  | "RESULT_METADATA_ANALYSIS_ID_MISMATCH"
  | "RESULT_ANALYSIS_MISSING"
  | "RESULT_DOCUMENTS_INVALID"
  | "RESULT_PROJECTION_INVALID";

export type AnalysisResultDecode = { ok: true; result: DecodedAnalysisResult } | { ok: false; code: AnalysisResultRejection };

const PROJECTION_STATES: Record<string, unknown> = { projectionKind: "CAPABILITY_PROPOSAL", projectionState: "PROPOSED", evidenceState: "EVIDENCE_PASSED", semanticDefinitionState: "NOT_RUN", authorityState: "NONE" };
const CAPABILITY_STATES: Record<string, unknown> = { evidenceState: "EVIDENCE_PASSED", semanticDefinitionState: "NOT_RUN", authorityState: "NONE" };
const holds = (value: Record<string, unknown>, fixed: Record<string, unknown>) => Object.entries(fixed).every(([key, item]) => value[key] === item);

/** The fixed states of lib/career/capability-core/projection/reader.ts; every quote SOURCE_MATCH_VERIFIED. */
function decodeProjection(value: unknown): CapabilityProposalProjection | null | undefined {
  if (value === null) return null;
  if (!isRecord(value) || !holds(value, PROJECTION_STATES) || !Array.isArray(value.capabilities) || !Array.isArray(value.relations)) return undefined;
  for (const capability of value.capabilities) {
    if (!isRecord(capability) || !isString(capability.id) || !isString(capability.name) || !["ATOMIC", "COMPOSITE"].includes(capability.scope as string)) return undefined;
    if (!(capability.domain === null || isString(capability.domain)) || !holds(capability, CAPABILITY_STATES) || !Array.isArray(capability.evidence)) return undefined;
    if (!Array.isArray(capability.sourceDocumentIds) || !Array.isArray(capability.sourceCandidateIds)) return undefined;
    for (const evidence of capability.evidence) {
      if (!isRecord(evidence) || !isString(evidence.evidenceId) || !isString(evidence.sourceDocumentId) || !isString(evidence.exactQuote) || evidence.verificationState !== "SOURCE_MATCH_VERIFIED") return undefined;
    }
  }
  return value as unknown as CapabilityProposalProjection;
}

/** Accepts exactly a VERIFIED result about the requested analysis; anything else is a rejection, never a partial success. */
export function decodeAnalysisResult(body: unknown, requestedAnalysisId: string): AnalysisResultDecode {
  if (!isRecord(body) || body.success !== true) return { ok: false, code: "RESULT_NOT_SUCCESS" };
  if (body.status !== "VERIFIED") return { ok: false, code: "RESULT_NOT_VERIFIED" };
  if (body.analysisId !== requestedAnalysisId) return { ok: false, code: "RESULT_ANALYSIS_ID_MISMATCH" };
  if (!isRecord(body.metadata) || body.metadata.analysis_id !== requestedAnalysisId) return { ok: false, code: "RESULT_METADATA_ANALYSIS_ID_MISMATCH" };
  const analysis = isRecord(body.analysis) && isRecord(body.analysis.structured_data) ? body.analysis.structured_data.analysis : null;
  if (!isRecord(analysis)) return { ok: false, code: "RESULT_ANALYSIS_MISSING" };
  const rawDocuments = analysis.documents ?? [];
  if (!Array.isArray(rawDocuments)) return { ok: false, code: "RESULT_DOCUMENTS_INVALID" };
  const documents: PersistedDocument[] = [];
  for (const document of rawDocuments) {
    if (!isRecord(document) || !isString(document.entity_id)) return { ok: false, code: "RESULT_DOCUMENTS_INVALID" };
    const name = isRecord(document.identity) && isString(document.identity.name) && document.identity.name.trim().length > 0 ? document.identity.name : null;
    documents.push({ entityId: document.entity_id, title: name });
  }
  const projection = decodeProjection(body.capabilityProposalProjection);
  if (projection === undefined) return { ok: false, code: "RESULT_PROJECTION_INVALID" };
  return { ok: true, result: { analysisId: requestedAnalysisId, body, documents, projection } };
}

/**
 * The Capability Field's data from one accepted result, the same for the session and a reload (T-02): the existing adapters,
 * unchanged. No staged documents and no source manifest enter (the route delivers none), so titles and document ids come from
 * the persisted documents alone.
 */
export function demoStateFromResult(result: DecodedAnalysisResult): DemoCareerIntelligenceData {
  return applyCapabilityProposalProjectionToDemoState(adaptCanonicalToDemoState(result.body.analysis, []), result.projection);
}

/**
 * PERSON × JOB shows nothing of the legacy analysis (owner Q1): no organisation, role, gap or strategy, and no capability but the
 * projection's proposals. Without a projection the legacy adapter's capabilities would stand in orbit 02 (PINK D-G1-P1): they stay out.
 */
export function withoutLegacyOrbits(data: DemoCareerIntelligenceData): DemoCareerIntelligenceData {
  return { ...data, capabilities: data.capabilities.filter(capability => capability.projectionState === "PROPOSED"), companyMatches: [], roleMatches: [], capabilityGaps: [], nextActions: [] };
}

/* ---------------------------------------------------------------- read states (inputs) */

export type AnalysisResultState =
  | { state: "IDLE" }
  | { state: "LOADING" }
  | { state: "AVAILABLE"; result: DecodedAnalysisResult }
  | { state: "NOT_FOUND" }
  | { state: "FAILED"; code: string | null };

/** The boundary as useAnalysisBoundary delivers it (ANALYSIS_INVESTIGATION_V1). */
export type FirstScreenBoundary =
  | { state: "IDLE" }
  | { state: "RESOLVING" }
  | { state: "RESOLVED"; value: PersistedAnalysisInvestigation }
  | { state: "UNRESOLVED"; reason: AnalysisInvestigationUnresolvedReason | null }
  | { state: "NOT_FOUND" }
  | { state: "FAILED" };

/** B2 as useSelectedRoleCoverage delivers it (SelectedRoleCoverageState). */
export type FirstScreenCoverage =
  | { state: "IDLE" }
  | { state: "LOADING" }
  | { state: "AVAILABLE"; coverage: SelectedRoleCoverage }
  | { state: "NOT_SCOPED" | "SCOPE_MISMATCH" | "SCOPE_DRIFT" | "SCOPE_UNAVAILABLE" | "LINEAGE_INVALID" | "NOT_FOUND" | "NOT_PROVISIONED" }
  | { state: "FAILED"; code: string | null };

export interface FirstScreenInput {
  /** The interface's investigation mode. */
  mode: InvestigationMode;
  /** The analysis on view (M-01): the session's result, else the URL's. */
  analysisId: string | null;
  result: AnalysisResultState;
  boundary: FirstScreenBoundary;
  /** The selected job, only when VALID; null when none is selected (or it is not valid). */
  selection: JobScope | null;
  coverage: FirstScreenCoverage;
}

/* ---------------------------------------------------------------- closed states (§04) */

export type CoverageWithheldState = "COVERAGE_LOADING" | "COVERAGE_NOT_SCOPED" | "COVERAGE_SCOPE_MISMATCH" | "COVERAGE_SCOPE_DRIFT" | "COVERAGE_SCOPE_UNAVAILABLE" | "COVERAGE_LINEAGE_INVALID" | "COVERAGE_NOT_FOUND" | "COVERAGE_NOT_PROVISIONED" | "COVERAGE_FAILED";
export type LineageCheck = "L-1" | "L-2" | "L-3" | "L-4";

export interface FirstScreenQuote {
  docId: string;
  /** Verbatim, as B2 delivers it. */
  quote: string;
  /** (docId, quote) stands byte-identical in evidence[] of the same proposal in the projection (P-06). */
  inProjection: boolean;
  /** The quote's document is one of the persisted documents of this result (§07). */
  sourceResolved: boolean;
  /** documents[].identity.name of that document; null when resolved without a delivered title. */
  sourceTitle: string | null;
  /** Shown as a verified source only when both hold. */
  verified: boolean;
}

export interface FirstScreenRequirement {
  poolRequirementId: string;
  capabilityName: string;
  necessityState: string;
  requiredLevel: string;
  coverage: "COVERED" | "NOT_COVERED";
  matchBasis: "EXACT" | "ALIAS" | "COMPOSITE_CONSTITUENT" | "TOKEN_CONTAINMENT" | null;
  matchedConstituent: string | null;
  /** TOKEN_CONTAINMENT stays a weak coverage (P-11). */
  weak: boolean;
  proposal: { id: string; name: string; inProjection: boolean } | null;
  quotes: FirstScreenQuote[];
}

export interface FirstScreenCoverageView {
  binding: { analysisId: string; jobPoolUploadId: string; poolRoleId: string; discoveryRunId: string; convergenceRunId: string; investigationScopeHash: string };
  role: { title: string; organizationName: string };
  relationState: "NOT_EVALUATED";
  reason: string;
  requirements: FirstScreenRequirement[];
  /** proposals[].coversPoolRequirementIds: focus highlights only (M-14). */
  covers: Record<string, string[]>;
  counts: { requirements: number; covered: number; notCovered: number };
}

export interface FirstScreenProposal { id: string; name: string }

export type PxjFirstScreen =
  | { state: "NO_ANALYSIS" }
  | { state: "RESULT_LOADING"; analysisId: string }
  | { state: "RESULT_NOT_FOUND"; analysisId: string }
  | { state: "RESULT_FAILED"; analysisId: string; code: string | null }
  | { state: "BOUNDARY_RESOLVING"; analysisId: string }
  | { state: "BOUNDARY_UNRESOLVED"; analysisId: string; reason: string | null }
  | { state: "BOUNDARY_NOT_FOUND"; analysisId: string }
  | { state: "BOUNDARY_FAILED"; analysisId: string }
  /** The analysis ran under another boundary than the interface's mode; nothing switches by itself. */
  | { state: "MODE_MISMATCH"; analysisId: string; analysisMode: "PERSON" | "PERSON_X_JOB"; interfaceMode: InvestigationMode }
  /** The analysis belongs to another job than the selected one (or none is selected): neither proposals nor coverage. */
  | { state: "ROLE_MISMATCH"; analysisId: string; analysisSelection: JobScope; selection: JobScope | null }
  /** A PERSON analysis under PERSON: today's first screen (no coverage). */
  | { state: "PERSON_RESULT"; analysisId: string; result: DecodedAnalysisResult }
  | { state: "NO_PROJECTION"; analysisId: string; result: DecodedAnalysisResult }
  | { state: CoverageWithheldState; analysisId: string; result: DecodedAnalysisResult; proposals: FirstScreenProposal[]; code: string | null }
  | { state: "LINEAGE_MISMATCH"; analysisId: string; result: DecodedAnalysisResult; proposals: FirstScreenProposal[]; check: LineageCheck }
  | { state: "AVAILABLE"; analysisId: string; result: DecodedAnalysisResult; proposals: FirstScreenProposal[]; coverage: FirstScreenCoverageView };

export type PxjFirstScreenState = PxjFirstScreen["state"];

/** The states in which this analysis's proposals are on the screen (and with them its sources). */
export function showsAnalysis(screen: PxjFirstScreen): screen is Extract<PxjFirstScreen, { result: DecodedAnalysisResult }> {
  return "result" in screen;
}

const sameScope = (a: JobScope | null, b: JobScope | null) => a !== null && b !== null && a.jobPoolUploadId === b.jobPoolUploadId && a.poolRoleId === b.poolRoleId;

/** The B2 read the first screen needs, or null (P-01): only PERSON × JOB, a verified result with a projection, a resolved PERSON_X_JOB boundary and the selected job being the analysis's own. */
export function firstScreenCoverageRequest(input: Omit<FirstScreenInput, "coverage">): { analysisId: string; scope: JobScope } | null {
  const screen = projectPxjFirstScreen({ ...input, coverage: { state: "IDLE" } });
  return screen.state === "COVERAGE_LOADING" && input.selection !== null ? { analysisId: screen.analysisId, scope: input.selection } : null;
}

/** L-1 … L-4 (§05): the comparison belongs to exactly this analysis, its boundary and its projection. */
export function lineageFailure(coverage: SelectedRoleCoverage, analysisId: string, boundary: PersistedAnalysisInvestigation, selection: JobScope, projection: CapabilityProposalProjection): LineageCheck | null {
  const binding = coverage.binding;
  if (binding.analysisId !== analysisId || binding.jobPoolUploadId !== selection.jobPoolUploadId || binding.poolRoleId !== selection.poolRoleId || !sameScope(boundary.jobScopeSelection, selection)) return "L-1";
  if (binding.discoveryRunId !== boundary.discoveryRunId) return "L-2";
  if (binding.investigationScopeHash !== boundary.investigationScopeHash) return "L-3";
  const delivered = coverage.proposals.map(proposal => proposal.id), projected = projection.capabilities.map(capability => capability.id);
  if (delivered.length !== projected.length || delivered.some((id, index) => id !== projected[index])) return "L-4";
  return null;
}

/** One B2 requirement row joined to the projection by id and to the persisted documents by entity id; nothing joined by name. */
function requirementView(requirement: SelectedRoleCoverage["requirements"][number], projection: CapabilityProposalProjection, documents: PersistedDocument[]): FirstScreenRequirement {
  const delivered = requirement.coverage.state === "COVERED" ? requirement.coverage.proposal : null;
  const projected = delivered === null ? undefined : projection.capabilities.find(capability => capability.id === delivered.capabilityProposalId);
  const quotes = (delivered?.evidence ?? []).map((item): FirstScreenQuote => {
    const inProjection = projected !== undefined && projected.evidence.some(evidence => evidence.sourceDocumentId === item.docId && evidence.exactQuote === item.quote);
    const document = documents.find(candidate => candidate.entityId === item.docId);
    return { docId: item.docId, quote: item.quote, inProjection, sourceResolved: document !== undefined, sourceTitle: document?.title ?? null, verified: inProjection && document !== undefined };
  });
  return {
    poolRequirementId: requirement.poolRequirementId,
    capabilityName: requirement.capabilityName,
    necessityState: requirement.necessityState,
    requiredLevel: requirement.requiredLevel,
    coverage: requirement.coverage.state,
    matchBasis: delivered?.matchBasis ?? null,
    matchedConstituent: delivered?.matchedConstituent ?? null,
    weak: delivered?.matchBasis === "TOKEN_CONTAINMENT",
    proposal: delivered === null ? null : { id: delivered.capabilityProposalId, name: delivered.name, inProjection: projected !== undefined },
    quotes
  };
}

const COVERAGE_STATES: Record<string, CoverageWithheldState> = {
  IDLE: "COVERAGE_LOADING", LOADING: "COVERAGE_LOADING", NOT_SCOPED: "COVERAGE_NOT_SCOPED", SCOPE_MISMATCH: "COVERAGE_SCOPE_MISMATCH", SCOPE_DRIFT: "COVERAGE_SCOPE_DRIFT",
  SCOPE_UNAVAILABLE: "COVERAGE_SCOPE_UNAVAILABLE", LINEAGE_INVALID: "COVERAGE_LINEAGE_INVALID", NOT_FOUND: "COVERAGE_NOT_FOUND", NOT_PROVISIONED: "COVERAGE_NOT_PROVISIONED", FAILED: "COVERAGE_FAILED"
};

/** The closed state of the first screen. Every step either passes or names why it stops; none substitutes another source. */
export function projectPxjFirstScreen(input: FirstScreenInput): PxjFirstScreen {
  const { mode, analysisId, result, boundary, selection, coverage } = input;
  if (analysisId === null) return { state: "NO_ANALYSIS" };
  if (result.state === "IDLE" || result.state === "LOADING") return { state: "RESULT_LOADING", analysisId };
  if (result.state === "NOT_FOUND") return { state: "RESULT_NOT_FOUND", analysisId };
  if (result.state === "FAILED") return { state: "RESULT_FAILED", analysisId, code: result.code };
  const decoded = result.result;
  // A result about another analysis (a late answer) is never shown: for the analysis on view it has not arrived yet.
  if (decoded.analysisId !== analysisId) return { state: "RESULT_LOADING", analysisId };
  if (boundary.state === "IDLE" || boundary.state === "RESOLVING") return { state: "BOUNDARY_RESOLVING", analysisId };
  if (boundary.state === "UNRESOLVED") return { state: "BOUNDARY_UNRESOLVED", analysisId, reason: boundary.reason };
  if (boundary.state === "NOT_FOUND") return { state: "BOUNDARY_NOT_FOUND", analysisId };
  if (boundary.state === "FAILED" || boundary.value.analysisId !== analysisId) return { state: "BOUNDARY_FAILED", analysisId };
  const persisted = boundary.value;
  if (persisted.mode !== mode) return { state: "MODE_MISMATCH", analysisId, analysisMode: persisted.mode, interfaceMode: mode };
  if (persisted.mode === "PERSON") return { state: "PERSON_RESULT", analysisId, result: decoded };
  // PERSON_X_JOB: the proposals arose under the scope of the analysis's own job; under another (or no) selected job none is shown.
  if (persisted.jobScopeSelection === null) return { state: "BOUNDARY_FAILED", analysisId };
  if (!sameScope(persisted.jobScopeSelection, selection)) return { state: "ROLE_MISMATCH", analysisId, analysisSelection: { ...persisted.jobScopeSelection }, selection };
  const projection = decoded.projection;
  if (projection === null) return { state: "NO_PROJECTION", analysisId, result: decoded };
  const proposals = projection.capabilities.map(capability => ({ id: capability.id, name: capability.name }));
  if (coverage.state !== "AVAILABLE") return { state: COVERAGE_STATES[coverage.state], analysisId, result: decoded, proposals, code: coverage.state === "FAILED" ? coverage.code : null };
  const delivered = coverage.coverage;
  const failed = lineageFailure(delivered, analysisId, persisted, selection!, projection);
  if (failed !== null) return { state: "LINEAGE_MISMATCH", analysisId, result: decoded, proposals, check: failed };
  return {
    state: "AVAILABLE", analysisId, result: decoded, proposals,
    coverage: {
      binding: { analysisId: delivered.binding.analysisId, jobPoolUploadId: delivered.binding.jobPoolUploadId, poolRoleId: delivered.binding.poolRoleId, discoveryRunId: delivered.binding.discoveryRunId, convergenceRunId: delivered.binding.convergenceRunId, investigationScopeHash: delivered.binding.investigationScopeHash },
      role: { title: delivered.role.title, organizationName: delivered.role.organizationName },
      relationState: delivered.authority.capabilityRequirementRelationState,
      reason: delivered.authority.reason,
      requirements: delivered.requirements.map(requirement => requirementView(requirement, projection, decoded.documents)),
      covers: Object.fromEntries(delivered.proposals.map(proposal => [proposal.id, [...proposal.coversPoolRequirementIds]])),
      counts: { requirements: delivered.counts.requirements, covered: delivered.counts.covered, notCovered: delivered.counts.notCovered }
    }
  };
}
