import {
  accessibleModules,
  canAccessModule,
  landingRoute,
  moduleEntry,
  moduleForPath,
  modules,
  visibleNav,
  type AccessContext,
} from "~/constants/modules";
import { porteesSession } from "~/constants/entite";
import { nomsRoles } from "~/constants/utilisateurs";

/**
 * Vue réactive des modules du portail pour l'utilisateur courant.
 * S'appuie sur le store `auth` (permissions/rôles) et sur les helpers purs de
 * `constants/modules`. À utiliser dans les layouts, la grille et les pages.
 */
export function useModules() {
  const auth = useAuthStore();
  const route = useRoute();

  // Contexte d'accès basé sur la session ; recréé à chaque lecture pour que les
  // computed dépendent bien des permissions réactives du store.
  const ctx = (): AccessContext => ({
    can: (p) => auth.can(p),
    hasRole: (r) => auth.hasRole(r),
    // Portée « entite » : dérivée des rôles de la session, comme dans la garde
    // de route (`porteesSession`). Elle n'ouvre que le sous-onglet dédié.
    hasScope: (s) => porteesSession(auth.user ? nomsRoles(auth.user) : []).includes(s),
  });

  const accessible = computed(() => accessibleModules(ctx()));
  /**
   * Modules affichés en onglets de la navbar. `to` pointe la porte d'entrée
   * réellement ouverte (cf. `moduleEntry`), pas l'atterrissage théorique.
   */
  const tabs = computed(() => accessible.value.map((m) => ({ ...m, to: moduleEntry(m, ctx()) })));
  /** Module courant (résolu depuis la route). */
  const active = computed(() => moduleForPath(route.path));
  /** Sous-onglets du module courant, filtrés par leurs règles de visibilité. */
  const nav = computed(() => (active.value ? visibleNav(active.value, ctx()) : []));
  /** Route d'atterrissage (1er module de la navbar). */
  const landing = computed(() => landingRoute(ctx()));

  function canAccess(key: string): boolean {
    const m = modules.find((x) => x.key === key);
    return m ? canAccessModule(m, ctx()) : false;
  }

  return { accessible, tabs, active, nav, landing, canAccess };
}
