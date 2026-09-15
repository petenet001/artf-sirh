import { STATUTS_AGENT, STATUTS_AGENT_MODIFIABLES, type STATUTS_MATRIMONIAUX } from "~/constants/enums";
import type { BadgeColor } from "~/constants/carriere";

export type StatutAgent = (typeof STATUTS_AGENT)[number];
export type StatutAgentModifiable = (typeof STATUTS_AGENT_MODIFIABLES)[number];
export type StatutMatrimonial = (typeof STATUTS_MATRIMONIAUX)[number];

/** Libellé lisible d'un statut d'agent (l'API ne renvoie pas de `statut_label`). */
export const STATUT_AGENT_LABEL: Record<StatutAgent, string> = {
  actif: "Actif",
  inactif: "Inactif",
  suspendu: "Suspendu",
  retraite: "Retraité",
  stagiaire: "Stagiaire",
  archive: "Archivé",
  detachement: "En détachement",
  position_exceptionnelle: "Position exceptionnelle",
  disponibilite: "En disponibilité",
  sous_le_drapeau: "Sous le drapeau",
};

/**
 * Couleur de pastille par statut. Vert = en activité ; bleu = positions hors
 * activité *avec* droits maintenus (CCN art. 78, 80) ; orange = rémunération ou
 * avancement suspendus (art. 79, sanction) ; gris = sorti de l'effectif.
 */
export const STATUT_AGENT_COLOR: Record<StatutAgent, BadgeColor> = {
  actif: "success",
  stagiaire: "primary",
  detachement: "primary",
  position_exceptionnelle: "primary",
  sous_le_drapeau: "primary",
  disponibilite: "warning",
  suspendu: "warning",
  inactif: "neutral",
  retraite: "neutral",
  archive: "neutral",
};

/** Libellé d'un statut quelconque (repli sur la valeur brute, `—` si absent). */
export function statutAgentLabel(statut?: string | null): string {
  if (!statut) return "—";
  return STATUT_AGENT_LABEL[statut as StatutAgent] ?? statut;
}

/** Couleur d'un statut quelconque (repli neutre). */
export function statutAgentColor(statut?: string | null): BadgeColor {
  return STATUT_AGENT_COLOR[statut as StatutAgent] ?? "neutral";
}

/** Le statut peut-il être posé via `PUT /integration/agents/{id}` ? */
export function estStatutAgentModifiable(statut?: string | null): statut is StatutAgentModifiable {
  return (STATUTS_AGENT_MODIFIABLES as readonly string[]).includes(statut ?? "");
}

/** Options `{ label, value }` de tous les statuts (filtres de liste). */
export const STATUT_AGENT_OPTIONS = STATUTS_AGENT.map((value) => ({ label: STATUT_AGENT_LABEL[value], value }));

/** Options des seuls statuts modifiables (formulaire d'édition). */
export const STATUT_AGENT_MODIFIABLE_OPTIONS = STATUTS_AGENT_MODIFIABLES.map((value) => ({
  label: STATUT_AGENT_LABEL[value],
  value,
}));

/** Libellé lisible d'un statut matrimonial (l'API ne renvoie pas de `*_label`). */
export const STATUT_MATRIMONIAL_LABEL: Record<StatutMatrimonial, string> = {
  celibataire: "Célibataire",
  marie: "Marié(e)",
  divorce: "Divorcé(e)",
  veuf: "Veuf/Veuve",
  union_libre: "Union libre",
};

/** Options `{ label, value }` pour un select de statut matrimonial. */
export const STATUT_MATRIMONIAL_OPTIONS = (
  Object.keys(STATUT_MATRIMONIAL_LABEL) as StatutMatrimonial[]
).map((value) => ({ label: STATUT_MATRIMONIAL_LABEL[value], value }));

/** Taille de fichier lisible (o, Ko, Mo). */
export function formatTaille(octets?: number | null): string {
  if (octets == null) return "—";
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(0)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}
