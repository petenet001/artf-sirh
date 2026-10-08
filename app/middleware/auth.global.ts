import { canAccessPath, landingRoute } from "~/constants/modules";
import { porteesSession } from "~/constants/entite";
import { nomsRoles } from "~/constants/utilisateurs";

/**
 * Garde globale : authentification + **contrôle d'accès par module**.
 * - non authentifié → /login (sauf routes publiques)
 * - authentifié sur une route publique → renvoyé vers son atterrissage
 * - agent simple arrivant sur la grille `/` → redirigé vers /mon-espace
 * - route non autorisée (URL tapée) → renvoyé vers son atterrissage
 *
 * La garde contrôle le **chemin**, pas seulement le module : plusieurs
 * sous-onglets ont leur propre règle (`navGates`). Les vérifier ici évite qu'une
 * URL tapée ouvre une page dont le premier appel API repartira en 403.
 */
const PUBLIC_ROUTES = ["/login"];

export default defineNuxtRouteMiddleware((to, from) => {
  const token = useAuthToken();
  const isPublic = PUBLIC_ROUTES.includes(to.path);

  if (!token.value) return isPublic ? undefined : navigateTo("/login");

  const auth = useAuthStore();
  // Même contexte que le menu (`useModules`), portées comprises : sans elles,
  // un onglet visible comme « Mon entité » renverrait à l'accueil au clic.
  const portees = porteesSession(auth.user ? nomsRoles(auth.user) : []);
  const ctx = {
    can: (p: string) => auth.can(p),
    hasRole: (r: string) => auth.hasRole(r),
    hasScope: (s: string) => portees.includes(s),
  };
  const landing = landingRoute(ctx);

  // Déjà connecté sur une page publique (ex. /login) → vers l'atterrissage.
  if (isPublic) return navigateTo(landing);

  // `/` ne rend plus de grille : on redirige vers le 1er module autorisé.
  if (to.path === "/") return navigateTo(landing);

  // Garde d'accès : module ET sous-onglet. On renvoie vers l'atterrissage
  // plutôt que vers une page « 403 » : le backend le recommande explicitement
  // (note FE §2k.6) et c'est plus utile — on remet l'utilisateur sur ses rails
  // au lieu de le laisser devant une impasse.
  if (!canAccessPath(to.path, ctx)) {
    // Mais une redirection muette laisse croire à un bug : on dit pourquoi.
    // Seulement si la navigation vient de l'utilisateur (`from` renseigné et
    // différent) — au premier chargement, la page n'est pas encore là pour
    // porter le message.
    if (import.meta.client && from.path !== to.path) {
      useToast().add({
        title: "Page non accessible",
        description: "Votre compte n'a pas les droits pour cette page. Vous avez été ramené à votre accueil.",
        color: "warning",
        icon: "i-lucide-lock",
      });
    }
    return navigateTo(landing);
  }
});
