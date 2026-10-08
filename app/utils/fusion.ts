/**
 * Recolle dans une ressource déjà affichée ce qu'une action vient de renvoyer.
 *
 * Les routes d'action ne rechargent pas toutes les relations : `POST
 * evaluations/{id}/noter` renvoie la fiche avec ses notes, son agent, son
 * notateur et sa session, mais **sans** la réclamation ni les avis
 * hiérarchiques. Remplacer l'objet entier ferait donc disparaître de l'écran
 * des panneaux que l'action n'a pas touchés.
 *
 * D'où la règle : une clé **absente** de la réponse (`undefined`) conserve sa
 * valeur précédente ; une clé présente écrase, `null` compris — `null` est une
 * information (« plus de réclamation »), `undefined` est un silence.
 */
export function fusionnerRessource<T extends Record<string, unknown>>(
  ancienne: T,
  nouvelle: Partial<T> | null | undefined,
): T {
  if (!nouvelle) return ancienne;

  const sortie: Record<string, unknown> = { ...ancienne };
  for (const [cle, valeur] of Object.entries(nouvelle)) {
    if (valeur !== undefined) sortie[cle] = valeur;
  }
  return sortie as T;
}
