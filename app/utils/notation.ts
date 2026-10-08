/** Ce qu'il faut faire d'une ligne de grille quittée par le notateur. */
export type SuiteSaisieNote = "ignorer" | "hors-bareme" | "enregistrer";

export interface SaisieNote {
  /** Valeur dans le champ ; `null`/`undefined` = critère non noté. */
  valeur?: number | null;
  commentaire: string;
  bareme: number;
  /** Note déjà enregistrée sur ce critère, si elle existe. */
  initiale?: { note_obtenue: number; commentaire?: string | null };
}

/**
 * Faut-il appeler l'API pour cette ligne ?
 *
 * Extrait de la grille et testé parce que c'est ce qui rend la saisie fluide ou
 * pénible : la sauvegarde se déclenche à la sortie du champ, donc au moindre
 * passage de souris. Sans cette règle, **traverser** la grille sans rien
 * changer déclencherait un appel par ligne.
 *
 * - rien dans le champ → rien à enregistrer ;
 * - valeur et commentaire identiques à l'existant → rien non plus ;
 * - au-delà du barème → refus local, le backend répondrait 422.
 */
export function suiteSaisieNote({ valeur, commentaire, bareme, initiale }: SaisieNote): SuiteSaisieNote {
  if (valeur == null) return "ignorer";
  if (initiale && initiale.note_obtenue === valeur && (initiale.commentaire ?? "") === commentaire) {
    return "ignorer";
  }
  if (valeur > bareme) return "hors-bareme";
  return "enregistrer";
}
