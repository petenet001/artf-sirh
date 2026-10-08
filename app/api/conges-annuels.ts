import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { AgentSummary } from "~/schemas/agent-summary";
import type { CongeSolde } from "~/schemas/conge-solde";
import type { DecisionCongeInput, DemandeConge, RejetCongeInput } from "~/schemas/demande-conge";
import type {
  CampagneCongeAnnuel,
  CampagneCongeAnnuelInput,
  CongeAnnuelInput,
  RefusReportInput,
  ReportCongeAnnuel,
  ReportCongeAnnuelInput,
} from "~/schemas/conge-annuel";
import type { CongeStatistiques } from "~/api/demandes-conge";

/**
 * Repository Congé annuel — seul endroit autorisé à connaître `/conges-annuels`
 * (note FE §2c). Trois sous-ressources :
 *
 * - **campagnes** : gérées par le rôle `rh` ou `admin` **seulement** (un chef
 *   avec `valider-conges` reçoit 403) ;
 * - **demandes** : même forme et mêmes verbes que `/conges/demandes`, sans
 *   visa DG. Les propositions `origine=campagne` ne se traitent qu'après la
 *   clôture (422 avant) ;
 * - **reports** : proposés par le N+1, décidés par la RH.
 *
 * Toutes throwent. Les PDF sont des blobs.
 */
export function useCongesAnnuelsApi() {
  const api = useApiClient();
  const base = "/conges-annuels";

  return {
    campagnes: {
      list: (params?: ListParams) =>
        api<ApiCollection<CampagneCongeAnnuel>>(`${base}/campagnes`, { query: params }),
      getById: (id: number) => api<ApiResponse<CampagneCongeAnnuel>>(`${base}/campagnes/${id}`),
      create: (payload: CampagneCongeAnnuelInput) =>
        api<ApiResponse<CampagneCongeAnnuel>>(`${base}/campagnes`, { method: "POST", body: payload }),
      ouvrir: (id: number) =>
        api<ApiResponse<CampagneCongeAnnuel>>(`${base}/campagnes/${id}/ouvrir`, { method: "POST", body: {} }),
      cloturer: (id: number) =>
        api<ApiResponse<CampagneCongeAnnuel>>(`${base}/campagnes/${id}/cloturer`, { method: "POST", body: {} }),
      /** Agents actifs sans proposition non annulée (RH). */
      sansProposition: (id: number) =>
        api<ApiCollection<AgentSummary>>(`${base}/campagnes/${id}/sans-proposition`),
    },

    demandes: {
      /** Filtres : `agent_id`, `statut`, `origine`, `campagne_conge_annuel_id`. */
      list: (params?: ListParams) => api<ApiCollection<DemandeConge>>(`${base}/demandes`, { query: params }),
      /** File du signataire. Les propositions de campagne n'y entrent qu'à la clôture. */
      aValider: () => api<ApiCollection<DemandeConge>>(`${base}/demandes/a-valider`),
      /** 422 si la demande n'est pas un congé annuel de ce circuit. */
      getById: (id: number) => api<ApiResponse<DemandeConge>>(`${base}/demandes/${id}`),
      create: (payload: CongeAnnuelInput) =>
        api<ApiResponse<DemandeConge>>(`${base}/demandes`, { method: "POST", body: payload }),

      validerN1: (id: number, payload?: DecisionCongeInput) =>
        api<ApiResponse<DemandeConge>>(`${base}/demandes/${id}/valider-n1`, { method: "POST", body: payload ?? {} }),
      rejeterN1: (id: number, payload: RejetCongeInput) =>
        api<ApiResponse<DemandeConge>>(`${base}/demandes/${id}/rejeter-n1`, { method: "POST", body: payload }),
      validerRH: (id: number, payload?: DecisionCongeInput) =>
        api<ApiResponse<DemandeConge>>(`${base}/demandes/${id}/valider-rh`, { method: "POST", body: payload ?? {} }),
      rejeterRH: (id: number, payload: RejetCongeInput) =>
        api<ApiResponse<DemandeConge>>(`${base}/demandes/${id}/rejeter-rh`, { method: "POST", body: payload }),
      /** Tant que `soumise` et, pour une proposition de campagne, campagne `ouverte`. */
      annuler: (id: number) =>
        api<ApiResponse<DemandeConge>>(`${base}/demandes/${id}/annuler`, { method: "POST", body: {} }),

      fichePdf: (id: number) => api<Blob>(`${base}/demandes/${id}/fiche-pdf`, { responseType: "blob" }),
      /** Seulement si `validee_rh`, sinon 422. */
      attestation: (id: number) => api<Blob>(`${base}/demandes/${id}/attestation`, { responseType: "blob" }),
    },

    reports: {
      /** Filtres : `agent_id`, `statut`, `annee_source`. */
      list: (params?: ListParams) => api<ApiCollection<ReportCongeAnnuel>>(`${base}/reports`, { query: params }),
      /** N+1 de l'agent uniquement (403 sinon). Plafond 60 j → 422. */
      proposer: (payload: ReportCongeAnnuelInput) =>
        api<ApiResponse<ReportCongeAnnuel>>(`${base}/reports`, { method: "POST", body: payload }),
      /** RH (`rh` / `admin`) seulement. */
      accorder: (id: number) =>
        api<ApiResponse<ReportCongeAnnuel>>(`${base}/reports/${id}/accorder`, { method: "POST", body: {} }),
      refuser: (id: number, payload: RefusReportInput) =>
        api<ApiResponse<ReportCongeAnnuel>>(`${base}/reports/${id}/refuser`, { method: "POST", body: payload }),
    },

    /** Solde de congé annuel de l'année (créé à la lecture) : la durée qui sera posée. */
    solde: (agentId: number, annee?: number) =>
      api<ApiResponse<CongeSolde>>(`${base}/agents/${agentId}/solde`, {
        query: annee ? { annee } : undefined,
      }),

    statistiques: (params?: ListParams) =>
      api<ApiResponse<CongeStatistiques>>(`${base}/statistiques`, { query: params }),
  };
}
