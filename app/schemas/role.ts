import { z } from "zod";
import { permissionSchema } from "~/schemas/permission";

/** Rôle (guard `api`) avec ses permissions éventuellement chargées. */
export const roleSchema = z.object({
  id: z.number(),
  name: z.string(),
  permissions: z.array(permissionSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Role = z.infer<typeof roleSchema>;

/**
 * Payload de création/édition d'un rôle.
 * `permissions` est une liste de noms de permissions (et non d'objets).
 */
export const roleInputSchema = z.object({
  name: z.string().min(1),
  permissions: z.array(z.string()).optional(),
});

export type RoleInput = z.infer<typeof roleInputSchema>;
