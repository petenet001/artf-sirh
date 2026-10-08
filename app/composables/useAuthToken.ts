/**
 * Token d'authentification persistant en cookie.
 * Réactif et partagé client/serveur via `useCookie`.
 *
 * L'attribut `secure` vient de `runtimeConfig.public.cookieSecure`
 * (`NUXT_PUBLIC_COOKIE_SECURE`) : un cookie `secure` est rejeté par le
 * navigateur sur un déploiement en HTTP simple (serveur interne), ce qui
 * rendait la connexion « muette ». À passer à `true` derrière HTTPS.
 */
export function useAuthToken() {
  const { cookieSecure } = useRuntimeConfig().public;
  return useCookie<string | null>("auth.token", {
    maxAge: 60 * 60 * 8, // 8 heures
    sameSite: "lax",
    secure: cookieSecure,
    path: "/",
  });
}
