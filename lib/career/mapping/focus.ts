import type { MappingCoupling, MappingRoleId, MappingView } from "./view";

/**
 * PERSON × JOB mapping, phase B · the focus, a pure state machine: focusReduce(state, action) → state. No effect, no address bar,
 * no routing — and, binding B-3, no job scope: opening a job here is not choosing it for B2, so the state has no such field and the
 * machine no such action. Levels: L0 the whole field, L1 one pool, L2 one role open (body, requirement ring, coupled capabilities),
 * L3 one requirement or coupling with its evidence. Beside the level stands the selection (a capability, a role or a requirement);
 * a selected capability gives the reverse view over capabilityKey. An inadmissible action returns the very same state object.
 */
export type FocusLevel = "L0" | "L1" | "L2" | "L3";
export type FocusSelection =
  | { readonly kind: "CAPABILITY"; readonly capabilityKey: string }
  | { readonly kind: "ROLE"; readonly role: MappingRoleId }
  | { readonly kind: "REQUIREMENT"; readonly role: MappingRoleId; readonly poolRequirementId: string };
export interface FocusState {
  readonly level: FocusLevel;
  /** jobPoolUploadId of the open pool (L1 and deeper). */
  readonly pool: string | null;
  /** The open role (L2 and deeper). */
  readonly role: MappingRoleId | null;
  /** poolRequirementId of the open requirement (L3). */
  readonly requirement: string | null;
  readonly selection: FocusSelection | null;
}
export const FOCUS_ACTIONS = ["OPEN_POOL", "OPEN_ROLE", "OPEN_REQUIREMENT", "SELECT_CAPABILITY", "SELECT_ROLE", "SELECT_REQUIREMENT", "CLEAR_SELECTION", "UP", "RESET"] as const;
export type FocusAction =
  | { type: "OPEN_POOL"; jobPoolUploadId: string }
  | { type: "OPEN_ROLE"; role: MappingRoleId }
  | { type: "OPEN_REQUIREMENT"; poolRequirementId: string }
  | { type: "SELECT_CAPABILITY"; capabilityKey: string }
  | { type: "SELECT_ROLE"; role: MappingRoleId }
  | { type: "SELECT_REQUIREMENT"; role: MappingRoleId; poolRequirementId: string }
  | { type: "CLEAR_SELECTION" }
  | { type: "UP" }
  | { type: "RESET" };

export const FOCUS_INITIAL: FocusState = Object.freeze({ level: "L0", pool: null, role: null, requirement: null, selection: null });

const isText = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const isRoleId = (value: unknown): value is MappingRoleId => !!value && typeof value === "object" && isText((value as MappingRoleId).jobPoolUploadId) && isText((value as MappingRoleId).poolRoleId);
const roleOf = (role: MappingRoleId): MappingRoleId => Object.freeze({ jobPoolUploadId: role.jobPoolUploadId, poolRoleId: role.poolRoleId });
const sameRole = (a: MappingRoleId | null, b: MappingRoleId | null) => a === b || (a !== null && b !== null && a.jobPoolUploadId === b.jobPoolUploadId && a.poolRoleId === b.poolRoleId);
const sameSelection = (a: FocusSelection | null, b: FocusSelection | null): boolean => {
  if (a === null || b === null) return a === b;
  if (a.kind === "CAPABILITY" || b.kind === "CAPABILITY") return a.kind === b.kind && (a as { capabilityKey: string }).capabilityKey === (b as { capabilityKey: string }).capabilityKey;
  if (a.kind !== b.kind || !sameRole(a.role, b.role)) return false;
  return a.kind === "ROLE" || (a as { poolRequirementId: string }).poolRequirementId === (b as { poolRequirementId: string }).poolRequirementId;
};
/** The next state, or the given object itself when nothing changes. */
function settle(state: FocusState, next: Omit<FocusState, "selection"> & { selection?: FocusSelection | null }): FocusState {
  const selection = next.selection === undefined ? state.selection : next.selection;
  if (next.level === state.level && next.pool === state.pool && sameRole(next.role, state.role) && next.requirement === state.requirement && sameSelection(selection, state.selection)) return state;
  if (next.level === "L0" && selection === null) return FOCUS_INITIAL;
  return Object.freeze({ level: next.level, pool: next.pool, role: next.role, requirement: next.requirement, selection });
}

export function focusReduce(state: FocusState, action: FocusAction): FocusState {
  if (!action || typeof action !== "object") return state;
  switch (action.type) {
    case "OPEN_POOL":
      return isText(action.jobPoolUploadId) ? settle(state, { level: "L1", pool: action.jobPoolUploadId, role: null, requirement: null }) : state;
    case "OPEN_ROLE":
      return isRoleId(action.role) ? settle(state, { level: "L2", pool: action.role.jobPoolUploadId, role: sameRole(state.role, action.role) ? state.role : roleOf(action.role), requirement: null }) : state;
    case "OPEN_REQUIREMENT":
      return state.role !== null && isText(action.poolRequirementId) ? settle(state, { level: "L3", pool: state.pool, role: state.role, requirement: action.poolRequirementId }) : state;
    case "SELECT_CAPABILITY":
      return isText(action.capabilityKey) ? settle(state, { ...state, selection: Object.freeze({ kind: "CAPABILITY", capabilityKey: action.capabilityKey }) }) : state;
    case "SELECT_ROLE":
      return isRoleId(action.role) ? settle(state, { ...state, selection: Object.freeze({ kind: "ROLE", role: roleOf(action.role) }) }) : state;
    case "SELECT_REQUIREMENT":
      return isRoleId(action.role) && isText(action.poolRequirementId) ? settle(state, { ...state, selection: Object.freeze({ kind: "REQUIREMENT", role: roleOf(action.role), poolRequirementId: action.poolRequirementId }) }) : state;
    case "CLEAR_SELECTION":
      return settle(state, { ...state, selection: null });
    case "UP":
      if (state.level === "L3") return settle(state, { level: "L2", pool: state.pool, role: state.role, requirement: null });
      if (state.level === "L2") return settle(state, { level: "L1", pool: state.pool, role: null, requirement: null });
      if (state.level === "L1") return settle(state, { level: "L0", pool: null, role: null, requirement: null });
      return state;
    case "RESET":
      return settle(state, { level: "L0", pool: null, role: null, requirement: null, selection: null });
    default:
      return state;
  }
}

export interface ReverseView {
  readonly capabilityKey: string;
  /** The key is one of the PERSON capabilities. */
  readonly known: boolean;
  /** The couplings that carry exactly this key, in the view's order; a coupling without a key is never one of them, whatever its name. */
  readonly couplings: readonly MappingCoupling[];
  /** The roles of those couplings, once each, in rank order. */
  readonly roles: readonly MappingRoleId[];
}
/** Which requirements and roles a capability couples — over capabilityKey only. */
export function reverseView(view: MappingView, capabilityKey: string): ReverseView {
  const couplings = view.couplings.filter(c => c.capabilityKey !== null && c.capabilityKey === capabilityKey);
  const roles = view.roles.filter(r => couplings.some(c => sameRole(c.role, r.id))).map(r => r.id);
  return Object.freeze({ capabilityKey, known: view.constellation.some(c => c.key === capabilityKey), couplings: Object.freeze(couplings), roles: Object.freeze(roles) });
}
