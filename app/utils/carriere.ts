import type { Diplome } from "~/schemas/diplome";
import type { Classegrillesalariale } from "~/schemas/classegrillesalariale";
import type { Echelon } from "~/schemas/echelon";

/**
 * Déduction de la carrière d'entrée à partir du diplôme.
 *
 * Règle métier (portée par l'API dans `AgentService::resoudreInfosDepuisDiplome`,
 * rejouée ici pour que le formulaire l'affiche au lieu de la subir) :
 * un diplôme pointe une **classe de la grille salariale**, laquelle porte le
 * couple *catégorie × grade*. L'échelon d'entrée est toujours le **1er**.
 * Seule la **fonction** reste un choix humain.
 *
 * L'API ne renvoie pas la classe dans `GET /diplomes` (`classe_grille` est en
 * `whenLoaded` sans eager loading, donc toujours `null`) : on la retrouve
 * côté client en rapprochant `diplome.classegrillesalariale_id` de la
 * collection `GET /grille-classes`, qui, elle, charge catégorie et grade.
 */
export type CarriereDeduite = {
  categorieId: number | null;
  gradeId: number | null;
  echelonId: number | null;
  categorieLabel: string | null;
  gradeLabel: string | null;
  echelonLabel: string | null;
};

/** Classe de grille d'un diplôme, via l'expansion serveur ou la collection. */
export function classeDuDiplome(
  diplome: Diplome | null | undefined,
  classes: Classegrillesalariale[],
): Classegrillesalariale | null {
  const id = diplome?.classegrillesalariale_id ?? diplome?.classe_grille?.id ?? null;
  if (id == null) return null;

  return classes.find((c) => c.id === id) ?? null;
}

/**
 * Carrière déduite d'un diplôme, ou `null` si la donnée n'est pas là
 * (diplôme non rattaché à une classe, ou grille non chargée) — auquel cas
 * l'appelant laisse les champs à la saisie manuelle.
 */
export function carriereDepuisDiplome(
  diplome: Diplome | null | undefined,
  classes: Classegrillesalariale[],
  echelons: Echelon[],
): CarriereDeduite | null {
  const classe = classeDuDiplome(diplome, classes);
  // Repli sur l'expansion serveur si elle est un jour renvoyée.
  const expansion = diplome?.classe_grille ?? null;
  if (!classe && !expansion) return null;

  const premierEchelon = echelons.find((e) => e.numero === 1) ?? null;

  return {
    categorieId: classe?.categorie?.id ?? expansion?.categorie_id ?? null,
    gradeId: classe?.grade?.id ?? expansion?.grade_id ?? null,
    echelonId: premierEchelon?.id ?? null,
    categorieLabel: classe?.categorie?.nom ?? expansion?.categorie ?? null,
    gradeLabel: classe?.grade?.nom ?? expansion?.grade ?? null,
    echelonLabel: premierEchelon?.nom ?? null,
  };
}
