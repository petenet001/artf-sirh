import { canAccessModule, landingRoute, moduleForPath } from "~/constants/modules";

/**
 * Garde globale : authentification + **contrôle d'accès par module**.
 * - non authentifié → /login (sauf routes publiques)
 * - authentifié sur une route publique → renvoyé vers son atterrissage
 * - agent simple arrivant sur la grille `/` → redirigé vers /mon-espace
 * - route d'un module non autorisé (URL tapée) → renvoyé vers son atterrissage
 */
const PUBLIC_ROUTES = ["/login"];

export default defineNuxtRouteMiddleware((to) => {
  const token = useAuthToken();
  const isPublic = PUBLIC_ROUTES.includes(to.path);

  if (!token.value) return isPublic ? undefined : navigateTo("/login");

  const auth = useAuthStore();
  const ctx = {
    can: (p: string) => auth.can(p),
    hasRole: (r: string) => auth.hasRole(r),
  };
  const landing = landingRoute(ctx);

  // Déjà connecté sur une page publique (ex. /login) → vers l'atterrissage.
  if (isPublic) return navigateTo(landing);

  // `/` ne rend plus de grille : on redirige vers le 1er module autorisé.
  if (to.path === "/") return navigateTo(landing);

  // Garde d'accès : empêche d'entrer dans un module interdit via l'URL.
  const mod = moduleForPath(to.path);
  if (mod && !canAccessModule(mod, ctx)) return navigateTo(landing);
});
