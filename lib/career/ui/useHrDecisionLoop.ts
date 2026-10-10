"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  decodeHrDecisionLoopPresentation,
  decodeHumanDecisionRecordPresentation,
  walkDecisionContextLineage,
  type DecisionContextLineageRead,
  type DecisionContextLineagePresentation,
  type HrDecisionLoopPresentation,
  type HumanDecisionRecordPresentation
} from "../hr-decision-loop/frontend-presentation";

/**
 * Frontend integration of the HR Decision Loop. It consumes the exact routes:
 *   GET  /api/career/hr-decision-loop/contexts/{careerDecisionContextRevisionId}
 *   POST /api/career/hr-decision-loop/decisions
 *   GET  /api/decision-contexts/{revisionId}   (frozen Decision Context API v1)
 * It branches only on the documented public codes and never infers a
 * current, latest or head artifact.
 */
export const HR_DECISION_LOOP_CONTEXT_ROUTE = "/api/career/hr-decision-loop/contexts";
export const HR_DECISION_LOOP_DECISION_ROUTE = "/api/career/hr-decision-loop/decisions";
export const DECISION_CONTEXT_API_ROUTE = "/api/decision-contexts";
export const LOCAL_PRINCIPAL_ISSUER_HEADER = "x-condyn-principal-issuer";
export const LOCAL_PRINCIPAL_SUBJECT_HEADER = "x-condyn-principal-subject";
export const LOCAL_PRINCIPAL_ISSUER = "LOCAL_DEVELOPMENT_SELF_DECLARED";

export type HrDecisionLoopReadState =
  | { state: "IDLE" }
  | { state: "LOADING" }
  | { state: "AVAILABLE"; presentation: HrDecisionLoopPresentation }
  | { state: "NOT_FOUND" }
  | { state: "FAILED"; code: string | null; reason: string | null };

export type HrDecisionDeclarationState =
  | { state: "IDLE" }
  | { state: "SUBMITTING" }
  | { state: "DECLARED"; record: HumanDecisionRecordPresentation }
  | { state: "REJECTED"; code: string; reason: string | null }
  | { state: "FAILED"; code: string | null };

/**
 * How the exact DREV id entered the dock. An id from the URL or the input is
 * an explicit assumption of the operator; an id from a DCDRB binding is a
 * persisted structural witness of this context. Neither makes the revision
 * current, accepted or a governed return.
 */
export type DecisionContextEntry =
  | { kind: "URL" }
  | { kind: "INPUT" }
  | { kind: "BINDING"; careerDecisionContextDecisionRevisionBindingId: string };

export type DecisionContextLineageState =
  | { state: "IDLE" }
  | { state: "LOADING"; revisionId: string; entry: DecisionContextEntry }
  | { state: "AVAILABLE"; revisionId: string; entry: DecisionContextEntry; lineage: DecisionContextLineagePresentation }
  | { state: "NOT_FOUND"; revisionId: string; entry: DecisionContextEntry }
  | { state: "FAILED"; revisionId: string; entry: DecisionContextEntry; code: string | null };

export interface HrDecisionDeclarationDraft {
  declarantActorId: string;
  declarationClass: string;
  declaredAt: string;
  declarationEvidenceRefs: readonly string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);

function publicErrorCode(payload: unknown): string | null {
  if (!isRecord(payload) || !isRecord(payload.error) || typeof payload.error.code !== "string") return null;
  return payload.error.code;
}

function publicErrorReason(payload: unknown): string | null {
  if (!isRecord(payload) || !isRecord(payload.error) || typeof payload.error.reason !== "string") return null;
  return payload.error.reason;
}

async function readJson(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { return null; }
}

export async function fetchHrDecisionLoop(careerDecisionContextRevisionId: string, fetcher: typeof fetch = fetch): Promise<HrDecisionLoopReadState> {
  const response = await fetcher(`${HR_DECISION_LOOP_CONTEXT_ROUTE}/${encodeURIComponent(careerDecisionContextRevisionId)}`);
  const payload = await readJson(response);
  if (response.status === 404) return { state: "NOT_FOUND" };
  if (!response.ok) return { state: "FAILED", code: publicErrorCode(payload), reason: publicErrorReason(payload) };
  const presentation = isRecord(payload) ? decodeHrDecisionLoopPresentation(payload.hrDecisionLoop) : null;
  return presentation === null ? { state: "FAILED", code: null, reason: null } : { state: "AVAILABLE", presentation };
}

