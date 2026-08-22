import type { ApiResponse, ApiCollection } from "~/types/api";
import type { ActeAdministratif, ActeGenererInput } from "~/schemas/acte-administratif";

/**
 * Repository Actes administratifs. Seul endroit autorisé à connaître les
 * routes actes. Tout vit sous `/integration` et requiert l'auth.
 * Toutes les fonctions throwent en cas d'erreur.
 */
export function useActesAdministratifsApi() {
  const api = useApiClient();

  return {
    byDossier: (dossierId: number) =>
      api<ApiCollection<ActeAdministratif>>(`/integration/dossiers/${dossierId}/actes`),

    generer: (dossierId: number, payload: ActeGenererInput) =>
      api<ApiResponse<ActeAdministratif>>(`/integration/dossiers/${dossierId}/actes`, {
        method: "POST",
        body: payload,
      }),

    signer: (id: number) =>
      api<ApiResponse<ActeAdministratif>>(`/integration/actes/${id}/signer`, {
        method: "POST",
      }),
  };
}
