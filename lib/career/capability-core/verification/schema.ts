import { z } from "zod";

/** Structural contract only; the publisher enforces publication cross-record gates. */
export const FinalVerifiedRelationTypeSchema = z.enum(["PARENT_CHILD", "RELATED_CAPABILITY", "DISTINCT_CAPABILITY"]);
export const FinalVerifiedRelationSchema = z.object({
  relationId: z.string().min(1),
  sourceCapabilityRef: z.string().min(1),
  targetCapabilityRef: z.string().min(1),
  relationType: FinalVerifiedRelationTypeSchema,
  status: z.literal("VERIFIED")
}).strict();

export const VerifiedPublicationCapabilityGateSchema = z.object({
  capabilityId: z.string().min(1),
  evidenceIds: z.array(z.string().min(1)).min(1),
  provenance: z.object({ sourceCandidateIds: z.array(z.string().min(1)).min(1), sourceDocumentIds: z.array(z.string().min(1)).min(1) }).strict(),
  validation: z.object({ evidenceStatus: z.literal("PASSED"), semanticDefinitionStatus: z.literal("PASSED") }).strict()
}).strict();

export const VerifiedSnapshotPublicationMetadataSchema = z.object({ verificationRunId: z.string().regex(/^VFY_[0-9A-F]{24}$/), verificationRawOutputHash: z.string().regex(/^[0-9a-f]{64}$/) }).strict();
export const CapabilityVerificationRunIdentitySchema = z.object({ convergenceRunId: z.string().regex(/^CONV_[0-9A-F]{24}$/), convergenceRawOutputHash: z.string().regex(/^[0-9a-f]{64}$/), sourceEvidenceRepresentationHash: z.string().regex(/^[0-9a-f]{64}$/), kernelVersion: z.string().min(1), promptChecksum: z.string().min(1), provider: z.string().min(1), model: z.string().min(1), schemaVersion: z.string().min(1), algorithmVersion: z.string().min(1), snapshotSchemaVersion: z.string().min(1) }).strict();

/** A final level is truthful only when its verification state and value agree exactly. */
export const FinalLevelTruthSchema = z.union([
  z.object({ demonstratedCapabilityLevel: z.enum(["L1", "L2", "L3", "L4", "L5", "L6"]), levelVerificationStatus: z.literal("VERIFIED") }).strict(),
  z.object({ demonstratedCapabilityLevel: z.null(), levelVerificationStatus: z.literal("UNVERIFIED") }).strict()
]);
