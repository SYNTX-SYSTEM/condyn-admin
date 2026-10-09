import { asc, eq } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { HumanDecisionProducerDependencies } from "../relation/decision-record";
import { humanDecisionRecords } from "../relation-adapters/decision-record-persistence";
import {
  PostgresCareerDecisionActionIntentRepository,
  careerDecisionActionIntents
} from "../relation-adapters/action-intent-persistence";
import {
  PostgresCareerHumanCommitmentRepository,
  careerHumanCommitments
} from "../relation-adapters/human-commitment-persistence";
import {
  PostgresCareerExecutionAuthorityGrantRevisionRepository,
  careerExecutionAuthorityGrantRevisions
} from "../relation-adapters/execution-authority-grant-persistence";
import {
  PostgresCareerExecutionContextRevisionRepository,
  careerExecutionContextRevisions
} from "../relation-adapters/execution-context-revision-persistence";
import {
  PostgresCareerActionOccurrenceRepository,
  careerActionOccurrences
} from "../relation-adapters/action-occurrence-persistence";
import {
  PostgresCareerStateChangeDeclarationRepository,
  careerStateChangeDeclarations
} from "../relation-adapters/state-change-declaration-persistence";
import {
  PostgresCareerActionStateChangeAssociationDeclarationRepository,
  careerActionStateChangeAssociationDeclarations
} from "../relation-adapters/action-state-change-association-declaration-persistence";
import {
  PostgresCareerOutcomeRoleDeclarationRepository,
  careerOutcomeRoleDeclarations
} from "../relation-adapters/outcome-role-declaration-persistence";
import {
  PostgresCareerOutcomeValenceDeclarationRepository,
  careerOutcomeValenceDeclarations
} from "../relation-adapters/outcome-valence-declaration-persistence";
import {
  PostgresCareerOutcomeValenceFeedbackAdmissionDeclarationRepository,
  careerOutcomeValenceFeedbackAdmissionDeclarations
} from "../relation-adapters/outcome-valence-feedback-admission-declaration-persistence";
import {
  PostgresCareerOutcomeValenceFeedbackTargetDeclarationRepository,
  careerOutcomeValenceFeedbackTargetDeclarations
} from "../relation-adapters/outcome-valence-feedback-target-declaration-persistence";
import {
  PostgresCareerOutcomeValenceFeedbackTargetRevisionBindingRepository,
  careerOutcomeValenceFeedbackTargetRevisionBindings
} from "../relation-adapters/outcome-valence-feedback-target-revision-binding-persistence";
import { PostgresCareerOutcomeValenceFeedbackContextRevisionRepository } from "../relation-adapters/outcome-valence-feedback-context-revision-persistence";
import { careerOutcomeValenceFeedbackContextRevisions } from "../relation-adapters/outcome-valence-feedback-context-revision-persistence/postgres-schema";
import {
  HR_DECISION_LOOP_READ_MODEL_SCHEMA_VERSION,
  type HrDecisionLoopReadModel,
  type HrDecisionLoopRegion
} from "./read-model";

export const HR_DECISION_LOOP_CONTEXT_NOT_FOUND = "ERR_HR_DECISION_LOOP_CONTEXT_NOT_FOUND";
export const HR_DECISION_LOOP_CONTEXT_INVALID = "ERR_HR_DECISION_LOOP_CONTEXT_INVALID";
export const HR_DECISION_LOOP_WITNESS_NOT_FOUND = "ERR_HR_DECISION_LOOP_WITNESS_NOT_FOUND";
export const HR_DECISION_LOOP_INDEX_FAILED = "ERR_HR_DECISION_LOOP_INDEX_FAILED";

const fail = (code: string): never => { throw new Error(code); };

/** Exact-id readers for one artifact family; the index is relational, the reread is sealed. */
export interface ExactIndexedReader<T> {
  /** Returns ids whose lineage column names the exact context id, ordered by id (never by time). */
  indexIds(exactContextId: string): Promise<string[]>;
  /** Exact reread through the sealed repository; null or throw are both represented, never repaired. */
  readById(id: string): Promise<T | null>;
}

