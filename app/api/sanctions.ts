import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type {
  Sanction,
  SanctionInput,
  SanctionPiece,
  InstructionSanctionInput,
  PrononceSanctionInput,
  ClassementSanctionInput,
} from "~/schemas/sanction";
import type { HistoriqueDisciplinaire } from "~/schemas/avertissement";

/**
 * Repository Dossiers disciplinaires (`/discipline/sanctions`, CCN art. 90–91).
 *
 * Circuit : le N+1 dépose un rapport (`proposer-discipline`) → la RH instruit
 * (`gerer-discipline`, **au moins une pièce** sinon 422) → le **DG seul**
 * prononce ou classe sans suite (`prononcer-discipline`).
 *
 * Trois files distinctes selon le rôle : `aInstruire` (RH), `aPrononcer` (DG),
 * `mesRapports` (chefs — ils n'ont pas `consulter-discipline`).
 *
 * L'espace agent (`moi/*`) ne demande **aucune permission** : il suffit que le
 * compte porte un `agent_id` (403 sinon, 404 pour le dossier d'un autre).
 *
 * Filtres serveur : `agent_id`, `type_sanction_id`, `statut`, `created_by`.
 */
export function useSanctionsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Sanction>>("/discipline/sanctions", { query: params }),

    /** File RH : rapports déposés, en attente d'instruction. */
    aInstruire: () => api<ApiCollection<Sanction>>("/discipline/sanctions/a-instruire"),

    /** File DG : dossiers instruits, en attente de prononcé. */
    aPrononcer: () => api<ApiCollection<Sanction>>("/discipline/sanctions/a-prononcer"),

    /** Rapports déposés par le connecté (vue des chefs). */
    mesRapports: () => api<ApiCollection<Sanction>>("/discipline/sanctions/mes-rapports"),

    byAgent: (agentId: number) =>
      api<ApiCollection<Sanction>>(`/discipline/agents/${agentId}/sanctions`),

    /** Historique complet d'un agent : sanctions, avertissements, récidive. */
    historiqueAgent: (agentId: number) =>
      api<ApiResponse<HistoriqueDisciplinaire>>(`/discipline/agents/${agentId}/historique`),

    getById: (id: number) => api<ApiResponse<Sanction>>(`/discipline/sanctions/${id}`),

    create: (payload: SanctionInput) =>
      api<ApiResponse<Sanction>>("/discipline/sanctions", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<SanctionInput>) =>
      api<ApiResponse<Sanction>>(`/discipline/sanctions/${id}`, { method: "PUT", body: payload }),

    /** Suppression possible **uniquement** tant que le dossier est `en_attente`. */
    remove: (id: number) => api<{ message: string }>(`/discipline/sanctions/${id}`, { method: "DELETE" }),

    // — Circuit ——————————————————————————————————————————————————
    instruire: (id: number, payload: InstructionSanctionInput) =>
      api<ApiResponse<Sanction>>(`/discipline/sanctions/${id}/instruire`, { method: "POST", body: payload }),

    /** Prononcé par le DG (la route s'appelle encore `valider` côté API). */
    prononcer: (id: number, payload: PrononceSanctionInput) =>
      api<ApiResponse<Sanction>>(`/discipline/sanctions/${id}/valider`, { method: "POST", body: payload }),

    /** Classement sans suite par le DG. */
    classer: (id: number, payload: ClassementSanctionInput) =>
      api<ApiResponse<Sanction>>(`/discipline/sanctions/${id}/rejeter`, { method: "POST", body: payload }),

    // — Pièces (art. 91) ——————————————————————————————————————————
    pieces: (id: number) => api<ApiCollection<SanctionPiece>>(`/discipline/sanctions/${id}/pieces`),

    /** Dépôt multipart (`fichier`) : pdf/jpg/png/doc/docx, 10 Mo max. */
    ajouterPiece: (id: number, fichier: File) => {
      const body = new FormData();
      body.append("fichier", fichier);
      return api<ApiResponse<SanctionPiece>>(`/discipline/sanctions/${id}/pieces`, { method: "POST", body });
    },

    telechargerPiece: (id: number, pieceId: number) =>
      api<Blob>(`/discipline/sanctions/${id}/pieces/${pieceId}`, { responseType: "blob" }),

    supprimerPiece: (id: number, pieceId: number) =>
      api<{ message: string }>(`/discipline/sanctions/${id}/pieces/${pieceId}`, { method: "DELETE" }),

    // — PDF ————————————————————————————————————————————————————————
    rapportPdf: (id: number) =>
      api<Blob>(`/discipline/sanctions/${id}/pdf-rapport`, { responseType: "blob" }),

    /** Disponible après le prononcé. */
    decisionPdf: (id: number) =>
      api<Blob>(`/discipline/sanctions/${id}/pdf-decision`, { responseType: "blob" }),

    // — Espace agent (aucune permission, `agent_id` requis sur le compte) ——
    mesSanctions: () => api<ApiCollection<Sanction>>("/discipline/moi/sanctions"),
    maSanction: (id: number) => api<ApiResponse<Sanction>>(`/discipline/moi/sanctions/${id}`),
    maDecisionPdf: (id: number) =>
      api<Blob>(`/discipline/moi/sanctions/${id}/pdf-decision`, { responseType: "blob" }),
    monHistorique: () => api<ApiResponse<HistoriqueDisciplinaire>>("/discipline/moi/historique"),
    mesAvertissements: () => api<ApiCollection<import("~/schemas/avertissement").Avertissement>>(
      "/discipline/moi/avertissements",
    ),

    /** Détail d'un de mes avertissements. Même garde : seul l'intéressé y accède. */
    monAvertissement: (id: number) =>
      api<ApiResponse<import("~/schemas/avertissement").Avertissement>>(
        `/discipline/moi/avertissements/${id}`,
      ),
  };
}
