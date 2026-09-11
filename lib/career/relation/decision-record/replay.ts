import type { DecisionAuthorityGrantRevisionRepository } from "../decision-authority";
import type { CareerDecisionContextRevisionRepository } from "../decision-context";
import type { RecommendationProposalRepository } from "../recommendation-proposal";
import { assertHumanDecisionRecord, assertHumanDecisionWitnesses, deriveHumanDecisionRecordId } from "./contract";
import type { HumanDecisionRecordRepository } from "./persistence";
import type { HumanDecisionRecord } from "./types";
const fail=():never=>{throw new Error("ERR_HUMAN_DECISION_REPLAY_MISMATCH")};
export type HumanDecisionReplayMode="BYTE_REPLAY"|"SEMANTIC_REPLAY"|"DERIVATION_REPLAY";
export interface HumanDecisionReplayDependencies{records:HumanDecisionRecordRepository;contexts:CareerDecisionContextRevisionRepository;authorities:DecisionAuthorityGrantRevisionRepository;proposals:RecommendationProposalRepository;}
async function stored(id:string,d:HumanDecisionReplayDependencies):Promise<HumanDecisionRecord>{try{const v=await d.records.getHumanDecisionRecordById(id);if(!v)throw new Error("ERR_HUMAN_DECISION_NOT_FOUND");assertHumanDecisionRecord(v);return v}catch(error){if(error instanceof Error&&error.message==="ERR_HUMAN_DECISION_NOT_FOUND")throw error;return fail()}}
async function validate(id:string,d:HumanDecisionReplayDependencies){const record=await stored(id,d);try{const [context,authority,proposal]=await Promise.all([d.contexts.getCareerDecisionContextRevisionById(record.careerDecisionContextRevisionId),d.authorities.getDecisionAuthorityGrantRevisionById(record.decisionAuthorityGrantRevisionId),d.proposals.getRecommendationProposalById(record.recommendationProposalId)]);if(!context||!authority||!proposal)return fail();assertHumanDecisionWitnesses(record,context,authority,proposal);const {humanDecisionRecordId,...withoutId}=record;const {createdAt:_createdAt,...semantic}=withoutId;if(humanDecisionRecordId!==deriveHumanDecisionRecordId(semantic))fail();return structuredClone(record)}catch{return fail()}}
export async function byteReplayHumanDecisionRecord(id:string,d:HumanDecisionReplayDependencies){return structuredClone(await stored(id,d))}
export async function semanticReplayHumanDecisionRecord(id:string,d:HumanDecisionReplayDependencies){return validate(id,d)}
/** Identity-only historical validation; a missing human declaration is never regenerated. */
export async function derivationReplayHumanDecisionRecord(id:string,d:HumanDecisionReplayDependencies){return validate(id,d)}
