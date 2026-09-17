import type {
  TYPES_ORGANISME_SOCIAL,
  STATUTS_AFFILIATION,
  TYPES_AYANT_DROIT,
  LIENS_JURIDIQUES_AYANT_DROIT,
  QUALITES_AGE_AYANT_DROIT,
  TYPES_PIECE_AYANT_DROIT,
} from "~/constants/enums";
import type { BadgeColor } from "~/constants/carriere";

export { agentNom } from "~/constants/carriere";
export type { BadgeColor } from "~/constants/carriere";

export type TypeOrganismeSocial = (typeof TYPES_ORGANISME_SOCIAL)[number];
export type StatutAffiliation = (typeof STATUTS_AFFILIATION)[number];
export type TypeAyantDroit = (typeof TYPES_AYANT_DROIT)[number];
export type LienJuridiqueAyantDroit = (typeof LIENS_JURIDIQUES_AYANT_DROIT)[number];
export type QualiteAgeAyantDroit = (typeof QUALITES_AGE_AYANT_DROIT)[number];
export type TypePieceAyantDroit = (typeof TYPES_PIECE_AYANT_DROIT)[number];

export const TYPE_ORGANISME_LABEL: Record<TypeOrganismeSocial, string> = {
  cnss: "CNSS",
  mutuelle: "Mutuelle",
  complementaire: "Complémentaire santé",
  autre: "Autre",
};

export const STATUT_AFFILIATION_COLOR: Record<StatutAffiliation, BadgeColor> = {
  active: "success",
  suspendue: "warning",
  cloturee: "neutral",
};

export const STATUT_AFFILIATION_LABEL: Record<StatutAffiliation, string> = {
  active: "Active",
  suspendue: "Suspendue",
  cloturee: "Clôturée",
};

export const TYPE_AYANT_DROIT_LABEL: Record<TypeAyantDroit, string> = {
  conjoint: "Conjoint",
  enfant: "Enfant",
};

export const LIEN_JURIDIQUE_LABEL: Record<LienJuridiqueAyantDroit, string> = {
  mariage: "Mariage",
  union_libre: "Union libre",
  naturel_reconnu: "Enfant naturel reconnu",
  adoption: "Adoption",
  tutelle: "Tutelle",
};

/**
 * Liens juridiques recevables selon le type d'ayant droit (CCN art. 59) :
 * le conjoint relève du mariage ou de l'union libre, l'enfant de la filiation,
 * de l'adoption ou de la tutelle.
 */
export const LIENS_PAR_TYPE: Record<TypeAyantDroit, LienJuridiqueAyantDroit[]> = {
  conjoint: ["mariage", "union_libre"],
  enfant: ["mariage", "naturel_reconnu", "adoption", "tutelle"],
};

export const QUALITE_AGE_LABEL: Record<QualiteAgeAyantDroit, string> = {
  standard: "Standard (moins de 16 ans)",
  apprentissage: "Apprentissage (moins de 17 ans)",
  etudes: "Études (moins de 21 ans)",
  infirmite: "Infirmité (moins de 21 ans)",
};

export const TYPE_PIECE_AYANT_DROIT_LABEL: Record<TypePieceAyantDroit, string> = {
  acte_naissance: "Acte de naissance",
  acte_mariage: "Acte de mariage",
  jugement_tutelle: "Jugement de tutelle",
  certificat_scolarite: "Certificat de scolarité",
  certificat_apprentissage: "Certificat d'apprentissage",
  certificat_medical: "Certificat médical",
  autre: "Autre pièce",
};

/** La qualité d'âge ne concerne que les enfants (le conjoint n'en a pas). */
export function exigeQualiteAge(type?: TypeAyantDroit | null): boolean {
  return type === "enfant";
}
