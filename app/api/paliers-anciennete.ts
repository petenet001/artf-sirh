import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { PalierAnciennete, PalierAncienneteInput } from "~/schemas/palier-anciennete";

/**
 * `anciennete_max` vide = pas de plafond : on envoie `null` explicitement,
 * sinon une édition qui retire le plafond laisserait l'ancienne valeur.
 */
function toBody(payload: Partial<PalierAncienneteInput>): Partial<PalierAncienneteInput> {
  return { ...payload, anciennete_max: payload.anciennete_max ?? null };
}

/**
 * Repository Paliers d'ancienneté (paramétrage RH, sous `/conges`). Lecture avec
 * `consulter-conges` ; écriture avec `valider-conges`. Compatible `BaseCrudManager`.
 */
export function usePaliersAncienneteApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<PalierAnciennete>>("/conges/paliers-anciennete", { query: params }),

    create: (payload: PalierAncienneteInput) =>
      api<ApiResponse<PalierAnciennete>>("/conges/paliers-anciennete", { method: "POST", body: toBody(payload) }),

    update: (id: number, payload: Partial<PalierAncienneteInput>) =>
      api<ApiResponse<PalierAnciennete>>(`/conges/paliers-anciennete/${id}`, { method: "PUT", body: toBody(payload) }),

    remove: (id: number) =>
      api<{ message: string }>(`/conges/paliers-anciennete/${id}`, { method: "DELETE" }),
  };
}
