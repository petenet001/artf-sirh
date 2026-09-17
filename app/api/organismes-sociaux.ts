import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { OrganismeSocial, OrganismeSocialInput } from "~/schemas/organisme-social";

/**
 * Repository Organismes sociaux (`/affaires-sociales/organismes`).
 * Lecture `consulter-affaires-sociales`, écriture `gerer-affaires-sociales`.
 *
 * ⚠️ La liste ne renvoie que les organismes **actifs** par défaut : passer
 * `actif: "all"` pour tout voir. La CNSS (organisme `systeme`) n'est pas
 * supprimable et son type / code ne sont pas modifiables (422).
 *
 * Filtres serveur : `nom`, `type`, `actif`, `code`.
 */
export function useOrganismesSociauxApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<OrganismeSocial>>("/affaires-sociales/organismes", { query: params }),

    getById: (id: number) => api<ApiResponse<OrganismeSocial>>(`/affaires-sociales/organismes/${id}`),

    create: (payload: OrganismeSocialInput) =>
      api<ApiResponse<OrganismeSocial>>("/affaires-sociales/organismes", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<OrganismeSocialInput>) =>
      api<ApiResponse<OrganismeSocial>>(`/affaires-sociales/organismes/${id}`, { method: "PUT", body: payload }),

    /** 422 si l'organisme est déjà utilisé par une affiliation. */
    remove: (id: number) =>
      api<{ message: string }>(`/affaires-sociales/organismes/${id}`, { method: "DELETE" }),
  };
}