export async function declareHumanDecision(
  careerDecisionContextRevisionId: string,
  draft: HrDecisionDeclarationDraft,
  fetcher: typeof fetch = fetch
): Promise<HrDecisionDeclarationState> {
  const response = await fetcher(HR_DECISION_LOOP_DECISION_ROUTE, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [LOCAL_PRINCIPAL_ISSUER_HEADER]: LOCAL_PRINCIPAL_ISSUER,
      [LOCAL_PRINCIPAL_SUBJECT_HEADER]: draft.declarantActorId
    },
    body: JSON.stringify({
      careerDecisionContextRevisionId,
      declarantActorId: draft.declarantActorId,
      declarationClass: draft.declarationClass,
      declaredAt: draft.declaredAt,
      declarationEvidenceRefs: [...draft.declarationEvidenceRefs]
    })
  });
  const payload = await readJson(response);
  if (response.status === 201) {
    const record = isRecord(payload) ? decodeHumanDecisionRecordPresentation(payload.humanDecisionRecord) : null;
    return record === null ? { state: "FAILED", code: null } : { state: "DECLARED", record };
  }
  const code = publicErrorCode(payload);
  if ((response.status === 422 || response.status === 409 || response.status === 401 || response.status === 403 || response.status === 404) && code !== null) {
    return { state: "REJECTED", code, reason: publicErrorReason(payload) };
  }
  return { state: "FAILED", code };
}

/** Exact read of one DREV through the frozen API v1; absence and failure stay distinct facts. */
export async function readDecisionContextRevisionExact(revisionId: string, fetcher: typeof fetch = fetch): Promise<DecisionContextLineageRead> {
  let response: Response;
  try {
    response = await fetcher(`${DECISION_CONTEXT_API_ROUTE}/${encodeURIComponent(revisionId)}`);
  } catch {
    return { kind: "FAILED", code: null };
  }
  const payload = await readJson(response);
  if (response.status === 404) return { kind: "ABSENT" };
  if (!response.ok) return { kind: "FAILED", code: publicErrorCode(payload) };
  return { kind: "REVISION", value: isRecord(payload) ? payload.revision ?? null : null };
}

export async function readDecisionContextLineage(revisionId: string, entry: DecisionContextEntry = { kind: "INPUT" }, fetcher: typeof fetch = fetch): Promise<DecisionContextLineageState> {
  const lineage = await walkDecisionContextLineage(revisionId, id => readDecisionContextRevisionExact(id, fetcher));
  if (lineage.revisions.length === 0) {
    if (lineage.terminal === "PREDECESSOR_NOT_FOUND") return { state: "NOT_FOUND", revisionId, entry };
    if (lineage.terminal === "PREDECESSOR_READ_FAILED") return { state: "FAILED", revisionId, entry, code: lineage.failureCode ?? null };
    if (lineage.terminal === "PREDECESSOR_UNDECODABLE") return { state: "FAILED", revisionId, entry, code: null };
  }
  return { state: "AVAILABLE", revisionId, entry, lineage };
}

export function useHrDecisionLoop(careerDecisionContextRevisionId: string | null, initialDecisionContextRevisionId: string | null = null) {
  const [loop, setLoop] = useState<HrDecisionLoopReadState>({ state: "IDLE" });
  const [declaration, setDeclaration] = useState<HrDecisionDeclarationState>({ state: "IDLE" });
  const [nextContext, setNextContext] = useState<DecisionContextLineageState>({ state: "IDLE" });
  const generation = useRef(0);

  const reload = useCallback(async () => {
    if (careerDecisionContextRevisionId === null) { setLoop({ state: "IDLE" }); return; }
    const current = generation.current + 1;
    generation.current = current;
    setLoop({ state: "LOADING" });
    let next: HrDecisionLoopReadState;
    try { next = await fetchHrDecisionLoop(careerDecisionContextRevisionId); } catch { next = { state: "FAILED", code: null, reason: null }; }
    if (generation.current === current) setLoop(next);
  }, [careerDecisionContextRevisionId]);

  useEffect(() => { void reload(); }, [reload]);

  const lineageGeneration = useRef(0);
  const loadNextContext = useCallback(async (revisionId: string, entry: DecisionContextEntry = { kind: "INPUT" }) => {
    const current = lineageGeneration.current + 1;
    lineageGeneration.current = current;
    setNextContext({ state: "LOADING", revisionId, entry });
    let next: DecisionContextLineageState;
    try { next = await readDecisionContextLineage(revisionId, entry); } catch { next = { state: "FAILED", revisionId, entry, code: null }; }
    if (lineageGeneration.current === current) setNextContext(next);
  }, []);

  useEffect(() => {
    if (initialDecisionContextRevisionId !== null && initialDecisionContextRevisionId.length > 0) void loadNextContext(initialDecisionContextRevisionId, { kind: "URL" });
  }, [initialDecisionContextRevisionId, loadNextContext]);

  const declare = useCallback(async (draft: HrDecisionDeclarationDraft) => {
    if (careerDecisionContextRevisionId === null) return;
    setDeclaration({ state: "SUBMITTING" });
    let next: HrDecisionDeclarationState;
    try { next = await declareHumanDecision(careerDecisionContextRevisionId, draft); } catch { next = { state: "FAILED", code: null }; }
    setDeclaration(next);
    if (next.state === "DECLARED") await reload();
  }, [careerDecisionContextRevisionId, reload]);

  return { loop, declaration, nextContext, declare, reload, loadNextContext };
}
