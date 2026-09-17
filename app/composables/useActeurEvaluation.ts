import type { ActeurEvaluation } from "~/utils/evaluationActions";

/**
 * Identité + droits du connecté vis-à-vis du module Évaluation, sous la forme
 * attendue par `utils/evaluationActions`. Centralisé ici pour que la règle
 * « RH = rôle `rh` ou `admin` » (et non la permission `valider-evaluations`,
 * détenue par tous les chefs) ne soit écrite qu'une fois.
 */
export function useActeurEvaluation() {
  const auth = useAuthStore();

  return computed<ActeurEvaluation>(() => ({
    agentId: auth.user?.agent_id ?? null,
    estRh: auth.hasRole("rh") || auth.hasRole("admin"),
    estDg: auth.hasRole("directeur-general"),
    estAdmin: auth.hasRole("admin"),
    roles: auth.user?.roles?.map((r) => r.name) ?? [],
    peutValider: auth.can("valider-evaluations"),
    peutCreer: auth.can("creer-evaluations"),
  }));
}
