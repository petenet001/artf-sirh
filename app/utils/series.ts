import type { PointSerie } from "~/components/viz/Courbe.vue";

const MOIS_COURTS = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
] as const;

export interface MoisSerie {
  /** Clé technique `YYYY-MM`, triable à plat. */
  cle: string;
  /** Libellé d'axe (« août »). */
  libelle: string;
}

/**
 * Les `nombre` derniers mois, du plus ancien au plus récent, mois de
 * `reference` inclus.
 *
 * La grille est construite **avant** de compter : sinon un mois sans aucun
 * événement disparaîtrait de l'axe au lieu de valoir zéro, et la courbe
 * raconterait une continuité qui n'existe pas.
 */
export function grilleMois(nombre: number, reference = new Date()): MoisSerie[] {
  return Array.from({ length: nombre }, (_, i) => {
    const d = new Date(reference.getFullYear(), reference.getMonth() - (nombre - 1 - i), 1);
    return {
      cle: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      libelle: MOIS_COURTS[d.getMonth()]!,
    };
  });
}

/** Libellé court d'un mois à partir de son numéro (1–12). */
export function libelleMois(mois: number): string {
  return MOIS_COURTS[mois - 1] ?? String(mois);
}

/**
 * Compte combien de dates tombent dans chaque mois de la grille.
 *
 * Une date hors fenêtre, vide ou illisible est ignorée — jamais rattachée au
 * mois le plus proche : un point inventé se lit comme un point mesuré.
 */
export function compterParMois(
  dates: (string | null | undefined)[],
  grille: MoisSerie[],
): PointSerie[] {
  const totaux = new Map(grille.map((m) => [m.cle, 0]));
  for (const date of dates) {
    // `2026-08-15` → `2026-08`. Les dates de l'API sont des chaînes `Y-m-d`.
    const cle = date && date.length >= 7 ? date.slice(0, 7) : null;
    if (cle && totaux.has(cle)) totaux.set(cle, totaux.get(cle)! + 1);
  }
  return grille.map((m) => ({ ...m, valeur: totaux.get(m.cle)! }));
}
