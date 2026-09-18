import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { StructureSanitaire, StructureSanitaireInput } from "~/schemas/structure-sanitaire";

/**
 * Repository Structures sanitaires agréées
 * (`/affaires-sociales/structures-sanitaires`, D.3.5).
 *
 * Référentiel des prestataires : médecins, formations sanitaires, opticiens,
 * pharmacies. Les dossiers santé s'y rattachent par `structure_sanitaire_id`.
 *
 * Filtres serveur : `type`, `actif`.
 */
export function useStructuresSanitairesApi() {
  const api = useApiClient();
  const base = "/affaires-sociales/structures-sanitaires";

  return {
    list: (params?: ListParams) => api<ApiCollection<StructureSanitaire>>(base, { query: params }),

    getById: (id: number) => api<ApiResponse<StructureSanitaire>>(`${base}/${id}`),

    create: (payload: StructureSanitaireInput) =>
      api<ApiResponse<StructureSanitaire>>(base, { method: "POST", body: payload }),

    update: (id: number, payload: Partial<StructureSanitaireInput>) =>
      api<ApiResponse<StructureSanitaire>>(`${base}/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) => api<{ message: string }>(`${base}/${id}`, { method: "DELETE" }),
  };
}
