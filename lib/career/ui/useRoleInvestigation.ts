"use client";

import { useEffect, useRef, useState } from "react";
import { comparisonBelongsToSelection } from "../result-inspector/client";
import { readAnalysisInvestigation, type AnalysisInvestigationReadState } from "../investigation/client";
import type { SelectedRoleCoverage } from "../job-pool/selected-role-coverage";
import type { JobStructure, JobStructureFindingCode } from "../job-pool/job-structure";
import type { JobScope } from "../job-pool/job-scope";

/**
 * Role-bound reads of the three investigation modes (owner GO "DEMO FRONTEND", 2026-10-15), on GELB's contracts:
 *
 *   PERSON × JOB  B2 — GET /api/career/analyses/{analysisId}/job-comparison?jobPoolUploadId&poolRoleId (SELECTED_ROLE_COVERAGE_V1,
 *                 docs/career_analysis/SELECTED_ROLE_COVERAGE.md): unconfirmed name coverage of exactly the selected role.
 *   JOB           GET /api/career/job-pools/{upload}/roles/{role}/structure (JOB_STRUCTURE_V1, THREE_INVESTIGATION_MODES.md §4):
 *                 the job itself, without a person and without Gemini.
 *
 * Both are GET only and never start anything. Every result is a closed union; a body this frontend cannot decode is FAILED,
 * never a partial success. Data is held per binding: any change of analysis or selection discards it, aborts the read in
 * flight and ignores a late answer; it is shown only while its binding equals the current selection.
 */
type Fetcher = (input: string, init: { method: "GET"; cache: "no-store"; signal?: AbortSignal }) => Promise<{ status: number; json(): Promise<unknown> }>;
const defaultFetcher: Fetcher = (input, init) => fetch(input, init);

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);
const isCount = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;
const codeOf = (body: unknown): string | null => isRecord(body) && Array.isArray(body.issues) && isRecord(body.issues[0]) && isString(body.issues[0].code) ? body.issues[0].code : null;

/* ---------------------------------------------------------------- B2 */

export type SelectedRoleCoverageState =
  | { state: "IDLE" }
  | { state: "LOADING" }
  | { state: "AVAILABLE"; coverage: SelectedRoleCoverage }
  /** PERSON analysis or a run without scope: no job comparison. */
  | { state: "NOT_SCOPED" }
  /** The analysis belongs to another job (scope change). */
  | { state: "SCOPE_MISMATCH" }
  | { state: "SCOPE_DRIFT" }
  | { state: "SCOPE_UNAVAILABLE" }
  | { state: "LINEAGE_INVALID" }
  /** No projection reference: the analysis has no capability proposals to compare. */
  | { state: "NOT_FOUND" }
  | { state: "NOT_PROVISIONED" }
  | { state: "FAILED"; code: string | null };

const MATCH_BASES = ["EXACT", "ALIAS", "COMPOSITE_CONSTITUENT", "TOKEN_CONTAINMENT"];
const NECESSITIES = ["REQUIRED", "PREFERRED", "OPTIONAL", "UNKNOWN"];
const ELIGIBILITIES = ["MATCHING_ELIGIBLE_PROPOSAL_ONLY", "MATCHING_INELIGIBLE", "MATCHING_ELIGIBILITY_UNKNOWN"];
const B2_AUTHORITY: Record<string, unknown> = { comparisonBasis: "CAPABILITY_PROPOSAL_NAME_COVERAGE", operand: "CAPABILITY_PROPOSAL_PROJECTION", scored: false, authorityState: "NONE", capabilityRequirementRelationState: "NOT_EVALUATED", reason: "VERIFIED_CAPABILITY_SNAPSHOT_ABSENT" };
const sameRecord = (value: unknown, expected: Record<string, unknown>) => isRecord(value) && Object.keys(value).length === Object.keys(expected).length && Object.entries(expected).every(([key, item]) => value[key] === item);

