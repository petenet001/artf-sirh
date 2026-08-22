/**
 * Grille salariale calculée + paramètres globaux, pour le module Rémunération.
 * `allSettled` garde l'écran robuste si l'une des deux ressources échoue.
 */
export function useSalaireGrille() {
  const salairesApi = useSalairesApi();
  const parametresApi = useGrilleParametresApi();

  const { data, pending, error, refresh } = useAsyncData("salaire-grille", async () => {
    const [grille, parametres] = await Promise.allSettled([
      salairesApi.list(),
      parametresApi.current(),
    ]);

    return {
      lignes: grille.status === "fulfilled" ? grille.value.data : [],
      parametres: parametres.status === "fulfilled" ? parametres.value.data : null,
    };
  });

  return { data, pending, error, refresh };
}
