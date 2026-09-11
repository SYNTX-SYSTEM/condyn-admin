import { randomBytes } from "node:crypto";
import { sql as drizzleSql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { closeT12AHistoricalFixture, createT12AHistoricalClient, readyT12AHistoricalGraph, transactionScopedT12AHistoricalGraph } from "./t12a-historical-fixture";

const loadAdapter = () => import("../../../../lib/career/relation-adapters/action-intent-persistence") as Promise<any>;
const missing = "DAINT_00000000000000000000000000000000";

afterAll(closeT12AHistoricalFixture);

async function repository(graph: Awaited<ReturnType<typeof readyT12AHistoricalGraph>>) {
  const adapter = await loadAdapter();
  return new adapter.PostgresCareerDecisionActionIntentRepository(graph.first.db, graph.records);
}

async function transactionScopedActionIntents(
  database: any,
  graph: Awaited<ReturnType<typeof readyT12AHistoricalGraph>>,
) {
  const adapter = await loadAdapter();
  const historical = transactionScopedT12AHistoricalGraph(
    database,
    graph.evolution,
    graph.implementations,
  );
  const intents = new adapter.PostgresCareerDecisionActionIntentRepository(
    database,
    historical.records,
  );
  return { historical, intents };
}

async function rollback(
  graph: Awaited<ReturnType<typeof readyT12AHistoricalGraph>>,
  operation: (
    transaction: any,
    scoped: Awaited<ReturnType<typeof transactionScopedActionIntents>>,
  ) => Promise<void>,
) {
  await graph.first.db.transaction(async transaction => {
    const scoped = await transactionScopedActionIntents(transaction, graph);
    await operation(transaction, scoped);
    throw new Error("rollback");
  }).catch(error => {
    if (error.message !== "rollback") throw error;
  });
}

describe("T12A PostgreSQL immutable CareerDecisionActionIntent RED contract", () => {
  it("persists exact multi-subject DAINT, mandatory-rereads detached state, restarts, and reports NOT_FOUND", async () => {
    const graph = await readyT12AHistoricalGraph(); const intents = await repository(graph);
    await expect(intents.persistCareerDecisionActionIntent(graph.actionIntent)).resolves.toEqual(graph.actionIntent);
    const first = await intents.getCareerDecisionActionIntentById(graph.actionIntent.careerDecisionActionIntentId); expect(first).toEqual(graph.actionIntent); (first as any).operationDescription = "mutated";
    await expect(intents.getCareerDecisionActionIntentById(graph.actionIntent.careerDecisionActionIntentId)).resolves.toEqual(graph.actionIntent);
    await graph.first.sql.end({ timeout: 5 }); const fresh = await createT12AHistoricalClient(); const adapter = await loadAdapter(); const restarted = new adapter.PostgresCareerDecisionActionIntentRepository(fresh.db, transactionScopedT12AHistoricalGraph(fresh.db, graph.evolution, graph.implementations).records);
    await expect(restarted.getCareerDecisionActionIntentById(graph.actionIntent.careerDecisionActionIntentId)).resolves.toEqual(graph.actionIntent); await expect(restarted.getCareerDecisionActionIntentById(missing)).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_NOT_FOUND"); await fresh.sql.end({ timeout: 5 });
  });

  it("is idempotent for exact state and never overwrites createdAt or semantic same-ID divergence", async () => {
    const graph = await readyT12AHistoricalGraph(); const intents = await repository(graph); await intents.persistCareerDecisionActionIntent(graph.actionIntent); await expect(intents.persistCareerDecisionActionIntent(graph.actionIntent)).resolves.toEqual(graph.actionIntent);
    for (const divergent of [{ ...graph.actionIntent, createdAt: "2028-02-01T00:00:00.000Z" }, { ...graph.actionIntent, operationDescription: "other" }]) await expect(intents.persistCareerDecisionActionIntent(divergent)).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_IMMUTABLE_CONFLICT");
    await expect(intents.getCareerDecisionActionIntentById(graph.actionIntent.careerDecisionActionIntentId)).resolves.toEqual(graph.actionIntent);
  });

  it("fails closed for every root and payload witness corruption", async () => {
    const graph = await readyT12AHistoricalGraph(); const intents = await repository(graph); await intents.persistCareerDecisionActionIntent(graph.actionIntent);
    for (const column of ["human_decision_record_id", "career_decision_context_revision_id", "decision_authority_grant_revision_id", "recommendation_proposal_id", "declared_by_actor_id", "source_declaration_class", "action_intent_class", "operation_description", "declared_at", "schema_version"]) {
      await rollback(graph, async (transaction, scoped) => {
        await transaction.execute(
          drizzleSql.raw(
            `UPDATE career_decision_action_intents SET ${column}='BROKEN' WHERE career_decision_action_intent_id='${graph.actionIntent.careerDecisionActionIntentId}'`
          )
        );

        await expect(
          scoped.historical.records.getHumanDecisionRecordById(
            graph.decisionRecord.humanDecisionRecordId
          )
        ).resolves.toEqual(graph.decisionRecord);

        await expect(
          scoped.intents.getCareerDecisionActionIntentById(
            graph.actionIntent.careerDecisionActionIntentId
          )
        ).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");
      });
    }

    for (const payload of [
      `jsonb_set(payload,'{careerDecisionActionIntentId}','"DAINT_00000000000000000000000000000000"'::jsonb)`,
      `jsonb_set(payload,'{declaredByActorId}','"PAYLOAD_OTHER"'::jsonb)`,
      `jsonb_set(payload,'{operationDescription}','"payload operation"'::jsonb)`,
    ]) {
      await rollback(graph, async (transaction, scoped) => {
        await transaction.execute(drizzleSql.raw(
          `UPDATE career_decision_action_intents SET payload=${payload}
           WHERE career_decision_action_intent_id='${graph.actionIntent.careerDecisionActionIntentId}'`
        ));
        await expect(
          scoped.intents.getCareerDecisionActionIntentById(
            graph.actionIntent.careerDecisionActionIntentId
          )
        ).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");
      });
    }

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `UPDATE career_decision_action_intents SET created_at='not-an-iso-timestamp'
         WHERE career_decision_action_intent_id='${graph.actionIntent.careerDecisionActionIntentId}'`
      ));
      await expect(
        scoped.intents.getCareerDecisionActionIntentById(
          graph.actionIntent.careerDecisionActionIntentId
        )
      ).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");
    });

    await expect(
      intents.getCareerDecisionActionIntentById(
        graph.actionIntent.careerDecisionActionIntentId
      )
    ).resolves.toEqual(graph.actionIntent);
  });

  it("fails closed for missing, extra, duplicate, foreign, and wrong-ordinal subject rows", async () => {
    const graph = await readyT12AHistoricalGraph();
    const intents = await repository(graph);
    await intents.persistCareerDecisionActionIntent(graph.actionIntent);

    const id = graph.actionIntent.careerDecisionActionIntentId;
    const rcp = graph.actionIntent.recommendationProposalId;
    const firstOrdinal = graph.actionIntent.decisionSubjects[0].sourceEvolutionInputItemOrdinal;

    const invalid = async (
      transaction: any,
      scoped: Awaited<ReturnType<typeof transactionScopedActionIntents>>,
    ) => {
      await expect(
        scoped.intents.getCareerDecisionActionIntentById(id)
      ).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");
    };

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `DELETE FROM career_decision_action_intent_subjects
         WHERE career_decision_action_intent_id='${id}'
         AND source_evolution_input_item_ordinal=${firstOrdinal}`
      ));
      await invalid(transaction, scoped);
    });

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `INSERT INTO career_decision_action_intent_subjects
         (reference_id,career_decision_action_intent_id,recommendation_proposal_id,source_evolution_input_item_ordinal)
         VALUES('extra-subject','${id}','${rcp}',99)`
      ));
      await invalid(transaction, scoped);
    });

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `INSERT INTO career_decision_action_intent_subjects
         (reference_id,career_decision_action_intent_id,recommendation_proposal_id,source_evolution_input_item_ordinal)
         VALUES('duplicate-subject','${id}','${rcp}',${firstOrdinal})`
      ));
      await invalid(transaction, scoped);
    });

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `UPDATE career_decision_action_intent_subjects
         SET recommendation_proposal_id='RCP_11111111111111111111111111111111'
         WHERE career_decision_action_intent_id='${id}'
         AND source_evolution_input_item_ordinal=${firstOrdinal}`
      ));
      await invalid(transaction, scoped);
    });

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `UPDATE career_decision_action_intent_subjects
         SET source_evolution_input_item_ordinal=99
         WHERE career_decision_action_intent_id='${id}'
         AND source_evolution_input_item_ordinal=${firstOrdinal}`
      ));
      await invalid(transaction, scoped);
    });

    await expect(
      intents.getCareerDecisionActionIntentById(id)
    ).resolves.toEqual(graph.actionIntent);
  });

  it("fails closed for missing, extra, duplicate, and blank evidence rows", async () => {
    const graph = await readyT12AHistoricalGraph();
    const intents = await repository(graph);
    await intents.persistCareerDecisionActionIntent(graph.actionIntent);

    const id = graph.actionIntent.careerDecisionActionIntentId;
    const evidence = graph.actionIntent.actionIntentEvidenceRefs[0];

    const invalid = async (
      scoped: Awaited<ReturnType<typeof transactionScopedActionIntents>>,
    ) => {
      await expect(
        scoped.intents.getCareerDecisionActionIntentById(id)
      ).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");
    };

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `DELETE FROM career_decision_action_intent_evidence_references
         WHERE career_decision_action_intent_id='${id}'`
      ));
      await invalid(scoped);
    });

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `INSERT INTO career_decision_action_intent_evidence_references
         (reference_id,career_decision_action_intent_id,action_intent_evidence_ref)
         VALUES('extra-evidence','${id}','evidence://extra')`
      ));
      await invalid(scoped);
    });

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `INSERT INTO career_decision_action_intent_evidence_references
         (reference_id,career_decision_action_intent_id,action_intent_evidence_ref)
         VALUES('duplicate-evidence','${id}','${evidence}')`
      ));
      await invalid(scoped);
    });

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `UPDATE career_decision_action_intent_evidence_references
         SET action_intent_evidence_ref=' '
         WHERE career_decision_action_intent_id='${id}'`
      ));
      await invalid(scoped);
    });

    await expect(
      intents.getCareerDecisionActionIntentById(id)
    ).resolves.toEqual(graph.actionIntent);
  });

  it("fails closed when exact historical DCR, DCTXREV, DAR, or RCP lineage is corrupted", async () => {
    const graph = await readyT12AHistoricalGraph();
    const intents = await repository(graph);
    await intents.persistCareerDecisionActionIntent(graph.actionIntent);

    const intentId = graph.actionIntent.careerDecisionActionIntentId;
    const dcrId = graph.decisionRecord.humanDecisionRecordId;
    const dctxId = graph.decisionRecord.careerDecisionContextRevisionId;
    const darId = graph.decisionRecord.decisionAuthorityGrantRevisionId;
    const rcpId = graph.decisionRecord.recommendationProposalId;
    const firstOrdinal = graph.decisionRecord.decisionSubjects[0].sourceEvolutionInputItemOrdinal;

    const invalid = async (
      scoped: Awaited<ReturnType<typeof transactionScopedActionIntents>>,
    ) => {
      await expect(
        scoped.intents.getCareerDecisionActionIntentById(intentId)
      ).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");
    };

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `UPDATE human_decision_records
         SET declarant_actor_id='BROKEN'
         WHERE human_decision_record_id='${dcrId}'`
      ));
      await invalid(scoped);
    });

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `UPDATE human_decision_records
         SET declaration_class='REQUEST_FURTHER_EVIDENCE'
         WHERE human_decision_record_id='${dcrId}'`
      ));
      await invalid(scoped);
    });

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `DELETE FROM human_decision_record_subjects
         WHERE human_decision_record_id='${dcrId}'
         AND source_evolution_input_item_ordinal=${firstOrdinal}`
      ));
      await invalid(scoped);
    });

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `INSERT INTO human_decision_record_subjects
         (reference_id,human_decision_record_id,recommendation_proposal_id,source_evolution_input_item_ordinal)
         VALUES('t12a-extra-dcr-subject','${dcrId}','${rcpId}',99)`
      ));
      await invalid(scoped);
    });

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `UPDATE human_decision_record_subjects
         SET source_evolution_input_item_ordinal=99
         WHERE human_decision_record_id='${dcrId}'
         AND source_evolution_input_item_ordinal=${firstOrdinal}`
      ));
      await invalid(scoped);
    });

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `UPDATE career_decision_context_revisions
         SET authority_scope='BROKEN'
         WHERE career_decision_context_revision_id='${dctxId}'`
      ));
      await invalid(scoped);
    });

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `UPDATE decision_authority_grant_revisions
         SET authority_scope='BROKEN'
         WHERE decision_authority_grant_revision_id='${darId}'`
      ));
      await invalid(scoped);
    });

    await rollback(graph, async (transaction, scoped) => {
      await transaction.execute(drizzleSql.raw(
        `UPDATE recommendation_proposals
         SET schema_version='BROKEN'
         WHERE recommendation_proposal_id='${rcpId}'`
      ));
      await invalid(scoped);
    });

    await expect(
      intents.getCareerDecisionActionIntentById(intentId)
    ).resolves.toEqual(graph.actionIntent);
  });

  it("persists a DAINT declared after DAR effectiveUntil because only the historical DCR consumed DAR time", async () => {
    const graph = await readyT12AHistoricalGraph();
    const intents = await repository(graph);
    expect(graph.decisionRecord.declaredAt < graph.authority.effectiveUntil!).toBe(true);
    expect(graph.actionIntent.declaredAt > graph.authority.effectiveUntil!).toBe(true);
    await expect(
      intents.persistCareerDecisionActionIntent(graph.actionIntent)
    ).resolves.toEqual(graph.actionIntent);
  });

  it("atomically rolls back root, subject, and evidence insertion failures to zero durable rows before clean retry", async () => {
    const graph = await readyT12AHistoricalGraph();
    const intents = await repository(graph);
    const domain = await import("../../../../lib/career/relation/action-intent");

    const tables = [
      "career_decision_action_intents",
      "career_decision_action_intent_subjects",
      "career_decision_action_intent_evidence_references",
    ] as const;

    const count = async (table: string, id: string) => {
      const rows = await graph.first.sql.unsafe(
        `SELECT count(*)::int AS count
         FROM ${table}
         WHERE career_decision_action_intent_id='${id}'`
      );
      return Number(rows[0].count);
    };

    for (const table of tables) {
      const suffix = randomBytes(4).toString("hex");
      const value = domain.createCareerDecisionActionIntent(
        graph.decisionRecord,
        {
          humanDecisionRecordId: graph.decisionRecord.humanDecisionRecordId,
          declaredByActorId: graph.decisionRecord.declarantActorId,
          actionIntentClass: "RECOMMENDATION_OPERATIONALIZATION",
          operationDescription: `Operationalize recommendation ${table}`,
          declaredAt: graph.actionIntent.declaredAt,
          actionIntentEvidenceRefs: [`evidence://t12a/atomic/${table}/${suffix}`],
          createdAt: graph.actionIntent.createdAt,
        }
      );

      const fn = `fail_t12a_${suffix}`;
      const trigger = `trigger_t12a_${suffix}`;

      await graph.first.sql.unsafe(
        `CREATE FUNCTION ${fn}() RETURNS trigger
         LANGUAGE plpgsql AS $$
         BEGIN
           RAISE EXCEPTION 'injected';
         END;
         $$`
      );

      await graph.first.sql.unsafe(
        `CREATE TRIGGER ${trigger}
         BEFORE INSERT ON ${table}
         FOR EACH ROW EXECUTE FUNCTION ${fn}()`
      );

      await expect(
        intents.persistCareerDecisionActionIntent(value)
      ).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");

      for (const durableTable of tables) {
        expect(
          await count(durableTable, value.careerDecisionActionIntentId)
        ).toBe(0);
      }

      await graph.first.sql.unsafe(`DROP TRIGGER ${trigger} ON ${table}`);
      await graph.first.sql.unsafe(`DROP FUNCTION ${fn}()`);

      await expect(
        intents.persistCareerDecisionActionIntent(value)
      ).resolves.toEqual(value);

      await expect(
        intents.getCareerDecisionActionIntentById(
          value.careerDecisionActionIntentId
        )
      ).resolves.toEqual(value);
    }
  });

  it("exposes no mutable or current-state persistence operation", async () => {
    const graph = await readyT12AHistoricalGraph();
    const intents = await repository(graph);
    const surface = Object.getOwnPropertyNames(Object.getPrototypeOf(intents));
    expect(surface).not.toEqual(expect.arrayContaining([
      "getCurrentCareerDecisionActionIntent",
      "getLatestCareerDecisionActionIntent",
      "updateCareerDecisionActionIntent",
      "repairCareerDecisionActionIntent",
      "replaceCareerDecisionActionIntent",
      "supersedeCareerDecisionActionIntent",
    ]));
  });
});
