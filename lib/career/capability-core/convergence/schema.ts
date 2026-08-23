import { z } from "zod";
import { CapabilityScopeSchema } from "../schema";

export const CapabilityConvergenceRelationTypeSchema = z.enum(["PARENT_CHILD", "RELATED_CAPABILITY", "DISTINCT_CAPABILITY", "UNRESOLVED"]);
export const CapabilityConvergenceGroupSchema = z.object({
  group_key: z.string().min(1), member_candidate_ids: z.array(z.string().min(1)).min(1), canonical_name: z.string().min(1), capability_scope: CapabilityScopeSchema, structural_definition: z.string().min(1), primary_domain: z.string().min(1).nullable()
}).strict();
export const CapabilityConvergenceRelationSchema = z.object({
  source_group_key: z.string().min(1), target_group_key: z.string().min(1), relation_type: CapabilityConvergenceRelationTypeSchema, reason: z.string().min(1)
}).strict();
export const CapabilityConvergenceAuditSchema = z.object({
  input_candidate_count: z.number().int().nonnegative(), grouped_candidate_count: z.number().int().nonnegative(), group_count: z.number().int().nonnegative(), same_capability_merge_count: z.number().int().nonnegative(), unresolved_relation_count: z.number().int().nonnegative(), reconciliation_pass_completed: z.boolean()
}).strict();
export const CapabilityConvergenceOutputSchema = z.object({
  convergence_version: z.string().min(1), groups: z.array(CapabilityConvergenceGroupSchema), relations: z.array(CapabilityConvergenceRelationSchema), reconciliation_audit: CapabilityConvergenceAuditSchema
}).strict();

export type CapabilityConvergenceOutput = z.infer<typeof CapabilityConvergenceOutputSchema>;
