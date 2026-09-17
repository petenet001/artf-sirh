import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import { typeContratSchema } from "~/schemas/type-contrat";
import { fonctionSchema } from "~/schemas/fonction";
import { essaiSchema } from "~/schemas/essai";

/** Contrat d'un agent. Forme renvoyée par ContratResource. */
export const contratSchema = z.object({
  id: z.number(),
  agent_id: z.number().optional(),
  agent: agentSummarySchema.optional(),
  type_contrat_id: z.number().optional(),
  type_contrat: typeContratSchema.optional(),
  fonction_id: z.number().nullable().optional(),
  fonction: fonctionSchema.optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  remuneration: z.union([z.string(), z.number()]).nullable().optional(),
  statut: z.string().nullable().optional(),
  dossier_integration_id: z.number().nullable().optional(),
  lieu_recrutement: z.string().nullable().optional(),
  // Période d'essai (art. 49). Toujours présent, `non_applicable` pour un
  // stage ou une consultance.
  essai: essaiSchema.optional(),
  // Mentions obligatoires du contrat écrit (art. 52), assemblées serveur.
  mentions: z
    .object({
      noms: z.string().nullable().optional(),
      nationalite: z.string().nullable().optional(),
      date_naissance: z.string().nullable().optional(),
      lieu_naissance: z.string().nullable().optional(),
      sexe: z.string().nullable().optional(),
      situation_matrimoniale: z.string().nullable().optional(),
      date_recrutement: z.string().nullable().optional(),
      lieu_recrutement: z.string().nullable().optional(),
      essai: z
        .object({
          duree_mois: z.number().nullable().optional(),
          date_debut: z.string().nullable().optional(),
          date_fin: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
      emploi: z.string().nullable().optional(),
      remuneration: z.union([z.string(), z.number()]).nullable().optional(),
      lieu_travail: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Contrat = z.infer<typeof contratSchema>;

/** Payload de création d'un contrat. */
export const contratInputSchema = z.object({
  agent_id: z.number(),
  type_contrat_id: z.number(),
  dossier_integration_id: z.number().nullish(),
  fonction_id: z.number().nullish(),
  date_debut: z.string().min(1),
  date_fin: z.string().nullish(),
  remuneration: z.number().min(0).nullish(),
  lieu_recrutement: z.string().nullish(),
});

export type ContratInput = z.infer<typeof contratInputSchema>;
