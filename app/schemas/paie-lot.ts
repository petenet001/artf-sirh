import { z } from "zod";
import { agentSocialSchema } from "~/schemas/affiliation-sociale";
import { STATUTS_PAIE_LOT, SOURCES_DETAIL_PAIE, SENS_PAIE_ELEMENT } from "~/constants/enums";

/**
 * Anomalie relevée au contrôle du lot. Une anomalie `bloquante` interdit la
 * validation (422) ; les `info` sont indicatives.
 */
export const anomaliePaieSchema = z.object({
  code: z.string(),
  severite: z.string(),
  agent_id: z.number().nullable().optional(),
  message: z.string().nullable().optional(),
});

export type AnomaliePaie = z.infer<typeof anomaliePaieSchema>;

/**
 * Lot mensuel de paie. Cycle `brouillon` → `genere` → `controle` → `valide` →
 * `cloture`.
 *
 * ⚠️ `actions` est la **source de vérité des boutons** : le backend y dit ce
 * que le statut autorise, on ne le redéduit pas côté front.
 */
export const paieLotSchema = z.object({
  id: z.number(),
  annee: z.number(),
  mois: z.number(),
  /** `YYYY-MM`, et son libellé lisible (« mars 2026 »). */
  periode: z.string().nullable().optional(),
  periode_label: z.string().nullable().optional(),
  statut: z.enum(STATUTS_PAIE_LOT).nullable().optional(),
  statut_label: z.string().nullable().optional(),
  commentaire: z.string().nullable().optional(),
  actions: z
    .object({
      generer: z.boolean().optional(),
      controler: z.boolean().optional(),
      valider: z.boolean().optional(),
      cloturer: z.boolean().optional(),
      supprimer: z.boolean().optional(),
      exporter: z.boolean().optional(),
      modifier: z.boolean().optional(),
    })
    .optional(),
  anomalies: z.array(anomaliePaieSchema).optional(),
  nb_anomalies: z.number().optional(),
  nb_anomalies_bloquantes: z.number().optional(),
  total_gains: z.number().optional(),
  total_retenues: z.number().optional(),
  total_net: z.number().optional(),
  nb_lignes: z.number().optional(),
  generated_at: z.string().nullable().optional(),
  controle_at: z.string().nullable().optional(),
  valide_at: z.string().nullable().optional(),
  cloture_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type PaieLot = z.infer<typeof paieLotSchema>;

export const paieLotInputSchema = z.object({
  annee: z.coerce.number().min(2000).max(2100),
  mois: z.coerce.number().min(1).max(12),
  commentaire: z.string().nullish(),
});

export type PaieLotInput = z.infer<typeof paieLotInputSchema>;

/** Une ligne de détail du bulletin : d'où vient le montant, et dans quel sens. */
export const detailLignePaieSchema = z.object({
  id: z.number().optional(),
  paie_element_id: z.number().nullable().optional(),
  code: z.string().nullable().optional(),
  libelle: z.string().nullable().optional(),
  nature: z.string().nullable().optional(),
  sens: z.enum(SENS_PAIE_ELEMENT).nullable().optional(),
  montant: z.number(),
  source: z.enum(SOURCES_DETAIL_PAIE).nullable().optional(),
  source_label: z.string().nullable().optional(),
  meta: z.record(z.string(), z.unknown()).nullable().optional(),
});

/**
 * Ligne de paie d'un agent dans un lot.
 *
 * ⚠️ `montant_net` est le net **du mois**, à ne pas confondre avec
 * `salaires_agents.montant_net` (grille indiciaire). `montant_base` vaut 0 pour
 * un agent hors grille (art. 55), qui est payé au salaire fonctionnel.
 */
export const paieLotLigneSchema = z.object({
  id: z.number(),
  lot_id: z.number().optional(),
  agent_id: z.number(),
  agent: agentSocialSchema.nullable().optional(),
  salaire_agent_id: z.number().nullable().optional(),
  hors_grille: z.boolean().optional(),
  montant_base: z.number(),
  total_gains: z.number(),
  total_retenues: z.number(),
  montant_net: z.number(),
  nb_anomalies: z.number().optional(),
  /** Identité + classe + échelon figés au moment de la génération. */
  snapshot_agent: z.record(z.string(), z.unknown()).nullable().optional(),
  details: z.array(detailLignePaieSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type PaieLotLigne = z.infer<typeof paieLotLigneSchema>;
export type DetailLignePaie = z.infer<typeof detailLignePaieSchema>;
