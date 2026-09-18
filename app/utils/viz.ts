import { VIZ } from "~/constants/reporting";

export interface EchelleRonde {
  /** Haut de l'échelle : un multiple rond du pas, jamais en dessous du max. */
  borne: number;
  pas: number;
  /** Valeurs graduées, de 0 à `borne` inclus. */
  graduations: number[];
}

/** Pas « lisibles » : on ne gradue jamais de 3 en 3 ni de 7 en 7. */
const PAS_RONDS = [1, 2, 5] as const;

/**
 * Échelle aux valeurs rondes pour graduer une grandeur partant de zéro.
 *
 * Parmi les pas ronds (1, 2, 5 × 10ⁿ), on retient celui qui donne la borne la
 * plus serrée au-dessus du maximum, sans dépasser `cible + 2` intervalles ; à
 * borne égale, celui dont le nombre d'intervalles est le plus proche de `cible`.
 * Les barres sont proportionnées à `borne`, pas au maximum brut : c'est ce qui
 * fait tomber chaque graduation pile sur sa valeur. Le pas vaut au moins 1 —
 * on compte des agents, des jours, des lots : une demi-graduation ne veut rien dire.
 */
export function echelleRonde(max: number, cible = 4): EchelleRonde {
  const haut = Math.max(1, max);
  const exposant = Math.floor(Math.log10(haut / cible));

  let retenue: { borne: number; pas: number; ecart: number } | null = null;
  for (const e of [exposant - 1, exposant, exposant + 1]) {
    for (const rond of PAS_RONDS) {
      const pas = rond * 10 ** e;
      if (pas < 1) continue;
      const intervalles = Math.ceil(haut / pas);
      if (intervalles > cible + 2) continue;
      const candidat = { borne: intervalles * pas, pas, ecart: Math.abs(intervalles - cible) };
      if (
        !retenue ||
        candidat.borne < retenue.borne ||
        (candidat.borne === retenue.borne && candidat.ecart < retenue.ecart)
      ) {
        retenue = candidat;
      }
    }
  }

  // Filet : un pas de 1 couvre toujours un maximum trop petit pour les candidats.
  const { borne, pas } = retenue ?? { borne: Math.ceil(haut), pas: 1 };
  return {
    borne,
    pas,
    graduations: Array.from({ length: Math.round(borne / pas) + 1 }, (_, i) => i * pas),
  };
}

/** Position d'une valeur sur l'échelle, en pourcentage borné à [0, 100]. */
export function positionSurEchelle(valeur: number, borne: number): number {
  if (borne <= 0) return 0;
  return Math.min(100, Math.max(0, (valeur / borne) * 100));
}

const COMPACT = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });

/**
 * Libellé d'axe compact (« 84,5 M ») : une graduation se lit d'un coup d'œil,
 * le montant exact vit dans l'infobulle.
 */
export function formatGraduation(valeur: number): string {
  return Math.abs(valeur) < 10_000 ? valeur.toLocaleString("fr-FR") : COMPACT.format(valeur);
}

/**
 * Couleur d'une part dans une répartition catégorielle. Le gris est réservé à
 * l'absence de donnée : « non renseigné » n'est pas une catégorie et ne doit
 * pas ressembler à une série. Les autres parts prennent les teintes dans
 * l'ordre fixe, jamais recyclé à la couleur d'une autre.
 */
export function couleurPart(part: { cle: string; libelle: string }, index: number): string {
  if (/inconnu|non renseign/i.test(part.cle + part.libelle)) return VIZ.neutre;
  return VIZ.categoriel[index] ?? VIZ.neutre;
}

const ENTITES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/**
 * Échappe un texte avant de l'insérer dans un gabarit d'infobulle Unovis, qui
 * attend une chaîne HTML : un libellé venu de l'API n'y est jamais interprété.
 */
export function echapperHtml(texte: string): string {
  return texte.replace(/[&<>"']/g, (c) => ENTITES[c]!);
}
