import type { STATUTS_MATRIMONIAUX } from "~/constants/enums";

export type StatutMatrimonial = (typeof STATUTS_MATRIMONIAUX)[number];

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
