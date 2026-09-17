import type {
  TYPES_ACTION_FORMATION,
  MODALITES_FORMATION,
  STATUTS_PLAN_FORMATION,
  STATUTS_INSCRIPTION_FORMATION,
} from "~/constants/enums";
import type { BadgeColor } from "~/constants/carriere";

export { agentNom } from "~/constants/carriere";
export type { BadgeColor } from "~/constants/carriere";

export type TypeActionFormation = (typeof TYPES_ACTION_FORMATION)[number];
export type ModaliteFormation = (typeof MODALITES_FORMATION)[number];
export type StatutPlanFormation = (typeof STATUTS_PLAN_FORMATION)[number];
export type StatutInscriptionFormation = (typeof STATUTS_INSCRIPTION_FORMATION)[number];

export const TYPE_ACTION_LABEL: Record<TypeActionFormation, string> = {
  sur_le_tas: "Formation sur le tas",
  seminaire: "Séminaire",
  perfectionnement: "Perfectionnement",
  qualification: "Qualification",
  ecole: "École",
  camrtf: "CAMRTF",
};

export const MODALITE_FORMATION_LABEL: Record<ModaliteFormation, string> = {
  interne: "Interne",
  externe: "Externe",
};

export const STATUT_PLAN_COLOR: Record<StatutPlanFormation, BadgeColor> = {
  brouillon: "neutral",
  valide: "primary",
  execute: "warning",
  cloture: "success",
};

export const STATUT_PLAN_LABEL: Record<StatutPlanFormation, string> = {
  brouillon: "Brouillon",
  valide: "Validé",
  execute: "En exécution",
  cloture: "Clôturé",
};

export const STATUT_INSCRIPTION_COLOR: Record<StatutInscriptionFormation, BadgeColor> = {
  inscrite: "warning",
  presente: "primary",
  terminee: "success",
  annulee: "neutral",
  absente: "error",
};

export const STATUT_INSCRIPTION_LABEL: Record<StatutInscriptionFormation, string> = {
  inscrite: "Inscrite",
  presente: "Présence confirmée",
  terminee: "Terminée",
  annulee: "Annulée",
  absente: "Absente",
};

/**
 * Types d'action dont la clôture exige un rapport de fin de formation
 * (CCN art. 100). L'API renvoie un 422 sinon.
 */
export const TYPES_EXIGEANT_RAPPORT: TypeActionFormation[] = ["perfectionnement", "qualification"];

export function exigeRapport(type?: string | null): boolean {
  return TYPES_EXIGEANT_RAPPORT.includes(type as TypeActionFormation);
}

/** Le plan n'est modifiable (titre, lignes) qu'en brouillon. */
export function planModifiable(statut?: string | null): boolean {
  return statut === "brouillon";
}

/**
 * Action suivante du plan annuel, d'après son statut. `null` une fois clôturé :
 * le cycle est terminé.
 */
export function prochaineEtapePlan(
  statut?: string | null,
): { key: "valider" | "executer" | "cloturer"; label: string; icon: string } | null {
  switch (statut) {
    case "brouillon":
      return { key: "valider", label: "Valider le plan", icon: "i-lucide-check" };
    case "valide":
      return { key: "executer", label: "Lancer l'exécution", icon: "i-lucide-play" };
    case "execute":
      return { key: "cloturer", label: "Clôturer le plan", icon: "i-lucide-lock" };
    default:
      return null;
  }
}
