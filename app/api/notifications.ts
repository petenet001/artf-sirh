import type { ApiResponse } from "~/types/api";
import type { Notification, NotificationsPage } from "~/schemas/notification";

/** Paramètres de l'inbox `GET /notifications` (seul endpoint paginé de l'API). */
export interface NotificationsQuery {
  /** Ne renvoyer que les non lues. */
  non_lues?: boolean;
  page?: number;
  per_page?: number;
}

/**
 * Repository Notifications (cloche). Seul endroit autorisé à connaître les
 * routes `/notifications`. Auth Bearer requise (aucune permission dédiée).
 * Toutes les fonctions throwent en cas d'erreur.
 */
export function useNotificationsApi() {
  const api = useApiClient();

  return {
    /** Inbox paginée. `non_lues` filtre côté serveur ; la meta porte le compteur. */
    list: (query: NotificationsQuery = {}) =>
      api<NotificationsPage>("/notifications", {
        query: {
          non_lues: query.non_lues ? 1 : undefined,
          page: query.page,
          per_page: query.per_page,
        },
      }),

    /** Marque une notification comme lue. `id` = UUID (404 si ce n'est pas la sienne). */
    marquerLu: (id: string) =>
      api<ApiResponse<Notification>>(`/notifications/${id}/lu`, { method: "POST", body: {} }),

    /** Marque toutes les notifications de l'utilisateur comme lues. */
    toutLire: () =>
      api<{ message: string }>("/notifications/tout-lire", { method: "POST", body: {} }),
  };
}
