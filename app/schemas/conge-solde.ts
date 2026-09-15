import { z } from "zod";
import { typeCongeSchema } from "~/schemas/type-conge";

/**
 * Solde de congé d'un agent pour un type et une année. Créé **à la lecture**
 * (`GET /conges/agents/{id}/soldes?annee=`) pour chaque type `debite_solde` ;
 * débité seulement à la validation finale. `solde_initial` = base (2,5 j × 12,
 * plafonnée) + `jours_anciennete` (palier CCN art. 77 atteint au 1er janvier).
 * Un solde déjà créé n'est pas recalculé.
 */
export const congeSoldeSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  type_conge_id: z.number(),
  type_conge: typeCongeSchema.optional(),
  annee: z.number(),
  solde_initial: z.number(),
  solde_actuel: z.number(),
  // Bonus d'ancienneté inclus dans `solde_initial` (0 sans `date_prise_service`).
  jours_anciennete: z.number().optional(),
});

export type CongeSolde = z.infer<typeof congeSoldeSchema>;
