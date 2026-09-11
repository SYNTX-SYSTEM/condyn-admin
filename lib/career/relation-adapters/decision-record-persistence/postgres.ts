import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { DecisionAuthorityGrantRevisionRepository } from "../../relation/decision-authority";
import type { CareerDecisionContextRevisionRepository } from "../../relation/decision-context";
import { assertHumanDecisionRecord, assertHumanDecisionWitnesses, sameHumanDecision, type HumanDecisionRecord, type HumanDecisionRecordRepository } from "../../relation/decision-record";
import type { RecommendationProposalRepository } from "../../relation/recommendation-proposal";
import { humanDecisionRecordDecisionClasses, humanDecisionRecordEvidenceReferences, humanDecisionRecords, humanDecisionRecordSubjectKinds, humanDecisionRecordSubjects } from "./postgres-schema";
const fail=(code:string):never=>{throw new Error(code)};
const equal=(a:readonly unknown[],b:readonly unknown[])=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const key=(s:{recommendationProposalId:string;sourceEvolutionInputItemOrdinal:number})=>`${s.recommendationProposalId}:${String(s.sourceEvolutionInputItemOrdinal).padStart(12,"0")}`;
/** Immutable physical storage validates the declaration against exact historical witnesses. */
export class PostgresHumanDecisionRecordRepository implements HumanDecisionRecordRepository {
  constructor(private readonly database:PostgresJsDatabase,private readonly contexts:CareerDecisionContextRevisionRepository,private readonly authorities:DecisionAuthorityGrantRevisionRepository,private readonly proposals:RecommendationProposalRepository) {}
  private async witnesses(value:HumanDecisionRecord) {
    try {
      const [context,authority,proposal]=await Promise.all([this.contexts.getCareerDecisionContextRevisionById(value.careerDecisionContextRevisionId),this.authorities.getDecisionAuthorityGrantRevisionById(value.decisionAuthorityGrantRevisionId),this.proposals.getRecommendationProposalById(value.recommendationProposalId)]);
      if(!context||!authority||!proposal) return fail("ERR_HUMAN_DECISION_PERSISTENCE_FAILED");
      assertHumanDecisionWitnesses(value,context,authority,proposal);
    } catch { fail("ERR_HUMAN_DECISION_PERSISTENCE_FAILED"); }
  }
  async getHumanDecisionRecordById(id:string):Promise<HumanDecisionRecord|null> {
    try {
      const rows=await this.database.select().from(humanDecisionRecords).where(eq(humanDecisionRecords.humanDecisionRecordId,id)).limit(1);
      if(!rows.length) return null;
      const row=rows[0],value=row.payload;
      assertHumanDecisionRecord(value);
      if(row.humanDecisionRecordId!==value.humanDecisionRecordId||row.careerDecisionContextRevisionId!==value.careerDecisionContextRevisionId||row.decisionAuthorityGrantRevisionId!==value.decisionAuthorityGrantRevisionId||row.recommendationProposalId!==value.recommendationProposalId||row.declarantActorId!==value.declarantActorId||row.declarationClass!==value.declarationClass||row.declaredAt!==value.declaredAt||row.authorityScope!==value.authorityScope||row.schemaVersion!==value.schemaVersion||row.createdAt!==value.createdAt) fail("ERR_HUMAN_DECISION_PERSISTENCE_FAILED");
      const [subjects,evidence,classes,kinds]=await Promise.all([this.database.select().from(humanDecisionRecordSubjects).where(eq(humanDecisionRecordSubjects.humanDecisionRecordId,id)),this.database.select().from(humanDecisionRecordEvidenceReferences).where(eq(humanDecisionRecordEvidenceReferences.humanDecisionRecordId,id)),this.database.select().from(humanDecisionRecordDecisionClasses).where(eq(humanDecisionRecordDecisionClasses.humanDecisionRecordId,id)),this.database.select().from(humanDecisionRecordSubjectKinds).where(eq(humanDecisionRecordSubjectKinds.humanDecisionRecordId,id))]);
      if(!equal(value.decisionSubjects.map(key),subjects.map(key).sort())||!equal(value.declarationEvidenceRefs,evidence.map(v=>v.declarationEvidenceRef).sort())||!equal(value.permittedDecisionClasses,classes.map(v=>v.decisionClass).sort())||!equal(value.permittedSubjectKinds,kinds.map(v=>v.subjectKind).sort())) fail("ERR_HUMAN_DECISION_PERSISTENCE_FAILED");
      await this.witnesses(value); return structuredClone(value);
    } catch { return fail("ERR_HUMAN_DECISION_PERSISTENCE_FAILED"); }
  }
  async persistHumanDecisionRecord(value:HumanDecisionRecord):Promise<HumanDecisionRecord> {
    assertHumanDecisionRecord(value);
    const existing=await this.getHumanDecisionRecordById(value.humanDecisionRecordId);
    if(existing) { if(!sameHumanDecision(existing,value)) fail("ERR_HUMAN_DECISION_IMMUTABLE_CONFLICT"); return existing; }
    await this.witnesses(value);
    try { await this.database.transaction(async transaction=>{
      await transaction.insert(humanDecisionRecords).values({humanDecisionRecordId:value.humanDecisionRecordId,careerDecisionContextRevisionId:value.careerDecisionContextRevisionId,decisionAuthorityGrantRevisionId:value.decisionAuthorityGrantRevisionId,recommendationProposalId:value.recommendationProposalId,declarantActorId:value.declarantActorId,declarationClass:value.declarationClass,declaredAt:value.declaredAt,authorityScope:value.authorityScope,schemaVersion:value.schemaVersion,createdAt:value.createdAt,payload:structuredClone(value)}).onConflictDoNothing();
      for(const subject of value.decisionSubjects) await transaction.insert(humanDecisionRecordSubjects).values({referenceId:`${value.humanDecisionRecordId}:subject:${key(subject)}`,humanDecisionRecordId:value.humanDecisionRecordId,recommendationProposalId:subject.recommendationProposalId,sourceEvolutionInputItemOrdinal:subject.sourceEvolutionInputItemOrdinal}).onConflictDoNothing();
      for(const ref of value.declarationEvidenceRefs) await transaction.insert(humanDecisionRecordEvidenceReferences).values({referenceId:`${value.humanDecisionRecordId}:evidence:${ref}`,humanDecisionRecordId:value.humanDecisionRecordId,declarationEvidenceRef:ref}).onConflictDoNothing();
      for(const decisionClass of value.permittedDecisionClasses) await transaction.insert(humanDecisionRecordDecisionClasses).values({referenceId:`${value.humanDecisionRecordId}:class:${decisionClass}`,humanDecisionRecordId:value.humanDecisionRecordId,decisionClass}).onConflictDoNothing();
      for(const subjectKind of value.permittedSubjectKinds) await transaction.insert(humanDecisionRecordSubjectKinds).values({referenceId:`${value.humanDecisionRecordId}:kind:${subjectKind}`,humanDecisionRecordId:value.humanDecisionRecordId,subjectKind}).onConflictDoNothing();
    }); } catch { return fail("ERR_HUMAN_DECISION_PERSISTENCE_FAILED"); }
    const reread=await this.getHumanDecisionRecordById(value.humanDecisionRecordId);
    if(!reread) return fail("ERR_HUMAN_DECISION_PERSISTENCE_FAILED");
    if(!sameHumanDecision(reread,value)) fail("ERR_HUMAN_DECISION_IMMUTABLE_CONFLICT");
    return reread;
  }
}
