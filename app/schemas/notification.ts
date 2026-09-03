import { z } from "zod";
import type { PaginationMeta, Paginated } from "~/types/api";

/**
 * Notification utilisateur (cloche). Forme renvoyée par l'inbox
 * `GET /notifications` (canal `database`). L'`id` est un **UUID** (string),
 * pas un entier. `data` est le payload de l'événement métier, de forme libre
 * selon le domaine (`dossier_id`, `demande_id`, `agent_id`…), donc typé souple.
 */
export const notificationSchema = z.object({
  id: z.string(),
  type: z.string().nullable().optional(),
  domaine: z.string().nullable().optional(),
  action: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  data: z.record(z.unknown()).nullable().optional(),
  lu: z.boolean(),
  read_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type Notification = z.infer<typeof notificationSchema>;

/**
 * Meta de l'inbox : pagination standard **+** `non_lues` (compteur global,
 * source de vérité du badge de la cloche).
 */
export interface NotificationsMeta extends PaginationMeta {
  non_lues: number;
}

/** Page d'inbox renvoyée par `GET /notifications`. */
export type NotificationsPage = Paginated<Notification, NotificationsMeta>;
