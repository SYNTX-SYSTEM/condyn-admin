/**
 * The career demo's URL (owner "OWNER_GO_FULL_PXJ_CLOSURE" §05, N-1 B-NAV): one parser for the server's searchParams (a reload, a
 * deep link) and for the browser's own URL after Back / Forward, so both mount the field from the same props (NAV ≡ RELOAD); and
 * one writer that keeps the browser history: a push for every decision the user takes that the URL carries, a replace for what the
 * system adds afterwards.
 */
/** The page's search parameters, as `app/career/demo/page.tsx` declared them before. */
export interface CareerDemoUrlProps {
  canonicalSilAssociationId?: string;
  /** Exact G3 DCTXREV; opens the HR Decision Loop dock. Never inferred. */
  careerDecisionContextRevisionId?: string;
  /** Exact G2 DREV read as the reconstructed next decision context. */
  decisionContextRevisionId?: string;
  /** Exact analysis on view (N-4 F-RF-4; stale since G1): its persisted result is read for the Capability Field's first screen
   *  (owner G1: result → boundary → B2), its boundary decides the Job Field's comparison. Never inferred, never a latest analysis. */
  analysisId?: string;
  /** Exact Job Pool upload selected for matching. Never inferred, never a latest pool. */
  jobPoolUploadId?: string;
  /** Planetarium focus: FIELD opens the SYNTX Job Field (JOB and POOL are accepted as legacy aliases); anything else is the capability field (an exact jobPoolUploadId without focus opens the field). */
  fieldFocus?: "CAPABILITY" | "FIELD";
  /** Exact observation point of the field; never inferred. */
  jobOrganizationId?: string;
  jobRoleId?: string;
  jobRequirementId?: string;
  /** Exact selected job scope (SFE invariant: no analysis without it); never inferred, independent of the observation point. */
  jobScopePoolUploadId?: string;
  jobScopeRoleId?: string;
  /** Explicitly chosen investigation mode (PERSON | PERSON_X_JOB | JOB); never inferred. */
  investigationMode?: string;
  /** The analysis job still running when the URL was written (N-2 B-RUN): read again by its id only, never started anew. */
  analysisJobId?: string;
  /** Role discovery (owner D-RD-1 = B): the job pool uploads the user released explicitly for the PERSON analysis on view —
   *  repeated parameter `discoveryPoolUploadId`, never "all", never a latest pool. */
  discoveryPoolUploadIds?: string[];
  /** RI-URL (GELB c1954ca STOP point, owner D-RD-3 A): the semantic investigation of the released pools, read again by its own id
   *  only (GET, never a repeated POST). Exact server format, never guessed, never derived from the roles or the release. */
  roleInvestigationId?: string;
}

/** The shape Next.js hands a page: a repeated parameter arrives as an array. */
export type CareerDemoSearchParams = Readonly<Record<string, string | string[] | undefined>>;

/** A parameter counts only when it stands exactly once; a repeated one is ambiguous and is read as absent (never one of them guessed). */
const single = (value: string | string[] | undefined): string | undefined => typeof value === "string" ? value : undefined;

/** N-2 B-RUN: the running analysis job in the URL, written by the field on the 202 and removed when it SUCCEEDED. */
export const ANALYSIS_JOB_URL_PARAM = "analysisJobId";

/** Only the server's own job id format (`JOB_<ms>_<n>`); anything else is no job id (it is removed, never read). */
export function analysisJobIdFromParam(value: string | null | undefined): string | null {
  return typeof value === "string" && /^JOB_[0-9]{1,16}_[0-9]{1,6}$/.test(value) ? value : null;
}

/** Role discovery's released pools: the one parameter that repeats by design (one per released upload). */
export const DISCOVERY_POOLS_URL_PARAM = "discoveryPoolUploadId";
export const DISCOVERY_POOLS_MAX = 10;
const UPLOAD_ID = /^JPOOL_[0-9A-F]{32}$/;

/**
 * The released pools as one set: every value an upload id, none twice, 1 … 10 of them; anything else is no release at all (read as
 * absent and removed, never partly guessed). The order is the user's.
 */
