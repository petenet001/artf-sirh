import type {
  NATURES_PAIE_ELEMENT,
  SENS_PAIE_ELEMENT,
  PERIODICITES_PAIE_ELEMENT,
  MODES_CALCUL_PAIE_ELEMENT,
  STATUTS_PAIE_LOT,
  SOURCES_DETAIL_PAIE,
} from "~/constants/enums";
import type { BadgeColor } from "~/constants/carriere";
import type { PaieLot } from "~/schemas/paie-lot";

export { agentNom } from "~/constants/carriere";
export type { BadgeColor } from "~/constants/carriere";

export type NaturePaieElement = (typeof NATURES_PAIE_ELEMENT)[number];
export type SensPaieElement = (typeof SENS_PAIE_ELEMENT)[number];
export type PeriodicitePaieElement = (typeof PERIODICITES_PAIE_ELEMENT)[number];
export type ModeCalculPaieElement = (typeof MODES_CALCUL_PAIE_ELEMENT)[number];
export type StatutPaieLot = (typeof STATUTS_PAIE_LOT)[number];
export type SourceDetailPaie = (typeof SOURCES_DETAIL_PAIE)[number];

export const NATURE_PAIE_LABEL: Record<NaturePaieElement, string> = {
  prime: "Prime",
  indemnite: "Indemnité",
  allocation: "Allocation",
  retenue: "Retenue",
  salaire_fonctionnel: "Salaire fonctionnel",
};

export const PERIODICITE_PAIE_LABEL: Record<PeriodicitePaieElement, string> = {
  mensuel: "Mensuelle",
  semestriel: "Semestrielle",
  annuel: "Annuelle",
  ponctuel: "Ponctuelle",
  journalier: "Journalière",
};

export const MODE_CALCUL_PAIE_LABEL: Record<ModeCalculPaieElement, string> = {
  montant_fixe: "Montant fixe",
  pourcentage_base: "Pourcentage de la base",
  formule_ccn: "Formule conventionnelle",
  bareme_ccn: "Barème conventionnel",
};

export const SOURCE_DETAIL_LABEL: Record<SourceDetailPaie, string> = {
  base: "Salaire de base",
  affectation: "Affectation",
  calcul_auto: "Calcul automatique",
};

export const STATUT_PAIE_LOT_COLOR: Record<StatutPaieLot, BadgeColor> = {
  brouillon: "neutral",
  genere: "warning",
  controle: "primary",
  valide: "success",
  cloture: "neutral",
};

export const STATUT_PAIE_LOT_LABEL: Record<StatutPaieLot, string> = {
  brouillon: "Brouillon",
  genere: "Généré",
  controle: "Contrôlé",
  valide: "Validé",
  cloture: "Clôturé",
};

/** Action possible sur un lot, telle que déclarée par l'API (`data.actions`). */
export interface ActionLotPaie {
  key: "generer" | "controler" | "valider" | "cloturer" | "supprimer";
  label: string;
  icon: string;
  color: BadgeColor;
  principale?: boolean;
}

const CATALOGUE_ACTIONS: ActionLotPaie[] = [
  { key: "generer", label: "Générer", icon: "i-lucide-refresh-cw", color: "primary", principale: true },
  { key: "controler", label: "Contrôler", icon: "i-lucide-search-check", color: "primary", principale: true },
  { key: "valider", label: "Valider", icon: "i-lucide-check", color: "success", principale: true },
  { key: "cloturer", label: "Clôturer", icon: "i-lucide-lock", color: "neutral" },
  { key: "supprimer", label: "Supprimer", icon: "i-lucide-trash-2", color: "error" },
];

/**
 * Boutons du lot, **dictés par le serveur** (`data.actions`) : c'est lui qui
 * sait ce que le statut autorise. On n'en redéduit rien côté front — un lot
 * généré reste re-générable, un lot validé ne l'est plus.
 */
export function actionsLot(lot: Pick<PaieLot, "actions">): ActionLotPaie[] {
  const autorisees = lot.actions ?? {};
  return CATALOGUE_ACTIONS.filter((action) => autorisees[action.key] === true);
}

/**
 * La validation est-elle barrée par une anomalie bloquante ? L'API renvoie 422
 * dans ce cas : on l'annonce avant le clic.
 */
export function validationBloquee(lot: Pick<PaieLot, "nb_anomalies_bloquantes">): boolean {
  return (lot.nb_anomalies_bloquantes ?? 0) > 0;
}

/** Montant en francs CFA, format français (séparateur d'espace insécable). */
export function formatMontant(montant?: number | null): string {
  if (montant == null) return "—";
  return `${montant.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} F`;
}
