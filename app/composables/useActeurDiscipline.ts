import type { ActeurDiscipline } from "~/constants/discipline";

/**
 * Droits du connecté sur le module disciplinaire, sous la forme attendue par
 * `constants/discipline`. La CCN sépare strictement les rôles : la RH instruit
 * (`gerer-discipline`), le DG prononce (`prononcer-discipline`), les chefs
 * proposent (`proposer-discipline`) — d'où quatre drapeaux distincts plutôt
 * qu'un « peut tout ».
 */
export function useActeurDiscipline() {
  const auth = useAuthStore();

  return computed<ActeurDiscipline>(() => ({
    peutConsulter: auth.can("consulter-discipline"),
    peutGerer: auth.can("gerer-discipline"),
    peutProposer: auth.can("proposer-discipline"),
    peutPrononcer: auth.can("prononcer-discipline"),
    userId: auth.user?.id ?? null,
  }));
}
