import { reactionSession } from "~/utils/httpErreur";
import { normaliserQuery } from "~/utils/query";

/**
 * Client HTTP unique de l'application.
 *
 * C'est le SEUL point qui connaît la baseURL, injecte le token et gère les
 * erreurs d'authentification. Aucune page ni aucun store ne doit appeler
 * `$fetch` directement : tout passe par la couche `api/`, qui s'appuie ici.
 *
 * ## 401 et 403 ne sont pas la même chose
 *
 * - **401** — le token est invalide ou expiré. Il n'y a plus de session : on la
 *   nettoie et on renvoie au login. La redirection porte un motif, pour que
 *   l'écran de connexion explique ce qui vient de se passer plutôt que de
 *   laisser croire à un bug.
 * - **403** (`{"message":"Accès refusé."}`) — la session est **parfaitement
 *   valide**, il manque seulement une permission. Déconnecter serait à la fois
 *   faux et brutal : l'utilisateur perd sa place pour avoir cliqué au mauvais
 *   endroit. L'erreur remonte donc normalement à l'appelant, qui la présente
 *   via `useApiError`.
 *
 * Les deux étaient traités pareil : c'est ce qui provoquait les déconnexions
 * inexpliquées sur une page interdite.
 *
 * ## Booléens en query
 *
 * `{ actif: true }` partirait en `?actif=true`, que les filtres d'égalité du
 * backend ne reconnaissent pas (liste vide). On envoie `1` / `0` — voir
 * `utils/query.ts`.
 */
export function useApiClient() {
  const { apiBase } = useRuntimeConfig().public;
  const token = useAuthToken();

  return $fetch.create({
    baseURL: apiBase,
    onRequest({ options }) {
      const headers = new Headers(options.headers);
      headers.set("Accept", "application/json");
      if (token.value) headers.set("Authorization", `Bearer ${token.value}`);
      options.headers = headers;
      options.query = normaliserQuery(options.query);
    },
    onResponseError({ response }) {
      if (reactionSession(response.status, response.url) !== "deconnecter") return;

      useAuthStore().clearSession();
      if (import.meta.client) {
        navigateTo({ path: "/login", query: { raison: "session" } }, { replace: true });
      }
    },
  });
}
