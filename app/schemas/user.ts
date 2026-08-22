import { z } from "zod";

/**
 * Le modèle `User` et son schéma vivent dans `~/schemas/auth` (session courante).
 * On les réexporte ici pour la couche d'administration système, et on ajoute le
 * payload de création/édition d'un utilisateur.
 */
export { userSchema, type User } from "~/schemas/auth";

/** Payload de création/édition d'un utilisateur (User/CreateRequest). */
export const userInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.string().nullish(),
  agent_id: z.number().nullish(),
  is_active: z.boolean().nullish(),
});

export type UserInput = z.infer<typeof userInputSchema>;
