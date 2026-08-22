/**
 * Client HTTP unique de l'application.
 *
 * C'est le SEUL point qui connaît la baseURL, injecte le token et gère les
 * erreurs d'authentification. Aucune page ni aucun store ne doit appeler
 * `$fetch` directement : tout passe par la couche `api/`, qui s'appuie ici.
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
    },
    onResponseError({ response }) {
      if (response.status === 401 || response.status === 403) {
        useAuthStore().clearSession();
        if (import.meta.client) navigateTo("/login", { replace: true });
      }
    },
  });
}
