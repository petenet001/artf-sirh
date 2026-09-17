import { z } from "zod";
import { STATUTS_COMMISSION, DECISIONS_COMMISSION } from "~/constants/enums";

/**
 * Commission d'évaluation (CCN art. 68–70). Même forme pour la **préparatoire**
 * (harmonisation des notes, note de synthèse art. 67) et celle
 * d'**avancement** (décision par fiche) : seul le parcours diffère.
 *
 * Enchaînement imposé par l'API : préparatoire ouverte → notée → clôturée →
 * avancement ouvert → décisions → clôturé → échelons appliqués → session close.
 */
export const commissionSchema = z.object({
  id: z.number(),
  session_id: z.number(),
  session: z
    .object({
      id: z.number(),
      debut_session: z.string().nullable().optional(),
      statut: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  statut: z.enum(STATUTS_COMMISSION),
  statut_label: z.string().nullable().optional(),
  date_ouverture: z.string().nullable().optional(),
  date_cloture: z.string().nullable().optional(),
  observations: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type Commission = z.infer<typeof commissionSchema>;

/** Ouverture d'une commission (date par défaut = aujourd'hui côté serveur). */
export const ouvrirCommissionSchema = z.object({
  date_ouverture: z.string().nullish(),
  observations: z.string().max(2000).nullish(),
});

export type OuvrirCommissionInput = z.infer<typeof ouvrirCommissionSchema>;

/** Clôture d'une commission. */
export const cloturerCommissionSchema = z.object({
  observations: z.string().max(2000).nullish(),
});

export type CloturerCommissionInput = z.infer<typeof cloturerCommissionSchema>;

/**
 * Harmonisation d'une fiche en commission préparatoire (art. 67). La réponse
 * signale un écart de plus de 5 points avec la note du N+1 — indicatif.
 */
export const noterCommissionSchema = z.object({
  evaluation_id: z.number(),
  commission_note: z.coerce.number().min(0, "Note entre 0 et 20").max(20, "Note entre 0 et 20"),
  note_synthese: z.string().max(5000).nullish(),
});

export type NoterCommissionInput = z.infer<typeof noterCommissionSchema>;

/** Réponse de `POST commissions-preparatoires/{id}/noter`. */
export const resultatNotationCommissionSchema = z.object({
  alerte_ecart: z.boolean(),
  ecart: z.coerce.number().nullable().optional(),
  message: z.string().nullable().optional(),
});

export type ResultatNotationCommission = z.infer<typeof resultatNotationCommissionSchema>;

/**
 * Décision de la commission d'avancement (art. 69–70). `nombre_echelons` vaut
 * 1 ou 2 si la décision est favorable, 0 sinon — il n'y a **pas** de
 * reclassement de classe ici (art. 73–75, autre parcours).
 */
export const deciderCommissionSchema = z.object({
  evaluation_id: z.number(),
  decision: z.enum(DECISIONS_COMMISSION),
  nombre_echelons: z.coerce.number().min(0).max(2).nullish(),
  note_avancement: z.coerce.number().min(0).max(20).nullish(),
  commentaire: z.string().max(2000).nullish(),
});

export type DeciderCommissionInput = z.infer<typeof deciderCommissionSchema>;

/** Réponse de `POST evaluations/{id}/avancer-echelon` (idempotente). */
export const resultatAvancementSchema = z.object({
  avance: z.boolean(),
  echelon_precedent_id: z.number().nullable().optional(),
  echelon_nouveau_id: z.number().nullable().optional(),
  message: z.string().nullable().optional(),
});

export type ResultatAvancement = z.infer<typeof resultatAvancementSchema>;
