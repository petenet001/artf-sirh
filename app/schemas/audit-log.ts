import { z } from "zod";
import { userSchema } from "~/schemas/auth";

/**
 * Entrée du journal d'audit. Forme renvoyée par AuditLogResource.
 * `user` n'est présent que si chargé ; sinon seul `user_id` est remonté.
 * `details` est un payload JSON arbitraire.
 */
export const auditLogSchema = z.object({
  id: z.number(),
  action: z.string(),
  user_id: z.number().nullable().optional(),
  user: userSchema.optional(),
  loggable_type: z.string().nullable().optional(),
  loggable_id: z.number().nullable().optional(),
  details: z.unknown().nullable().optional(),
  ip_address: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;