function decodeCoverageProposal(value: unknown): boolean {
  return isRecord(value) && isString(value.capabilityProposalId) && isString(value.name) && MATCH_BASES.includes(value.matchBasis as string)
    && (value.matchedConstituent === null || isString(value.matchedConstituent))
    && Array.isArray(value.evidence) && value.evidence.every(item => isRecord(item) && isString(item.docId) && isString(item.quote))
    && value.evidenceState === "SOURCE_MATCH_VERIFIED" && value.authorityState === "NONE" && value.scored === false;
}

/** Strict decoder of SELECTED_ROLE_COVERAGE_V1: version, binding, fixed authority, pool-ordered requirements, every proposal, consistent counts. */
export function decodeSelectedRoleCoverage(value: unknown): SelectedRoleCoverage | null {
  if (!isRecord(value) || value.comparisonVersion !== "SELECTED_ROLE_COVERAGE_V1") return null;
  const binding = value.binding, role = value.role, counts = value.counts;
  if (!isRecord(binding) || !["analysisId", "jobId", "jobPoolUploadId", "poolRoleId", "investigationScopeHash", "discoveryRunId", "convergenceRunId", "poolCanonicalSha256", "targetRoleProfileRevisionId"].every(key => isString(binding[key])) || typeof binding.poolVersion !== "number") return null;
  if (!isRecord(role) || !isString(role.poolRoleId) || !isString(role.title) || !isString(role.poolOrganizationId) || !isString(role.organizationName) || role.poolRoleId !== binding.poolRoleId) return null;
  if (!sameRecord(value.authority, B2_AUTHORITY)) return null;
  if (!Array.isArray(value.requirements) || !Array.isArray(value.proposals) || !isRecord(counts)) return null;
  for (const requirement of value.requirements) {
    if (!isRecord(requirement) || !isString(requirement.poolRequirementId) || !isString(requirement.capabilityName) || !isStringArray(requirement.aliases) || !isString(requirement.domain) || !isString(requirement.requiredLevel) || typeof requirement.weight !== "number") return null;
    if (!NECESSITIES.includes(requirement.necessityState as string) || !isString(requirement.requirementType) || !ELIGIBILITIES.includes(requirement.matchingEligibility as string) || !isString(requirement.targetRequirementRevisionId)) return null;
    const coverage = requirement.coverage;
    if (!isRecord(coverage)) return null;
    if (coverage.state === "COVERED") { if (!decodeCoverageProposal(coverage.proposal)) return null; }
    else if (coverage.state !== "NOT_COVERED" || coverage.proposal !== null) return null;
  }
  for (const proposal of value.proposals) {
    if (!isRecord(proposal) || !isString(proposal.id) || !isString(proposal.name) || !["ATOMIC", "COMPOSITE"].includes(proposal.scope as string) || !isStringArray(proposal.coversPoolRequirementIds)) return null;
  }
  const covered = value.requirements.filter(requirement => (requirement as { coverage: { state: string } }).coverage.state === "COVERED").length;
  if (!isCount(counts.requirements) || !isCount(counts.covered) || !isCount(counts.notCovered) || !isCount(counts.proposals)) return null;
  if (counts.requirements !== value.requirements.length || counts.covered !== covered || counts.notCovered !== value.requirements.length - covered || counts.proposals !== value.proposals.length) return null;
  return value as unknown as SelectedRoleCoverage;
}

const B2_STATES: Record<string, SelectedRoleCoverageState["state"]> = {
  ERR_JOB_COMPARISON_NOT_SCOPED: "NOT_SCOPED",
  ERR_JOB_COMPARISON_SCOPE_MISMATCH: "SCOPE_MISMATCH",
  ERR_JOB_COMPARISON_SCOPE_DRIFT: "SCOPE_DRIFT",
  ERR_JOB_COMPARISON_SCOPE_UNAVAILABLE: "SCOPE_UNAVAILABLE",
  ERR_JOB_COMPARISON_LINEAGE_INVALID: "LINEAGE_INVALID"
};

