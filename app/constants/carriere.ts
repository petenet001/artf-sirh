import type { STATUTS_AFFECTATION, STATUTS_NOMINATION } from "~/constants/enums";

/** Couleur de badge (aligné sur les jetons Nuxt UI, cf. integration-workflow). */
export type BadgeColor = "primary" | "secondary" | "success" | "warning" | "error" | "neutral";

export type StatutAffectation = (typeof STATUTS_AFFECTATION)[number];
export type StatutNomination = (typeof STATUTS_NOMINATION)[number];
export type StatutCarriere = StatutAffectation | StatutNomination;

/**
 * Couleur du badge par statut de carrière. Les libellés viennent de l'API
 * (`statut_label`) ; ici on ne mappe que la couleur. Les deux familles de
 * statuts partagent `approuvee`, `active`, `rejetee` mais divergent sur
 * `en_attente(_validation)` et `terminee`/`cloturee`.
 */
export const STATUT_CARRIERE_COLOR: Record<StatutCarriere, BadgeColor> = {
  en_attente_validation: "warning",
  en_attente: "warning",
  approuvee: "primary",
  active: "success",
  terminee: "neutral",
  cloturee: "neutral",
  rejetee: "error",
};

/** Libellé de repli si l'API ne fournit pas `statut_label`. */
export const STATUT_CARRIERE_LABEL: Record<StatutCarriere, string> = {
  en_attente_validation: "En attente de validation",
  en_attente: "En attente de validation",
  approuvee: "Approuvée",
  active: "Active",
  terminee: "Terminée",
  cloturee: "Clôturée",
  rejetee: "Rejetée",
};

/** Base d'un `structurable_type` Eloquent → nom lisible (Direction/Service/Bureau). */
export function structurableLabel(type?: string | null): string {
  if (!type) return "—";
  const base = type.split("\\").pop() ?? type;
  return base;
}

/**
 * Nom affichable d'un agent imbriqué (`nom_complet`, sinon `nom prenom`).
 * Les champs sont acceptés `null` : certaines ressources (module social) les
 * sérialisent ainsi plutôt qu'absents.
 */
export function agentNom(
  agent?: { nom_complet?: string | null; nom?: string | null; prenom?: string | null } | null,
): string {
  if (!agent) return "—";
  if (agent.nom_complet) return agent.nom_complet;
  const full = [agent.nom, agent.prenom].filter(Boolean).join(" ");
  return full || "—";
}
