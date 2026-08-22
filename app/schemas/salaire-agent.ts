import { z } from "zod";
import { agentSchema } from "~/schemas/agent";
import { salaireSchema } from "~/schemas/salaire";
import { STATUTS_SALAIRE_AGENT, TYPES_CHANGEMENT_SALAIRE_AGENT } from "~/constants/enums";

/**
 * Salaire d'un agent (SalaireAgentResource). À ne pas confondre avec la grille
 * calculée (`salaireSchema`) : ici c'est la rémunération réelle d'un agent, avec
 * son historique de changements. `agent_id` n'est présent que si la relation
 * `agent` n'est pas chargée ; les champs de variation (`*_precedent`,
 * `variation_*`) ne remontent que sur l'historique.
 */
export const salaireAgentSchema = z.object({
  id: z.number(),
  agent_id: z.number().optional(),
  agent: agentSchema.optional(),
  salaire_id: z.number().nullable().optional(),
  classegrillesalariale_id: z.number().nullable().optional(),
  echelon: z.number(),
  montant_base: z.number(),
  montant_net: z.number().nullable().optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  statut: z.enum(STATUTS_SALAIRE_AGENT),
  type_changement: z.enum(TYPES_CHANGEMENT_SALAIRE_AGENT).nullable().optional(),
  type_changement_label: z.string().nullable().optional(),
  motif: z.string().nullable().optional(),

  // Historique uniquement (route `/salaires/historique`).
  echelon_precedent: z.number().nullable().optional(),
  montant_precedent: z.number().nullable().optional(),
  variation_echelon: z.number().nullable().optional(),
  variation_montant: z.number().nullable().optional(),

  salaire: salaireSchema.optional(),
  classe: z
    .object({
      id: z.number(),
      coefficient: z.number().nullable().optional(),
      categorie: z
        .object({
          id: z.number(),
          nom: z.string(),
          sigle: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
      grade: z
        .object({
          id: z.number(),
          nom: z.string(),
          niveau: z.number().nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),

  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type SalaireAgent = z.infer<typeof salaireAgentSchema>;

/** Création d'un salaire d'agent (SalaireAgent/CreateRequest). */
export const salaireAgentCreateSchema = z.object({
  agent_id: z.number(),
  contrat_id: z.number().nullish(),
  date_debut: z.string().nullish(),
  motif: z.string().max(500).nullish(),
});

export type SalaireAgentCreate = z.infer<typeof salaireAgentCreateSchema>;

/** Clôture d'un salaire d'agent (SalaireAgent/CloturerRequest). */
export const salaireAgentCloturerSchema = z.object({
  date_fin: z.string().nullish(),
  motif: z.string().max(500).nullish(),
});

export type SalaireAgentCloturer = z.infer<typeof salaireAgentCloturerSchema>;

/** Avancement d'échelon (SalaireAgent/AvancerEchelonRequest). */
export const salaireAgentAvancerEchelonSchema = z.object({
  motif: z.string().max(500).nullish(),
});

export type SalaireAgentAvancerEchelon = z.infer<typeof salaireAgentAvancerEchelonSchema>;
