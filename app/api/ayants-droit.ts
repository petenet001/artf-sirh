import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { AyantDroit, AyantDroitInput, AyantDroitPiece, DossierSocial } from "~/schemas/ayant-droit";
import type { TYPES_PIECE_AYANT_DROIT } from "~/constants/enums";

/**
 * Repository Ayants droit (`/affaires-sociales/ayants-droit`, CCN art. 58–59).
 *
 * Règles portées par l'API (422) : un seul conjoint actif, au plus deux enfants
 * actifs sous tutelle, agent archivé interdit. Les champs `age`, `a_charge` et
 * `eligible_arbre_noel` sont calculés serveur.
 *
 * ⚠️ `nb_enfants` de la situation familiale n'est plus la saisie maître : dès
 * que des enfants nominatifs existent, l'API le recalcule.
 *
 * Filtres serveur : `agent_id`, `type`, `actif`, `lien_juridique`.
 */
export function useAyantsDroitApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<AyantDroit>>("/affaires-sociales/ayants-droit", { query: params }),

    byAgent: (agentId: number) =>
      api<ApiCollection<AyantDroit>>(`/affaires-sociales/agents/${agentId}/ayants-droit`),

    /** Affiliations + ayants droit + synthèse (arbre de Noël, enfants à charge). */
    dossierSocial: (agentId: number) =>
      api<ApiResponse<DossierSocial>>(`/affaires-sociales/agents/${agentId}/dossier-social`),

    getById: (id: number) => api<ApiResponse<AyantDroit>>(`/affaires-sociales/ayants-droit/${id}`),

    create: (payload: AyantDroitInput) =>
      api<ApiResponse<AyantDroit>>("/affaires-sociales/ayants-droit", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<AyantDroitInput>) =>
      api<ApiResponse<AyantDroit>>(`/affaires-sociales/ayants-droit/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) =>
      api<{ message: string }>(`/affaires-sociales/ayants-droit/${id}`, { method: "DELETE" }),

    // — Pièces justificatives ——————————————————————————————————————
    pieces: (id: number) =>
      api<ApiCollection<AyantDroitPiece>>(`/affaires-sociales/ayants-droit/${id}/pieces`),

    /** Multipart : `fichier` (pdf/jpg/png/doc/docx, 10 Mo max) + `type_piece`. */
    ajouterPiece: (id: number, fichier: File, typePiece: (typeof TYPES_PIECE_AYANT_DROIT)[number]) => {
      const body = new FormData();
      body.append("fichier", fichier);
      body.append("type_piece", typePiece);
      return api<ApiResponse<AyantDroitPiece>>(`/affaires-sociales/ayants-droit/${id}/pieces`, {
        method: "POST",
        body,
      });
    },

    telechargerPiece: (id: number, pieceId: number) =>
      api<Blob>(`/affaires-sociales/ayants-droit/${id}/pieces/${pieceId}`, { responseType: "blob" }),

    supprimerPiece: (id: number, pieceId: number) =>
      api<{ message: string }>(`/affaires-sociales/ayants-droit/${id}/pieces/${pieceId}`, { method: "DELETE" }),
  };
}