export interface HrDecisionLoopReadDependencies extends HumanDecisionProducerDependencies {
  decisionIndex: ExactIndexedReader<HrDecisionLoopReadModel["decisions"]["artifacts"][number]>;
  actionIntents: ExactIndexedReader<HrDecisionLoopReadModel["actionIntents"]["artifacts"][number]>;
  commitments: ExactIndexedReader<HrDecisionLoopReadModel["commitments"]["artifacts"][number]>;
  executionAuthorityGrants: ExactIndexedReader<HrDecisionLoopReadModel["executionAuthorityGrants"]["artifacts"][number]>;
  executionContexts: ExactIndexedReader<HrDecisionLoopReadModel["executionContexts"]["artifacts"][number]>;
  actionOccurrences: ExactIndexedReader<HrDecisionLoopReadModel["actionOccurrences"]["artifacts"][number]>;
  stateChanges: ExactIndexedReader<HrDecisionLoopReadModel["stateChanges"]["artifacts"][number]>;
  associations: ExactIndexedReader<HrDecisionLoopReadModel["associations"]["artifacts"][number]>;
  outcomeRoles: ExactIndexedReader<HrDecisionLoopReadModel["outcomeRoles"]["artifacts"][number]>;
  outcomeValences: ExactIndexedReader<HrDecisionLoopReadModel["outcomeValences"]["artifacts"][number]>;
  feedbackAdmissions: ExactIndexedReader<HrDecisionLoopReadModel["feedbackAdmissions"]["artifacts"][number]>;
  feedbackTargets: ExactIndexedReader<HrDecisionLoopReadModel["feedbackTargets"]["artifacts"][number]>;
  feedbackTargetBindings: ExactIndexedReader<HrDecisionLoopReadModel["feedbackTargetBindings"]["artifacts"][number]>;
  /** Index by exact parent id; the service walks parent ids recursively. */
  feedbackContextRevisions: ExactIndexedReader<HrDecisionLoopReadModel["feedbackContextRevisions"]["artifacts"][number]>;
}

export interface HrDecisionLoopReadService {
  read(careerDecisionContextRevisionId: string): Promise<HrDecisionLoopReadModel>;
}

export const UNDEFINED_TABLE_SQLSTATE = "42P01";

/** PostgreSQL undefined_table, with or without drizzle's query-error wrapper. */
export function isUndefinedTableError(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current !== null && typeof current === "object"; depth += 1) {
    if (Reflect.get(current, "code") === UNDEFINED_TABLE_SQLSTATE) return true;
    current = Reflect.get(current, "cause");
  }
  return false;
}

async function region<T>(reader: ExactIndexedReader<T>, exactContextId: string): Promise<HrDecisionLoopRegion<T>> {
  let ids: string[];
  try {
    ids = await reader.indexIds(exactContextId);
  } catch (error) {
    if (isUndefinedTableError(error)) return { state: "NOT_PROVISIONED", artifactIds: [], artifacts: [] };
    return { state: "FAILED", artifactIds: [], artifacts: [], failureCode: HR_DECISION_LOOP_INDEX_FAILED };
  }
  return rereadRegion(reader, ids);
}

async function rereadRegion<T>(reader: ExactIndexedReader<T>, ids: readonly string[]): Promise<HrDecisionLoopRegion<T>> {
  const ordered = [...new Set(ids)].sort();
  if (ordered.length === 0) return { state: "EMPTY", artifactIds: [], artifacts: [] };
  const artifacts: T[] = [];
  for (const id of ordered) {
    try {
      const value = await reader.readById(id);
      if (value === null) return { state: "FAILED", artifactIds: ordered, artifacts: [], failureCode: HR_DECISION_LOOP_WITNESS_NOT_FOUND };
      artifacts.push(value);
    } catch (error) {
      return { state: "FAILED", artifactIds: ordered, artifacts: [], failureCode: error instanceof Error && error.message.length > 0 ? error.message : "ERR_HR_DECISION_LOOP_REREAD_FAILED" };
    }
  }
  return { state: "AVAILABLE", artifactIds: ordered, artifacts };
}