export function discoveryPoolsFromParam(value: string | readonly string[] | undefined): string[] | undefined {
  const list = typeof value === "string" ? [value] : Array.isArray(value) ? [...value] : [];
  if (list.length === 0 || list.length > DISCOVERY_POOLS_MAX || new Set(list).size !== list.length || !list.every(id => UPLOAD_ID.test(id))) return undefined;
  return list;
}

/** RI-URL: the released investigation's own parameter, never a list, never "all", never guessed — the server's id format only. */
export const ROLE_INVESTIGATION_URL_PARAM = "roleInvestigationId";
const INVESTIGATION_ID = /^RINV_[0-9A-F]{32}$/;
export function roleInvestigationIdFromParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && INVESTIGATION_ID.test(value) ? value : undefined;
}

export function careerDemoPropsFromSearchParams(params: CareerDemoSearchParams): CareerDemoUrlProps {
  const focus = single(params.focus);
  return {
    canonicalSilAssociationId: single(params.canonicalSilAssociationId),
    careerDecisionContextRevisionId: single(params.careerDecisionContextRevisionId),
    decisionContextRevisionId: single(params.decisionContextRevisionId),
    analysisId: single(params.analysisId),
    jobPoolUploadId: single(params.jobPoolUploadId),
    fieldFocus: focus === "FIELD" || focus === "JOB" || focus === "POOL" ? "FIELD" : focus === "CAPABILITY" ? "CAPABILITY" : undefined,
    jobOrganizationId: single(params.jobOrganizationId),
    jobRoleId: single(params.jobRoleId),
    jobRequirementId: single(params.jobRequirementId),
    jobScopePoolUploadId: single(params.jobScopePoolUploadId),
    jobScopeRoleId: single(params.jobScopeRoleId),
    investigationMode: single(params.investigationMode),
    analysisJobId: single(params[ANALYSIS_JOB_URL_PARAM]),
    discoveryPoolUploadIds: discoveryPoolsFromParam(params[DISCOVERY_POOLS_URL_PARAM]),
    roleInvestigationId: roleInvestigationIdFromParam(params[ROLE_INVESTIGATION_URL_PARAM])
  };
}

/** The browser's query string in the shape Next.js gives the server (`?a=1&a=2` → `{ a: ["1", "2"] }`). */
export function careerDemoSearchParamsFromSearch(search: string): CareerDemoSearchParams {
  const params: Record<string, string | string[]> = {};
  for (const [name, value] of new URLSearchParams(search)) {
    const previous = params[name];
    params[name] = previous === undefined ? value : Array.isArray(previous) ? [...previous, value] : [previous, value];
  }
  return params;
}

export type CareerDemoUrlChanges = Readonly<Record<string, string | readonly string[] | null>>;

/** The URL after the changes (null removes a parameter, a list writes it once per value in order); every other parameter, the path
 *  and the hash stay as they are. */
export function applyCareerDemoUrlChanges(href: string, changes: CareerDemoUrlChanges): string {
  const url = new URL(href);
  for (const [name, value] of Object.entries(changes)) {
    if (value === null) url.searchParams.delete(name);
    else if (typeof value === "string") url.searchParams.set(name, value);
    else { url.searchParams.delete(name); for (const item of value) url.searchParams.append(name, item); }
  }
  return url.toString();
}

/** A push already made in this task: one user action is one history entry, however many of its parameters it writes. */
let entryOpen = false;

/**
 * `push`: a decision the user takes that the URL carries (Back returns before it). `replace`: what the system adds to the entry on
 * view (analysisId on SUCCEEDED, a normalisation). A URL that does not change writes nothing, so no entry repeats its predecessor.
 */
export function writeCareerDemoUrl(changes: CareerDemoUrlChanges, how: "push" | "replace"): void {
  if (typeof window === "undefined" || typeof window.history?.replaceState !== "function") return;
  try {
    const current = window.location.href;
    const next = applyCareerDemoUrlChanges(current, changes);
    if (next === current) return;
    if (how === "push" && !entryOpen && typeof window.history.pushState === "function") {
      window.history.pushState(window.history.state, "", next);
      entryOpen = true;
      queueMicrotask(() => { entryOpen = false; });
      return;
    }
    window.history.replaceState(window.history.state, "", next);
  } catch { /* navigation state is a convenience, never a requirement */ }
}
