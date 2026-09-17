import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import { typeSanctionSchema } from "~/schemas/type-sanction";
import { STATUTS_SANCTION, ETAPES_SANCTION } from "~/constants/enums";

/** Utilisateur résumé (`createur`, `validateur`, `uploader`…). */
const utilisateurResumeSchema = z.object({
  id: z.number().nullable(),
  name: z.string().nullable(),
});

/** Pièce jointe au dossier (art. 91) — au moins une avant instruction. */
export const sanctionPieceSchema = z.object({
  id: z.number(),
  sanction_id: z.number().optional(),
  nom_original: z.string(),
  mime_type: z.string().nullable().optional(),
  taille: z.number().nullable().optional(),
  uploaded_by: z.number().nullable().optional(),
  uploader: utilisateurResumeSchema.nullable().optional(),
  created_at: z.string().optional(),
});

export type SanctionPiece = z.infer<typeof sanctionPieceSchema>;

/** Antécédent disciplinaire des 5 dernières années (calcul de récidive). */
export const antecedentSanctionSchema = z.object({
  id: z.number(),
  type: z.string().nullable().optional(),
  date_decision: z.string().nullable().optional(),
  motif: z.string().nullable().optional(),
});

/**
 * Dossier disciplinaire (CCN art. 90–91, SanctionResource).
 *
 * Circuit : rapport du N+1 (`en_attente`) → instruction RH (`instruite`) → le
 * **DG seul** prononce (`validee`) ou classe sans suite (`rejetee`).
 * `notes_instruction` n'est renvoyé qu'aux détenteurs de `consulter-discipline`
 * ou `gerer-discipline` : absent pour l'agent concerné.
 */
export const sanctionSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  agent: agentSummarySchema.nullable().optional(),
  type_sanction_id: z.number(),
  type_sanction: typeSanctionSchema.nullable().optional(),
  motif: z.string().nullable().optional(),
  date_faits: z.string().nullable().optional(),
  // Mise à pied : 1 à 8 jours (art. 90).
  nb_jours: z.number().nullable().optional(),
  avec_indemnite: z.boolean().nullable().optional(),
  date_debut_effet: z.string().nullable().optional(),
  date_fin_effet: z.string().nullable().optional(),
  // Conservation 5 ans à compter du dépôt (ou de la décision si plus tardive).
  conservee_jusqu_au: z.string().nullable().optional(),
  dans_delai_conservation: z.boolean().nullable().optional(),
  recidive: z.boolean().optional(),
  antecedents_5_ans: z.array(antecedentSanctionSchema).optional(),
  notes_instruction: z.string().nullable().optional(),
  date_decision: z.string().nullable().optional(),
  decision: z.string().nullable().optional(),
  statut: z.enum(STATUTS_SANCTION).nullable().optional(),
  statut_label: z.string().nullable().optional(),
  prochaine_etape: z.enum(ETAPES_SANCTION).nullable().optional(),
  commentaire_validation: z.string().nullable().optional(),
  created_by: z.number().nullable().optional(),
  createur: utilisateurResumeSchema.nullable().optional(),
  validateur_id: z.number().nullable().optional(),
  validateur: utilisateurResumeSchema.nullable().optional(),
  pieces: z.array(sanctionPieceSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Sanction = z.infer<typeof sanctionSchema>;

/**
 * Rapport disciplinaire. Un N+1 ne peut viser que ses agents (affectation
 * active) ; la RH (`gerer-discipline`) vise tout agent non archivé.
 */
export const sanctionInputSchema = z.object({
  agent_id: z.number(),
  type_sanction_id: z.number(),
  motif: z.string().min(3, "Motif requis (3 caractères min.)"),
  date_faits: z.string().min(1, "Date des faits requise"),
  // Obligatoire pour une mise à pied (1 à 8 jours) ; ignoré sinon.
  nb_jours: z.coerce.number().min(1).max(8).nullish(),
  avec_indemnite: z.boolean().nullish(),
});

export type SanctionInput = z.infer<typeof sanctionInputSchema>;

/** Instruction RH — refusée (422) tant qu'aucune pièce n'est jointe (art. 91). */
export const instructionSanctionSchema = z.object({
  notes_instruction: z.string().min(3, "Notes d'instruction requises (3 caractères min.)"),
  decision: z.string().nullish(),
});

export type InstructionSanctionInput = z.infer<typeof instructionSanctionSchema>;

/** Prononcé du DG. Mise à pied : `date_fin_effet` = début + `nb_jours` − 1. */
export const prononceSanctionSchema = z.object({
  decision: z.string().min(3, "Décision requise (3 caractères min.)"),
  date_decision: z.string().nullish(),
  commentaire: z.string().nullish(),
  nb_jours: z.coerce.number().min(1).max(8).nullish(),
  date_debut_effet: z.string().nullish(),
  avec_indemnite: z.boolean().nullish(),
});

export type PrononceSanctionInput = z.infer<typeof prononceSanctionSchema>;

/** Classement sans suite par le DG. */
export const classementSanctionSchema = z.object({
  commentaire: z.string().min(3, "Motif requis (3 caractères min.)"),
});

export type ClassementSanctionInput = z.infer<typeof classementSanctionSchema>;