/** COVFCR lineage is walked by exact parent ids only; depth is bounded, nothing is ordered by time. */
async function feedbackRevisionRegion(
  reader: HrDecisionLoopReadDependencies["feedbackContextRevisions"],
  exactContextId: string
): Promise<HrDecisionLoopReadModel["feedbackContextRevisions"]> {
  const found: string[] = [];
  let frontier = [exactContextId];
  for (let depth = 0; depth < 64 && frontier.length > 0; depth += 1) {
    const next: string[] = [];
    for (const parentId of frontier) {
      let children: string[];
      try {
        children = await reader.indexIds(parentId);
      } catch (error) {
        if (isUndefinedTableError(error)) return { state: "NOT_PROVISIONED", artifactIds: [], artifacts: [] };
        return { state: "FAILED", artifactIds: [], artifacts: [], failureCode: HR_DECISION_LOOP_INDEX_FAILED };
      }
      for (const child of children) if (!found.includes(child)) { found.push(child); next.push(child); }
    }
    frontier = next;
  }
  return rereadRegion(reader, found);
}

export function createHrDecisionLoopReadService(dependencies: HrDecisionLoopReadDependencies): HrDecisionLoopReadService {
  return {
    async read(careerDecisionContextRevisionId) {
      if (typeof careerDecisionContextRevisionId !== "string" || careerDecisionContextRevisionId.length === 0 || careerDecisionContextRevisionId.trim() !== careerDecisionContextRevisionId) {
        return fail(HR_DECISION_LOOP_CONTEXT_INVALID);
      }
      let context;
      try {
        context = await dependencies.contexts.getCareerDecisionContextRevisionById(careerDecisionContextRevisionId);
      } catch {
        return fail(HR_DECISION_LOOP_CONTEXT_INVALID);
      }
      const exactContext = context ?? fail(HR_DECISION_LOOP_CONTEXT_NOT_FOUND);
      let authority;
      let proposal;
      try {
        [authority, proposal] = await Promise.all([
          dependencies.authorities.getDecisionAuthorityGrantRevisionById(exactContext.decisionAuthorityGrantRevisionId),
          dependencies.proposals.getRecommendationProposalById(exactContext.recommendationProposalId)
        ]);
      } catch {
        return fail(HR_DECISION_LOOP_CONTEXT_INVALID);
      }
      if (!authority || !proposal) return fail(HR_DECISION_LOOP_WITNESS_NOT_FOUND);
      const id = exactContext.careerDecisionContextRevisionId;
      const model: HrDecisionLoopReadModel = {
        schemaVersion: HR_DECISION_LOOP_READ_MODEL_SCHEMA_VERSION,
        careerDecisionContextRevision: exactContext,
        decisionAuthorityGrantRevision: authority,
        recommendationProposal: proposal,
        decisions: await region(dependencies.decisionIndex, id),
        actionIntents: await region(dependencies.actionIntents, id),
        commitments: await region(dependencies.commitments, id),
        executionAuthorityGrants: await region(dependencies.executionAuthorityGrants, id),
        executionContexts: await region(dependencies.executionContexts, id),
        actionOccurrences: await region(dependencies.actionOccurrences, id),
        stateChanges: await region(dependencies.stateChanges, id),
        associations: await region(dependencies.associations, id),
        outcomeRoles: await region(dependencies.outcomeRoles, id),
        outcomeValences: await region(dependencies.outcomeValences, id),
        feedbackAdmissions: await region(dependencies.feedbackAdmissions, id),
        feedbackTargets: await region(dependencies.feedbackTargets, id),
        feedbackTargetBindings: await region(dependencies.feedbackTargetBindings, id),
        feedbackContextRevisions: await feedbackRevisionRegion(dependencies.feedbackContextRevisions, id)
      };
      return structuredClone(model);
    }
  };
}

