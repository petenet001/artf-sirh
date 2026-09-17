import { z } from "zod";
import { affiliationSocialeSchema, agentSocialSchema } from "~/schemas/affiliation-sociale";
import {
  TYPES_AYANT_DROIT,
  LIENS_JURIDIQUES_AYANT_DROIT,
  QUALITES_AGE_AYANT_DROIT,
  TYPES_PIECE_AYANT_DROIT,
  GENRES,
} from "~/constants/enums";

/** Pièce justificative d'un ayant droit (multipart `fichier` + `type_piece`). */
export const ayantDroitPieceSchema = z.object({
  id: z.number(),
  ayant_droit_id: z.number().optional(),
  type_piece: z.enum(TYPES_PIECE_AYANT_DROIT).nullable().optional(),
  type_piece_label: z.string().nullable().optional(),
  nom_original: z.string(),
  mime_type: z.string().nullable().optional(),
  taille: z.number().nullable().optional(),
  uploaded_by: z.number().nullable().optional(),
  uploader: z.object({ id: z.number().nullable(), name: z.string().nullable() }).nullable().optional(),
  created_at: z.string().optional(),
});

export type AyantDroitPiece = z.infer<typeof ayantDroitPieceSchema>;

/**
 * Ayant droit d'un agent (CCN art. 58–59). Les champs `age`, `age_limite`,
 * `a_charge` et `eligible_arbre_noel` sont **calculés serveur** : jamais
 * envoyés, jamais recalculés côté front.
 *
 * Règles métier (422) : un seul conjoint actif, au plus deux enfants actifs
 * sous tutelle, agent archivé interdit.
 */
export const ayantDroitSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  agent: agentSocialSchema.nullable().optional(),
  type: z.enum(TYPES_AYANT_DROIT).nullable().optional(),
  type_label: z.string().nullable().optional(),
  nom: z.string(),
  prenom: z.string(),
  nom_complet: z.string().nullable().optional(),
  date_naissance: z.string().nullable().optional(),
  age: z.number().nullable().optional(),
  sexe: z.enum(GENRES).nullable().optional(),
  lien_juridique: z.enum(LIENS_JURIDIQUES_AYANT_DROIT).nullable().optional(),
  lien_juridique_label: z.string().nullable().optional(),
  qualite_age: z.enum(QUALITES_AGE_AYANT_DROIT).nullable().optional(),
  qualite_age_label: z.string().nullable().optional(),
  // Âge limite de prise en charge, déduit de `qualite_age` (16, 17 ou 21 ans).
  age_limite: z.number().nullable().optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  actif: z.boolean().optional(),
  a_charge: z.boolean().optional(),
  // Enfant de 0 à 16 ans inclus (art. 58).
  eligible_arbre_noel: z.boolean().optional(),
  pieces: z.array(ayantDroitPieceSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type AyantDroit = z.infer<typeof ayantDroitSchema>;

export const ayantDroitInputSchema = z.object({
  agent_id: z.number(),
  type: z.enum(TYPES_AYANT_DROIT),
  nom: z.string().min(1, "Nom requis").max(255),
  prenom: z.string().min(1, "Prénom requis").max(255),
  date_naissance: z.string().min(1, "Date de naissance requise"),
  sexe: z.enum(GENRES).nullish(),
  lien_juridique: z.enum(LIENS_JURIDIQUES_AYANT_DROIT),
  qualite_age: z.enum(QUALITES_AGE_AYANT_DROIT).nullish(),
  date_debut: z.string().nullish(),
  date_fin: z.string().nullish(),
  actif: z.boolean().nullish(),
});

export type AyantDroitInput = z.infer<typeof ayantDroitInputSchema>;

/**
 * Dossier social d'un agent : affiliations, ayants droit et synthèse — en une
 * réponse. `nb_enfants_arbre_noel` est plafonné à 3 ;
 * `prime_arbre_noel_forfaitaire` vaut `true` quand aucun enfant n'a 0–16 ans
 * (part forfaitaire de l'art. 58).
 */
export const syntheseSocialeSchema = z.object({
  affiliation_cnss: z.boolean().optional(),
  nb_enfants_a_charge: z.number().optional(),
  nb_enfants_arbre_noel: z.number().optional(),
  prime_arbre_noel_forfaitaire: z.boolean().optional(),
  nb_enfants_tutelle: z.number().optional(),
  a_conjoint_a_charge: z.boolean().optional(),
});

export const dossierSocialSchema = z.object({
  agent: agentSocialSchema.nullable().optional(),
  affiliations: z.array(affiliationSocialeSchema).optional(),
  ayants_droit: z.array(ayantDroitSchema).optional(),
  synthese: syntheseSocialeSchema.optional(),
});

export type SyntheseSociale = z.infer<typeof syntheseSocialeSchema>;
export type DossierSocial = z.infer<typeof dossierSocialSchema>;
