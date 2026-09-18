import type { ActeurEvaluation } from "~/utils/evaluationActions";
import { estRh } from "~/constants/roles";

/**
 * Identité + droits du connecté vis-à-vis du module Évaluation, sous la forme
 * attendue par `utils/evaluationActions`. Centralisé ici pour que la règle
 * « RH = un rôle DRHL ou `admin` » (et non la permission `valider-evaluations`,
 * détenue par tous les chefs) ne soit écrite qu'une fois. Depuis la vague F,
 * cette règle passe par `estRh` : il y a cinq rôles de bureau en plus de `rh`.
 */
export function useActeurEvaluation() {
  const auth = useAuthStore();

  return computed<ActeurEvaluation>(() => ({
    agentId: auth.user?.agent_id ?? null,
    estRh: estRh(auth.hasRole),
    estDg: auth.hasRole("directeur-general"),
    estAdmin: auth.hasRole("admin"),
    roles: auth.user?.roles?.map((r) => r.name) ?? [],
    peutValider: auth.can("valider-evaluations"),
    peutCreer: auth.can("creer-evaluations"),
  }));
}