function postgresIndex(database: PostgresJsDatabase<Record<string, unknown>>, table: PgTable, idColumn: PgColumn, lineageColumn: PgColumn) {
  return async (exactContextId: string): Promise<string[]> => {
    const rows = await database.select({ id: idColumn }).from(table).where(eq(lineageColumn, exactContextId)).orderBy(asc(idColumn));
    return rows.map(row => String(row.id));
  };
}

/**
 * Composes the sealed PostgreSQL repositories of the post-decision chain on
 * top of the sealed T11 producer dependencies. Each repository validates its
 * own exact witnesses; this composition adds relational indexes only.
 */
export function createPostgresHrDecisionLoopReadDependencies(
  database: PostgresJsDatabase<Record<string, unknown>>,
  base: HumanDecisionProducerDependencies
): HrDecisionLoopReadDependencies {
  const adapters = database as unknown as PostgresJsDatabase;
  const intents = new PostgresCareerDecisionActionIntentRepository(adapters, base.records);
  const commitments = new PostgresCareerHumanCommitmentRepository(adapters, intents);
  const grants = new PostgresCareerExecutionAuthorityGrantRevisionRepository(adapters, commitments);
  const executionContexts = new PostgresCareerExecutionContextRevisionRepository(adapters, grants);
  const occurrences = new PostgresCareerActionOccurrenceRepository(adapters, executionContexts, grants);
  const stateChanges = new PostgresCareerStateChangeDeclarationRepository(adapters, occurrences);
  const associations = new PostgresCareerActionStateChangeAssociationDeclarationRepository(adapters, stateChanges);
  const outcomeRoles = new PostgresCareerOutcomeRoleDeclarationRepository(adapters, associations);
  const outcomeValences = new PostgresCareerOutcomeValenceDeclarationRepository(adapters, outcomeRoles);
  const feedbackAdmissions = new PostgresCareerOutcomeValenceFeedbackAdmissionDeclarationRepository(adapters, outcomeValences);
  const feedbackTargets = new PostgresCareerOutcomeValenceFeedbackTargetDeclarationRepository(adapters, feedbackAdmissions);
  const feedbackBindings = new PostgresCareerOutcomeValenceFeedbackTargetRevisionBindingRepository(adapters);
  const feedbackRevisions = new PostgresCareerOutcomeValenceFeedbackContextRevisionRepository(adapters);
  return Object.freeze({
    ...base,
    decisionIndex: {
      indexIds: postgresIndex(database, humanDecisionRecords, humanDecisionRecords.humanDecisionRecordId, humanDecisionRecords.careerDecisionContextRevisionId),
      readById: (id: string) => base.records.getHumanDecisionRecordById(id)
    },
    actionIntents: {
      indexIds: postgresIndex(database, careerDecisionActionIntents, careerDecisionActionIntents.careerDecisionActionIntentId, careerDecisionActionIntents.careerDecisionContextRevisionId),
      readById: (id: string) => intents.getCareerDecisionActionIntentById(id)
    },
    commitments: {
      indexIds: postgresIndex(database, careerHumanCommitments, careerHumanCommitments.careerHumanCommitmentId, careerHumanCommitments.careerDecisionContextRevisionId),
      readById: (id: string) => commitments.getCareerHumanCommitmentById(id)
    },
    executionAuthorityGrants: {
      indexIds: postgresIndex(database, careerExecutionAuthorityGrantRevisions, careerExecutionAuthorityGrantRevisions.careerExecutionAuthorityGrantRevisionId, careerExecutionAuthorityGrantRevisions.careerDecisionContextRevisionId),
      readById: (id: string) => grants.getCareerExecutionAuthorityGrantRevisionById(id)
    },
    executionContexts: {
      indexIds: postgresIndex(database, careerExecutionContextRevisions, careerExecutionContextRevisions.careerExecutionContextRevisionId, careerExecutionContextRevisions.careerDecisionContextRevisionId),
      readById: (id: string) => executionContexts.getCareerExecutionContextRevisionById(id)
    },
    actionOccurrences: {
      indexIds: postgresIndex(database, careerActionOccurrences, careerActionOccurrences.careerActionOccurrenceId, careerActionOccurrences.careerDecisionContextRevisionId),
      readById: (id: string) => occurrences.getCareerActionOccurrenceById(id)
    },
    stateChanges: {
      indexIds: postgresIndex(database, careerStateChangeDeclarations, careerStateChangeDeclarations.careerStateChangeDeclarationId, careerStateChangeDeclarations.careerDecisionContextRevisionId),
      readById: (id: string) => stateChanges.getCareerStateChangeDeclarationById(id)
    },
    associations: {
      indexIds: postgresIndex(database, careerActionStateChangeAssociationDeclarations, careerActionStateChangeAssociationDeclarations.careerActionStateChangeAssociationDeclarationId, careerActionStateChangeAssociationDeclarations.careerDecisionContextRevisionId),
      readById: (id: string) => associations.getCareerActionStateChangeAssociationDeclarationById(id)
    },
    outcomeRoles: {
      indexIds: postgresIndex(database, careerOutcomeRoleDeclarations, careerOutcomeRoleDeclarations.careerOutcomeRoleDeclarationId, careerOutcomeRoleDeclarations.careerDecisionContextRevisionId),
      readById: (id: string) => outcomeRoles.getCareerOutcomeRoleDeclarationById(id)
    },
    outcomeValences: {
      indexIds: postgresIndex(database, careerOutcomeValenceDeclarations, careerOutcomeValenceDeclarations.careerOutcomeValenceDeclarationId, careerOutcomeValenceDeclarations.careerDecisionContextRevisionId),
      readById: (id: string) => outcomeValences.getCareerOutcomeValenceDeclarationById(id)
    },
    feedbackAdmissions: {
      indexIds: postgresIndex(database, careerOutcomeValenceFeedbackAdmissionDeclarations, careerOutcomeValenceFeedbackAdmissionDeclarations.careerOutcomeValenceFeedbackAdmissionDeclarationId, careerOutcomeValenceFeedbackAdmissionDeclarations.careerDecisionContextRevisionId),
      readById: (id: string) => feedbackAdmissions.getCareerOutcomeValenceFeedbackAdmissionDeclarationById(id)
    },
    feedbackTargets: {
      indexIds: postgresIndex(database, careerOutcomeValenceFeedbackTargetDeclarations, careerOutcomeValenceFeedbackTargetDeclarations.careerOutcomeValenceFeedbackTargetDeclarationId, careerOutcomeValenceFeedbackTargetDeclarations.careerDecisionContextRevisionId),
      readById: (id: string) => feedbackTargets.getCareerOutcomeValenceFeedbackTargetDeclarationById(id)
    },
    feedbackTargetBindings: {
      indexIds: postgresIndex(database, careerOutcomeValenceFeedbackTargetRevisionBindings, careerOutcomeValenceFeedbackTargetRevisionBindings.careerOutcomeValenceFeedbackTargetRevisionBindingId, careerOutcomeValenceFeedbackTargetRevisionBindings.targetCareerDecisionContextRevisionId),
      readById: (id: string) => feedbackBindings.getCareerOutcomeValenceFeedbackTargetRevisionBindingById(id)
    },
    feedbackContextRevisions: {
      indexIds: postgresIndex(database, careerOutcomeValenceFeedbackContextRevisions, careerOutcomeValenceFeedbackContextRevisions.careerOutcomeValenceFeedbackContextRevisionId, careerOutcomeValenceFeedbackContextRevisions.parentRevisionId),
      readById: (id: string) => feedbackRevisions.getCareerOutcomeValenceFeedbackContextRevisionById(id)
    }
  });
}