export async function readSelectedRoleCoverage(analysisId: string, selection: JobScope, fetcher: Fetcher = defaultFetcher, signal?: AbortSignal): Promise<SelectedRoleCoverageState> {
  const url = `/api/career/analyses/${encodeURIComponent(analysisId)}/job-comparison?jobPoolUploadId=${encodeURIComponent(selection.jobPoolUploadId)}&poolRoleId=${encodeURIComponent(selection.poolRoleId)}`;
  let response;
  try { response = await fetcher(url, { method: "GET", cache: "no-store", signal }); } catch { return { state: "FAILED", code: null }; }
  let body: unknown = null;
  try { body = await response.json(); } catch { /* an undecodable body is FAILED below */ }
  const code = codeOf(body);
  if (response.status === 200) {
    const coverage = isRecord(body) && body.success === true ? decodeSelectedRoleCoverage(body.comparison) : null;
    // B2 display guard: the delivered binding must be exactly the analysis and the selection that were asked for.
    if (coverage === null || !comparisonBelongsToSelection(coverage, { analysisId, jobPoolUploadId: selection.jobPoolUploadId, poolRoleId: selection.poolRoleId })) return { state: "FAILED", code: null };
    return { state: "AVAILABLE", coverage };
  }
  if (response.status === 409 && code !== null && B2_STATES[code] !== undefined) return { state: B2_STATES[code] } as SelectedRoleCoverageState;
  if (response.status === 404 && code === "ERR_JOB_COMPARISON_ANALYSIS_NOT_FOUND") return { state: "NOT_FOUND" };
  if (response.status === 503 && code === "ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED") return { state: "NOT_PROVISIONED" };
  return { state: "FAILED", code };
}

/* ---------------------------------------------------------------- JOB */

export type JobStructureState =
  | { state: "IDLE" }
  | { state: "LOADING" }
  | { state: "AVAILABLE"; structure: JobStructure }
  /** Unknown pool, a role outside it, or a pool that is not ACTIVE. */
  | { state: "UNAVAILABLE" }
  | { state: "LINEAGE_INVALID" }
  | { state: "NOT_PROVISIONED" }
  | { state: "FAILED"; code: string | null };

