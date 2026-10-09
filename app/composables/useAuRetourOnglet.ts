/**
 * Rappelle `action` quand l'utilisateur revient sur l'onglet.
 *
 * Sert aux écrans dont l'état change ailleurs : une campagne close dans un
 * autre onglet, un N+1 corrigé par la RH. Sans cela, l'écran garde ce qu'il a
 * lu à l'ouverture jusqu'à un rechargement complet.
 */
export function useAuRetourOnglet(action: () => unknown) {
  function surVisibilite() {
    if (document.visibilityState === "visible") void action();
  }

  onMounted(() => document.addEventListener("visibilitychange", surVisibilite));
  onBeforeUnmount(() => document.removeEventListener("visibilitychange", surVisibilite));
}
