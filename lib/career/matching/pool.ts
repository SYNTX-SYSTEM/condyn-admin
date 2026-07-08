import { z } from "zod";

/**
 * Status lifecycle of a managed Company Pool.
 * Runtime matching strictly rejects pools unless status is ACTIVE.
 */
export const PoolStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);
export type PoolStatus = z.infer<typeof PoolStatusSchema>;

export const CompanyPoolMetadataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  version: z.number().int().positive(),
  status: PoolStatusSchema,
  created_at: z.string().datetime()
});
export type CompanyPoolMetadata = z.infer<typeof CompanyPoolMetadataSchema>;

export const PoolOrganizationSchema = z.object({
  id: z.string().min(1),
  pool_id: z.string().min(1),
  org_id: z.string().min(1),
  name: z.string().min(1),
  country_iso: z.string().min(2).max(3),
  region: z.string(),
  industry: z.string(),
  scale: z.string(),
  description: z.string()
});
export type PoolOrganization = z.infer<typeof PoolOrganizationSchema>;

export const PoolRoleSchema = z.object({
  id: z.string().min(1),
  pool_id: z.string().min(1),
  organization_id: z.string().min(1),
  title: z.string().min(1),
  seniority: z.string(),
  domain_focus: z.string(),
  description: z.string()
});
export type PoolRole = z.infer<typeof PoolRoleSchema>;

export const PoolCapabilityRequirementSchema = z.object({
  id: z.string().min(1),
  role_id: z.string().min(1),
  capability_name: z.string().min(1),
  domain: z.string(),
  weight: z.number().min(0.0).max(1.0, {
    message: "weight must be in range [0.0, 1.0]"
  }),
  required_level: z.string(),
  evidence_hint: z.string().optional()
});
export type PoolCapabilityRequirement = z.infer<typeof PoolCapabilityRequirementSchema>;

export const PoolSearchQuerySchema = z.object({
  id: z.string().min(1),
  pool_id: z.string().min(1),
  query: z.string().min(1),
  target: z.string(),
  priority: z.number()
});
export type PoolSearchQuery = z.infer<typeof PoolSearchQuerySchema>;

export const CompanyPoolDataSchema = z.object({
  pool: CompanyPoolMetadataSchema,
  organizations: z.array(PoolOrganizationSchema),
  roles: z.array(PoolRoleSchema),
  requirements: z.array(PoolCapabilityRequirementSchema),
  search_queries: z.array(PoolSearchQuerySchema).optional().default([])
});
export type CompanyPoolData = z.infer<typeof CompanyPoolDataSchema>;
