import { z } from "zod";
import { userSchema } from "~/schemas/auth";

/** Entrée d'historique d'un dossier. Forme renvoyée par HistoriqueIntegrationResource. */
export const historiqueIntegrationSchema = z.object({
  id: z.number(),
  action: z.string().nullable().optional(),
  ancienne_valeur: z.string().nullable().optional(),
  nouvelle_valeur: z.string().nullable().optional(),
  commentaire: z.string().nullable().optional(),
  utilisateur: userSchema.optional(),
  created_at: z.string().optional(),
});

export type HistoriqueIntegration = z.infer<typeof historiqueIntegrationSchema>;
