/**
 * P7 inverse proof, executed in a second process: walks from one child DREV back to
 * the root DREV through the G3 chain by exact ids only. No step orders by time or
 * selects a latest row; every lookup is by an exact stored identifier and must
 * resolve to exactly one artifact. Prints the walked ids as JSON on stdout.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { PostgresDecisionContextRevisionRepository } from "../../../lib/decision-adapters/revision-persistence";
import { createBoundAuthoritativeStateReader } from "../../../lib/decision-core";
import { createCareerCanonicalAuthoritativeStateResolvers } from "../../../lib/decision-adapters/career-canonical";
import { createLocalCareerCanonicalProducerRepositories } from "../../../lib/decision-runtime/local/career-canonical-producers";
import { careerDecisionChainRepositories } from "./postgres-decision-chain";
import { verifyDisposableTestDatabase } from "../../../lib/database-isolation/verification";

const fail = (code: string): never => { throw new Error(code); };

async function main(): Promise<void> {
  const [childRevisionId] = process.argv.slice(2);
  if (!childRevisionId) fail("ERR_P7_INVERSE_CHILD_ID_MISSING");
  // Runs outside vitest, so outside the gate: positively identify the disposable database first.
  const { url } = await verifyDisposableTestDatabase(process.env.DATABASE_URL);
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    const db = drizzle(sql);
    const revisions = new PostgresDecisionContextRevisionRepository(db);
    const producers = createLocalCareerCanonicalProducerRepositories(db);
    const chain = careerDecisionChainRepositories(db, producers.recommendationProposals as never);
    const reader = createBoundAuthoritativeStateReader(createCareerCanonicalAuthoritativeStateResolvers(producers));

    const child = await revisions.getRevisionById(childRevisionId) ?? fail("ERR_P7_INVERSE_CHILD_NOT_FOUND");
    const rootRevisionId = child.previousRevisionId ?? fail("ERR_P7_INVERSE_CHILD_IS_ROOT");
    const root = await revisions.getRevisionById(rootRevisionId) ?? fail("ERR_P7_INVERSE_ROOT_NOT_FOUND");
    if (root.previousRevisionId !== null) fail("ERR_P7_INVERSE_ROOT_HAS_PREDECESSOR");

    const observations = child.context.items.filter((item) => item.role === "OBSERVATION");
    if (observations.length !== 1) fail("ERR_P7_INVERSE_OBSERVATION_COUNT");
    const provenance = observations[0].provenance;
    if (provenance.origin !== "AUTHORITATIVE_STATE") return fail("ERR_P7_INVERSE_OBSERVATION_PROVENANCE");
    const covd = (await reader.resolve(provenance.stateReference)).payload as { careerOutcomeValenceDeclarationId: string; careerOutcomeRoleDeclarationId: string };
    const cord = await chain.outcomeRoles.getCareerOutcomeRoleDeclarationById(covd.careerOutcomeRoleDeclarationId);
    const ascad = await chain.associations.getCareerActionStateChangeAssociationDeclarationById(cord.careerActionStateChangeAssociationDeclarationId);
    const scd = await chain.stateChanges.getCareerStateChangeDeclarationById(ascad.careerStateChangeDeclarationId);
    const aoc = await chain.occurrences.getCareerActionOccurrenceById(scd.careerActionOccurrenceId);
    const ectx = await chain.executionContexts.getCareerExecutionContextRevisionById(aoc.careerExecutionContextRevisionId);
    const eagr = await chain.executionGrants.getCareerExecutionAuthorityGrantRevisionById(ectx.careerExecutionAuthorityGrantRevisionId);
    const hcom = await chain.commitments.getCareerHumanCommitmentById(eagr.careerHumanCommitmentId);
    const daint = await chain.intents.getCareerDecisionActionIntentById(hcom.careerDecisionActionIntentId);
    const dcr = await chain.records.getHumanDecisionRecordById(daint.humanDecisionRecordId) ?? fail("ERR_P7_INVERSE_DCR_NOT_FOUND");
    const dctxrev = await chain.contexts.getCareerDecisionContextRevisionById(dcr.careerDecisionContextRevisionId) ?? fail("ERR_P7_INVERSE_DCTXREV_NOT_FOUND");

    // The binding is addressed by the exact pair it binds; exactly one row may exist for that pair.
    const bindingRows = await sql.unsafe(
      "SELECT career_decision_context_decision_revision_binding_id AS id FROM career_decision_context_decision_revision_bindings WHERE career_decision_context_revision_id = $1 AND decision_context_revision_id = $2",
      [dctxrev.careerDecisionContextRevisionId, root.revisionId]
    ) as unknown as Array<{ id: string }>;
    if (bindingRows.length !== 1) fail(`ERR_P7_INVERSE_BINDING_COUNT_${bindingRows.length}`);
    const binding = await chain.bindings.getCareerDecisionContextDecisionRevisionBindingById(bindingRows[0].id) ?? fail("ERR_P7_INVERSE_BINDING_NOT_FOUND");
    if (binding.decisionContextRevision.revisionId !== root.revisionId) fail("ERR_P7_INVERSE_BINDING_ROOT_MISMATCH");
    if (binding.recommendationProposalWitness.artifactId !== dctxrev.recommendationProposalId) fail("ERR_P7_INVERSE_WITNESS_MISMATCH");
    const rcp = (await reader.resolve(binding.recommendationProposalWitness)).payload as { recommendationProposalId: string };
    const dar = await chain.authorities.getDecisionAuthorityGrantRevisionById(dctxrev.decisionAuthorityGrantRevisionId) ?? fail("ERR_P7_INVERSE_DAR_NOT_FOUND");

    process.stdout.write(JSON.stringify({
      childRevisionId: child.revisionId,
      rootRevisionId: root.revisionId,
      covd: covd.careerOutcomeValenceDeclarationId,
      cord: cord.careerOutcomeRoleDeclarationId,
      ascad: ascad.careerActionStateChangeAssociationDeclarationId,
      scd: scd.careerStateChangeDeclarationId,
      aoc: aoc.careerActionOccurrenceId,
      ectxrev: ectx.careerExecutionContextRevisionId,
      eagr: eagr.careerExecutionAuthorityGrantRevisionId,
      hcom: hcom.careerHumanCommitmentId,
      daint: daint.careerDecisionActionIntentId,
      dcr: dcr.humanDecisionRecordId,
      dctxrev: dctxrev.careerDecisionContextRevisionId,
      binding: binding.careerDecisionContextDecisionRevisionBindingId,
      rcp: rcp.recommendationProposalId,
      dar: dar.decisionAuthorityGrantRevisionId
    }));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
