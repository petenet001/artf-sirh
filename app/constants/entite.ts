import { STRUCTURABLE_TYPES } from "~/constants/enums";

/** Type polymorphe de structure porté par une affectation. */
export type StructurableType = (typeof STRUCTURABLE_TYPES)[number];

/** Libellé lisible d'un type de structure. */
export const ENTITE_LABEL: Record<StructurableType, string> = {
  "App\\Models\\Direction": "Direction",
  "App\\Models\\Service": "Service",
  "App\\Models\\Bureau": "Bureau",
};

/**
 * Postes qui font d'un agent le **responsable** de l'entité où il est affecté.
 *
 * L'API n'expose pas de drapeau « chef de structure » : la seule information
 * disponible est le `poste` de `nomination_active`, du texte libre. On le
 * rapproche donc de cette liste de mots-clés — **c'est ici, et nulle part
 * ailleurs, qu'on ajuste** quand les intitulés réels seront figés.
 */
export const POSTES_RESPONSABLE = [
  "directeur general",
  "directrice generale",
  "directeur",
  "directrice",
  "chef de service",
  "chef de bureau",
  "chef de division",
  "chef",
  "responsable",
] as const;

/** Minuscules sans accents, pour comparer des intitulés saisis à la main. */
function normalise(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Le poste (texte libre) désigne-t-il un responsable de structure ? */
export function estPosteResponsable(poste?: string | null): boolean {
  if (!poste) return false;
  const p = normalise(poste);
  return POSTES_RESPONSABLE.some((mot) => p.includes(mot));
}

/** Le type polymorphe reçu est-il une structure connue ? */
export function estStructurable(type?: string | null): type is StructurableType {
  return !!type && (STRUCTURABLE_TYPES as readonly string[]).includes(type);
}
