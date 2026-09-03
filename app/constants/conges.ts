import type { STATUTS_DEMANDE_CONGE, STATUTS_ABSENCE, ETAPES_CONGE } from "~/constants/enums";
import type { BadgeColor } from "~/constants/carriere";

// Réutilise le helper d'affichage d'agent (mêmes règles que la carrière).
export { agentNom } from "~/constants/carriere";
export type { BadgeColor } from "~/constants/carriere";

export type StatutDemandeConge = (typeof STATUTS_DEMANDE_CONGE)[number];
export type StatutAbsence = (typeof STATUTS_ABSENCE)[number];
export type EtapeConge = (typeof ETAPES_CONGE)[number];

/**
 * Couleur du badge par statut de demande. Les libellés viennent de l'API
 * (`statut_label`) ; on ne mappe ici que la couleur. `soumise`/`validee_n1` sont
 * des états intermédiaires (warning) ; `validee_rh`/`validee_dg` = accord final.
 */
export const STATUT_DEMANDE_COLOR: Record<StatutDemandeConge, BadgeColor> = {
  soumise: "warning",
  validee_n1: "warning",
  rejetee_n1: "error",
  validee_rh: "success",
  rejetee_rh: "error",
  validee_dg: "success",
  rejetee_dg: "error",
};

/** Libellé de repli si l'API ne fournit pas `statut_label`. */
export const STATUT_DEMANDE_LABEL: Record<StatutDemandeConge, string> = {
  soumise: "Soumise",
  validee_n1: "Validée N+1",
  rejetee_n1: "Rejetée N+1",
  validee_rh: "Validée RH",
  rejetee_rh: "Rejetée RH",
  validee_dg: "Validée DG",
  rejetee_dg: "Rejetée DG",
};

/** Couleur du badge par statut d'absence. */
export const STATUT_ABSENCE_COLOR: Record<StatutAbsence, BadgeColor> = {
  en_attente: "warning",
  validee: "success",
  rejetee: "error",
};

/** Libellé de repli du statut d'absence. */
export const STATUT_ABSENCE_LABEL: Record<StatutAbsence, string> = {
  en_attente: "En attente",
  validee: "Validée",
  rejetee: "Rejetée",
};

/**
 * Description d'une étape du circuit de congé, pour l'écran de détail. `key`
 * pilote le rendu ; `commentaire`/`date` pointent les champs de la ressource ;
 * `etape` est la valeur de `prochaine_etape` qui active les boutons de l'étape.
 */
export interface EtapeCircuitConge {
  key: "n1" | "rh" | "dg";
  label: string;
  etape: EtapeConge;
  /** Flag du type qui active l'étape (`necessite_n1`…). */
  requisFlag: "necessite_n1" | "necessite_rh" | "necessite_dg";
  commentaireField: "commentaire_n1" | "commentaire_rh" | "commentaire_dg";
  dateField: "date_validation_n1" | "date_validation_rh" | "date_validation_dg";
}

export const ETAPES_CIRCUIT_CONGE: EtapeCircuitConge[] = [
  {
    key: "n1",
    label: "Supérieur hiérarchique (N+1)",
    etape: "valider-n1",
    requisFlag: "necessite_n1",
    commentaireField: "commentaire_n1",
    dateField: "date_validation_n1",
  },
  {
    key: "rh",
    label: "Ressources humaines",
    etape: "valider-rh",
    requisFlag: "necessite_rh",
    commentaireField: "commentaire_rh",
    dateField: "date_validation_rh",
  },
  {
    key: "dg",
    label: "Direction générale",
    etape: "valider-dg",
    requisFlag: "necessite_dg",
    commentaireField: "commentaire_dg",
    dateField: "date_validation_dg",
  },
];
