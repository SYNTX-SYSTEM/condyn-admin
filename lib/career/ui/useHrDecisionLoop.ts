"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  decodeHrDecisionLoopPresentation,
  decodeHumanDecisionRecordPresentation,
  walkDecisionContextLineage,
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
  | { state: "FAILED"; code: string | null };

export type HrDecisionDeclarationState =
  | { state: "IDLE" }
  | { state: "SUBMITTING" }
  | { state: "DECLARED"; record: HumanDecisionRecordPresentation }
  | { state: "REJECTED"; code: string; reason: string | null }
  | { state: "FAILED"; code: string | null };

export type DecisionContextLineageState =
  | { state: "IDLE" }
  | { state: "LOADING" }
  | { state: "AVAILABLE"; lineage: DecisionContextLineagePresentation }
  | { state: "NOT_FOUND" }
  | { state: "FAILED"; code: string | null };

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
  if (!response.ok) return { state: "FAILED", code: publicErrorCode(payload) };
  const presentation = isRecord(payload) ? decodeHrDecisionLoopPresentation(payload.hrDecisionLoop) : null;
  return presentation === null ? { state: "FAILED", code: null } : { state: "AVAILABLE", presentation };
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

export async function readDecisionContextLineage(revisionId: string, fetcher: typeof fetch = fetch): Promise<DecisionContextLineageState> {
  let first = true;
  let failure: DecisionContextLineageState | null = null;
  const lineage = await walkDecisionContextLineage(revisionId, async (id) => {
    const response = await fetcher(`${DECISION_CONTEXT_API_ROUTE}/${encodeURIComponent(id)}`);
    const payload = await readJson(response);
    if (response.status === 404) {
      if (first) failure = { state: "NOT_FOUND" };
      return null;
    }
    if (!response.ok) {
      if (first) failure = { state: "FAILED", code: publicErrorCode(payload) };
      return null;
    }
    first = false;
    return isRecord(payload) ? payload.revision ?? null : null;
  });
  if (failure !== null) return failure;
  return { state: "AVAILABLE", lineage };
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
    try { next = await fetchHrDecisionLoop(careerDecisionContextRevisionId); } catch { next = { state: "FAILED", code: null }; }
    if (generation.current === current) setLoop(next);
  }, [careerDecisionContextRevisionId]);

  useEffect(() => { void reload(); }, [reload]);

  const loadNextContext = useCallback(async (revisionId: string) => {
    setNextContext({ state: "LOADING" });
    let next: DecisionContextLineageState;
    try { next = await readDecisionContextLineage(revisionId); } catch { next = { state: "FAILED", code: null }; }
    setNextContext(next);
  }, []);

  useEffect(() => {
    if (initialDecisionContextRevisionId !== null && initialDecisionContextRevisionId.length > 0) void loadNextContext(initialDecisionContextRevisionId);
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