export const JOB_STRUCTURE_FINDING_CODES: readonly JobStructureFindingCode[] = [
  "ROLE_DESCRIPTION_MISSING", "ROLE_SENIORITY_UNDECLARED", "ROLE_DOMAIN_FOCUS_UNDECLARED", "ROLE_RESPONSIBILITY_NOT_DECLARED", "ROLE_WITHOUT_REQUIRED_REQUIREMENT",
  "REQUIREMENT_NECESSITY_UNDECLARED", "REQUIREMENT_LEVEL_UNRESOLVED", "REQUIREMENT_MATCHING_INELIGIBLE", "REQUIREMENT_MATCHING_ELIGIBILITY_UNKNOWN",
  "REQUIREMENT_TYPE_UNDECLARED", "REQUIREMENT_ZERO_WEIGHT", "REQUIREMENT_DOMAIN_UNDECLARED", "REQUIREMENT_NAME_COLLISION"
];
const JOB_AUTHORITY: Record<string, unknown> = { basis: "DECLARED_POOL_FIELDS_AND_CANONICAL_VALIDATION", interpretation: "NONE", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", scored: false };
const NECESSITY_KINDS = ["REQUIRED", "PREFERRED", "OPTIONAL", "CONDITIONAL", "UNKNOWN"];
const LEVEL_KINDS = ["NOT_APPLICABLE", "UNKNOWN", "UNSUPPORTED_INFERENCE", "CAPABILITY_LEVEL", "EXPERIENCE_DURATION", "LANGUAGE_PROFICIENCY", "CREDENTIAL_REQUIREMENT"];

/** Strict decoder of JOB_STRUCTURE_V1: version and mode, binding, organization and role, requirements with their states, findings, fixed authority. */
export function decodeJobStructure(value: unknown): JobStructure | null {
  if (!isRecord(value) || value.structureVersion !== "JOB_STRUCTURE_V1" || value.investigationMode !== "JOB") return null;
  const binding = value.binding, organization = value.organization, role = value.role, counts = value.counts;
  if (!isRecord(binding) || !["jobPoolUploadId", "poolRoleId", "poolId", "poolCanonicalSha256", "targetRoleProfileRevisionId"].every(key => isString(binding[key])) || typeof binding.poolVersion !== "number") return null;
  if (!isRecord(organization) || !["poolOrganizationId", "name", "industry", "scale", "region", "countryIso", "description"].every(key => isString(organization[key]))) return null;
  if (!isRecord(role) || !["poolRoleId", "title", "seniority", "domainFocus", "description"].every(key => isString(role[key])) || role.poolRoleId !== binding.poolRoleId) return null;
  const profile = role.profile;
  if (!isRecord(profile) || !isString(profile.roleSemanticDefinition) || !isRecord(profile.responsibilityScope)) return null;
  const responsibility = profile.responsibilityScope;
  if (!(responsibility.state === "NOT_DECLARED" || (responsibility.state === "DECLARED" && isString(responsibility.text)))) return null;
  if (profile.proposalState !== "PROPOSAL_ONLY" || profile.authorityState !== "NONE") return null;
  if (!sameRecord(value.authority, JOB_AUTHORITY)) return null;
  if (!Array.isArray(value.requirements) || !Array.isArray(value.findings) || !isRecord(counts)) return null;
  for (const requirement of value.requirements) {
    if (!isRecord(requirement) || !isString(requirement.poolRequirementId) || !isString(requirement.capabilityName) || !isStringArray(requirement.aliases) || !isString(requirement.domain) || !isString(requirement.requiredLevel) || typeof requirement.weight !== "number") return null;
    if (!isString(requirement.requirementType) || typeof requirement.requirementTypeDeclared !== "boolean" || !isString(requirement.targetRequirementRevisionId) || !isStringArray(requirement.evidence)) return null;
    if (!isRecord(requirement.necessityState) || !NECESSITY_KINDS.includes(requirement.necessityState.kind as string)) return null;
    if (!isRecord(requirement.requiredLevelState) || !LEVEL_KINDS.includes(requirement.requiredLevelState.kind as string)) return null;
    if (!ELIGIBILITIES.includes(requirement.matchingEligibility as string) || !isRecord(requirement.validation)) return null;
  }
  for (const finding of value.findings) {
    if (!isRecord(finding) || !JOB_STRUCTURE_FINDING_CODES.includes(finding.code as JobStructureFindingCode) || !isRecord(finding.subject) || !["ROLE", "REQUIREMENT"].includes(finding.subject.kind as string) || !isString(finding.subject.id)) return null;
    if (!isString(finding.field) || !isStringArray(finding.evidence) || !isStringArray(finding.relatedRequirementIds)) return null;
  }
  if (counts.requirements !== value.requirements.length || counts.findings !== value.findings.length) return null;
  return value as unknown as JobStructure;
}

const JOB_STATES: Record<string, JobStructureState["state"]> = { ERR_JOB_STRUCTURE_UNAVAILABLE: "UNAVAILABLE", ERR_JOB_STRUCTURE_LINEAGE_INVALID: "LINEAGE_INVALID" };

export async function readJobStructure(selection: JobScope, fetcher: Fetcher = defaultFetcher, signal?: AbortSignal): Promise<JobStructureState> {
  const url = `/api/career/job-pools/${encodeURIComponent(selection.jobPoolUploadId)}/roles/${encodeURIComponent(selection.poolRoleId)}/structure`;
  let response;
  try { response = await fetcher(url, { method: "GET", cache: "no-store", signal }); } catch { return { state: "FAILED", code: null }; }
  let body: unknown = null;
  try { body = await response.json(); } catch { /* an undecodable body is FAILED below */ }
  const code = codeOf(body);
  if (response.status === 200) {
    const structure = isRecord(body) && body.success === true ? decodeJobStructure(body.structure) : null;
    if (structure === null || structure.binding.jobPoolUploadId !== selection.jobPoolUploadId || structure.binding.poolRoleId !== selection.poolRoleId) return { state: "FAILED", code: null };
    return { state: "AVAILABLE", structure };
  }
  if (response.status === 409 && code !== null && JOB_STATES[code] !== undefined) return { state: JOB_STATES[code] } as JobStructureState;
  if (response.status === 503 && code === "ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED") return { state: "NOT_PROVISIONED" };
  return { state: "FAILED", code };
}

/* ---------------------------------------------------------------- hooks */

/** One read per key; a key change discards the data, aborts the read in flight and drops a late answer. */
function useKeyedRead<T extends { state: string }>(key: string | null, read: (signal: AbortSignal) => Promise<T>, loading: T, idle: T): T {
  const [entry, setEntry] = useState<{ key: string | null; value: T }>({ key: null, value: idle });
  const generation = useRef(0);
  const reader = useRef(read);
  reader.current = read;
  useEffect(() => {
    const current = generation.current + 1;
    generation.current = current;
    if (key === null) { setEntry({ key: null, value: idle }); return; }
    const controller = new AbortController();
    setEntry({ key, value: loading });
    void reader.current(controller.signal)
      .catch(() => ({ state: "FAILED", code: null } as unknown as T))
      .then(value => { if (generation.current === current && !controller.signal.aborted) setEntry({ key, value }); });
    return () => controller.abort();
  }, [key]);
  // Shown only for the key it was read for: during a change the previous data is never visible.
  return entry.key === key ? entry.value : key === null ? idle : loading;
}

/** B2 for exactly the selected job of a PERSON × JOB analysis; null analysis or scope reads nothing. */
export function useSelectedRoleCoverage(analysisId: string | null, scope: JobScope | null, fetcher?: Fetcher): SelectedRoleCoverageState {
  const key = analysisId === null || scope === null ? null : JSON.stringify([analysisId, scope.jobPoolUploadId, scope.poolRoleId]);
  return useKeyedRead<SelectedRoleCoverageState>(key, signal => readSelectedRoleCoverage(analysisId!, scope!, fetcher, signal), { state: "LOADING" }, { state: "IDLE" });
}

/** JOB_STRUCTURE_V1 for exactly the selected job; null scope reads nothing. */
export function useJobStructure(scope: JobScope | null, fetcher?: Fetcher): JobStructureState {
  const key = scope === null ? null : JSON.stringify([scope.jobPoolUploadId, scope.poolRoleId]);
  return useKeyedRead<JobStructureState>(key, signal => readJobStructure(scope!, fetcher, signal), { state: "LOADING" }, { state: "IDLE" });
}

/* ---------------------------------------------------------------- analysis boundary (URL BOUNDARY CLOSURE) */

/**
 * The persisted investigation boundary of the analysis on view (owner "URL BOUNDARY CLOSURE", 2026-10-15), read with GELB's client
 * (`lib/career/investigation/client.ts`, ANALYSIS_INVESTIGATION_V1): analysisId → the boundary its job was declared and run under.
 * Never guessed from the interface; RESOLVING (a read pending) compares nothing, exactly like UNRESOLVED, NOT_FOUND and FAILED.
 */
export type AnalysisBoundaryState = { state: "IDLE" } | { state: "RESOLVING" } | AnalysisInvestigationReadState;

/** The boundary of exactly the analysis on view; a change of analysis discards it and reads again. */
export function useAnalysisBoundary(analysisId: string | null, fetcher: Fetcher = defaultFetcher): AnalysisBoundaryState {
  return useKeyedRead<AnalysisBoundaryState>(analysisId, signal => readAnalysisInvestigation(fetcher, analysisId!, signal), { state: "RESOLVING" }, { state: "IDLE" });
}
