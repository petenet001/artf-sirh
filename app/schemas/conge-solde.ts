import { z } from "zod";
import { typeCongeSchema } from "~/schemas/type-conge";

/**
 * Solde de congé d'un agent pour un type et une année. Création **paresseuse** :
 * n'existe qu'après une première demande qui débite (`debite_solde`). Une liste
 * vide est donc normale.
 */
export const congeSoldeSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  type_conge_id: z.number(),
  type_conge: typeCongeSchema.optional(),
  annee: z.number(),
  solde_initial: z.number(),
  solde_actuel: z.number(),
});

export type CongeSolde = z.infer<typeof congeSoldeSchema>;
