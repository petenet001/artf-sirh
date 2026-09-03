import type { Notification } from "~/schemas/notification";

/**
 * État réactif **partagé** de la cloche de notifications. `useState` garantit
 * une source unique entre tous les points d'affichage (badge, panneau) sans
 * refetch redondant. Le compteur `nonLues` vient de `meta.non_lues` (source de
 * vérité serveur), pas d'un décompte local des items chargés.
 *
 * Volontairement sans polling automatique : on rafraîchit à l'ouverture du
 * panneau (et au montage). Un vrai temps réel (SSE/WebSocket) viendra plus tard
 * si le besoin se confirme.
 */
export function useNotifications() {
  const api = useNotificationsApi();

  const items = useState<Notification[]>("notifications:items", () => []);
  const nonLues = useState<number>("notifications:non-lues", () => 0);
  const pending = useState<boolean>("notifications:pending", () => false);
  const loaded = useState<boolean>("notifications:loaded", () => false);

  /** Recharge les dernières notifications + le compteur. Silencieux (poll de fond). */
  async function refresh() {
    pending.value = true;
    try {
      const page = await api.list({ per_page: 10 });
      items.value = page.data;
      nonLues.value = page.meta?.non_lues ?? 0;
      loaded.value = true;
    } catch {
      // Poll de fond : une erreur réseau ne doit ni casser la navbar ni spammer
      // un toast. L'utilisateur retentera en rouvrant la cloche.
    } finally {
      pending.value = false;
    }
  }

  /** Marque une notification comme lue (optimiste) et décrémente le badge. */
  async function marquerLu(notification: Notification) {
    if (notification.lu) return;
    await api.marquerLu(notification.id);
    items.value = items.value.map((n) => (n.id === notification.id ? { ...n, lu: true } : n));
    nonLues.value = Math.max(0, nonLues.value - 1);
  }

  /** Marque tout comme lu (optimiste) et remet le badge à zéro. */
  async function toutLire() {
    if (nonLues.value === 0) return;
    await api.toutLire();
    items.value = items.value.map((n) => ({ ...n, lu: true }));
    nonLues.value = 0;
  }

  return { items, nonLues, pending, loaded, refresh, marquerLu, toutLire };
}
