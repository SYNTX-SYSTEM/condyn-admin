import { z } from "zod";

export const EvidenceLocationSchema = z.object({
  page: z.number().int().optional(),
  lineStart: z.number().int().optional(),
  lineEnd: z.number().int().optional(),
  commit: z.string().optional(),
  file: z.string().optional(),
  heading: z.string().optional()
});
export type EvidenceLocation = z.infer<typeof EvidenceLocationSchema>;

export const EvidenceNodeSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  sourceType: z.enum(["pdf", "github", "website", "linkedin", "markdown"]),
  confidence: z.number().min(0.0).max(1.0),
  excerpt: z.string().min(1),
  location: EvidenceLocationSchema,
  capabilities: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({})
});
export type EvidenceNode = z.infer<typeof EvidenceNodeSchema>;

export const CapabilityNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  domain: z.string().default("General"),
  incomingEvidenceIds: z.array(z.string()).default([]),
  outgoingRequirementIds: z.array(z.string()).default([]),
  aliases: z.array(z.string()).default([]),
  parents: z.array(z.string()).default([]),
  children: z.array(z.string()).default([])
});
export type CapabilityNode = z.infer<typeof CapabilityNodeSchema>;

export const JobRequirementNodeSchema = z.object({
  id: z.string().min(1),
  jobId: z.string().min(1),
  requirementName: z.string().min(1),
  domain: z.string().default("General"),
  weight: z.number().min(0.0).max(1.0),
  requiredLevel: z.string()
});
export type JobRequirementNode = z.infer<typeof JobRequirementNodeSchema>;

export const EvidenceGraphEdgeTypeSchema = z.enum([
  "supports",   // Evidence -> Capability
  "satisfies",  // Capability -> Requirement
  "belongsTo"   // Requirement -> Job
]);
export type EvidenceGraphEdgeType = z.infer<typeof EvidenceGraphEdgeTypeSchema>;

export const EvidenceGraphEdgeSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  edgeType: EvidenceGraphEdgeTypeSchema,
  weight: z.number().min(0.0).max(1.0)
});
export type EvidenceGraphEdge = z.infer<typeof EvidenceGraphEdgeSchema>;

export const DirectedEvidenceGraphSchema = z.object({
  evidenceNodes: z.array(EvidenceNodeSchema),
  capabilityNodes: z.array(CapabilityNodeSchema),
  requirementNodes: z.array(JobRequirementNodeSchema),
  edges: z.array(EvidenceGraphEdgeSchema)
});
export type DirectedEvidenceGraph = z.infer<typeof DirectedEvidenceGraphSchema>;
