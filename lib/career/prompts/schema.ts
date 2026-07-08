import { z } from "zod";

/**
 * Status lifecycle of a managed prompt version.
 * Only ACTIVE versions are loaded and decrypted by runtime resolvers.
 */
export const PromptStatusSchema = z.enum([
  "DRAFT",
  "APPROVED",
  "ACTIVE",
  "DEPRECATED",
  "ARCHIVED"
]);

export type PromptStatus = z.infer<typeof PromptStatusSchema>;

/**
 * Schema for a prompt template descriptor.
 */
export const PromptTemplateSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  domain: z.string().min(1),
  current_active_version_id: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

/**
 * Schema for an encrypted prompt version record.
 * GUARANTEE: Never stores plaintext content; only canonical encrypted_content and content_checksum.
 */
export const PromptVersionSchema = z.object({
  id: z.string().min(1),
  prompt_template_id: z.string().min(1),
  version: z.number().int().positive(),
  encrypted_content: z.string().regex(/^v1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/, {
    message: "encrypted_content must follow canonical v1:<base64(iv)>:<base64(authTag)>:<base64(ciphertext)> format"
  }),
  content_checksum: z.string().regex(/^[a-f0-9]{64}$/, {
    message: "content_checksum must be a 64-character SHA-256 hex digest"
  }),
  status: PromptStatusSchema,
  created_by: z.string().optional(),
  approved_by: z.string().optional(),
  activated_at: z.string().datetime().optional(),
  created_at: z.string().datetime()
});

export type PromptVersion = z.infer<typeof PromptVersionSchema>;
