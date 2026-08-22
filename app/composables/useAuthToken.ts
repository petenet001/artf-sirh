/**
 * Token d'authentification persistant en cookie.
 * Réactif et partagé client/serveur via `useCookie`.
 */
export function useAuthToken() {
  return useCookie<string | null>("auth.token", {
    maxAge: 60 * 60 * 8, // 8 heures
    sameSite: "lax",
    secure: !import.meta.dev,
    path: "/",
  });
}
