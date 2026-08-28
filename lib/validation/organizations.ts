import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be less than 100 characters")
    .trim(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .refine(
      (slug) => !slug.startsWith('-') && !slug.endsWith('-'),
      "Slug cannot start or end with a hyphen"
    )
    .refine(
      (slug) => !slug.includes('--'),
      "Slug cannot contain consecutive hyphens"
    )
    .trim(),
  website: z
    .string()
    .url("Please enter a valid website URL")
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      "Website URL must use http or https protocol"
    )
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
});

export const updateOrganizationSchema = createOrganizationSchema
  .partial()
  .omit({ slug: true }) // Slug typically cannot be updated
  .extend({
    status: z.enum(["ACTIVE", "PENDING", "SUSPENDED", "REVOKED", "DELETED"]).optional(),
  });

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;