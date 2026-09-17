import type { TYPES_POSITION, STATUTS_POSITION, ETAPES_POSITION, STATUTS_ESSAI } from "~/constants/enums";
import type { BadgeColor } from "~/constants/carriere";

export { agentNom } from "~/constants/carriere";
export type { BadgeColor } from "~/constants/carriere";

export type TypePosition = (typeof TYPES_POSITION)[number];
export type StatutPosition = (typeof STATUTS_POSITION)[number];
export type EtapePosition = (typeof ETAPES_POSITION)[number];
export type StatutEssai = (typeof STATUTS_ESSAI)[number];

/** Libellé de repli — l'API fournit `type_label` et `article`. */
export const TYPE_POSITION_LABEL: Record<TypePosition, string> = {
  detachement: "Détachement",
  disponibilite: "Disponibilité",
  position_exceptionnelle: "Position exceptionnelle",
  sous_le_drapeau: "Sous le drapeau",
};

/**
 * Ce que chaque position fait à la rémunération et à l'avancement — c'est la
 * conséquence à rappeler avant d'approuver (CCN art. 78–80).
 */
export const EFFET_POSITION: Record<TypePosition, string> = {
  detachement: "Rémunération non maintenue ; avancement d'échelon possible ; exempté de notation.",
  disponibilite: "Rémunération et avancement suspendus ; nomination active clôturée.",
  position_exceptionnelle: "Rémunération et avancement maintenus ; exempté de notation.",
  sous_le_drapeau: "Rémunération maintenue ; exempté de notation.",
};

export const STATUT_POSITION_COLOR: Record<StatutPosition, BadgeColor> = {
  soumise: "warning",
  active: "success",
  cloturee: "neutral",
  rejetee: "error",
};

export const STATUT_POSITION_LABEL: Record<StatutPosition, string> = {
  soumise: "Soumise",
  active: "Active",
  cloturee: "Clôturée",
  rejetee: "Rejetée",
};

export const ETAPE_POSITION_LABEL: Record<EtapePosition, string> = {
  approuver: "En attente du DG",
  cloturer: "À clôturer (RH)",
};

export const STATUT_ESSAI_COLOR: Record<StatutEssai, BadgeColor> = {
  en_cours: "warning",
  renouvele: "warning",
  concluant: "success",
  rompu: "error",
  non_applicable: "neutral",
};

export const STATUT_ESSAI_LABEL: Record<StatutEssai, string> = {
  en_cours: "Essai en cours",
  renouvele: "Essai renouvelé",
  concluant: "Essai concluant",
  rompu: "Essai rompu",
  non_applicable: "Sans essai",
};

/**
 * L'essai est-il encore ouvert ? C'est la condition des boutons confirmer /
 * renouveler / rompre — l'API pose `prochaine_etape: "confirmer-essai"` dans
 * ce cas.
 */
export function essaiOuvert(essai?: { statut?: string | null } | null): boolean {
  return essai?.statut === "en_cours" || essai?.statut === "renouvele";
}
