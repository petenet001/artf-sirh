import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type {
  DemandeConge,
  DemandeCongeInput,
  DecisionCongeInput,
  RejetCongeInput,
} from "~/schemas/demande-conge";

/** Statistiques congés (`GET /conges/statistiques`). */
export interface CongeStatistiques {
  total: number;
  par_statut: Record<string, number>;
  jours_accordes: number;
}

/**
 * Construit le corps d'une demande : `FormData` (multipart) si un justificatif
 * est fourni — obligatoire quand le type l'exige — sinon un simple objet JSON.
 * Ne jamais forcer `Content-Type` : `$fetch` le pose seul (boundary multipart).
 */
function buildBody(payload: DemandeCongeInput, justificatif?: File | null): FormData | DemandeCongeInput {
  if (!justificatif) return payload;
  const fd = new FormData();
  fd.append("agent_id", String(payload.agent_id));
  fd.append("type_conge_id", String(payload.type_conge_id));
  fd.append("date_debut", payload.date_debut);
  fd.append("date_fin", payload.date_fin);
  if (payload.motif) fd.append("motif", payload.motif);
  fd.append("justificatif", justificatif);
  return fd;
}

/**
 * Repository Demandes de congé (workflow N+1 → RH → DG). Seul endroit autorisé à
 * connaître les routes `/conges/demandes`. Auth Bearer + permissions
 * (`consulter-conges`, `creer-conges`, `valider-conges`). Toutes throwent.
 *
 * ⚠️ Les boutons de validation dépendent de `prochaine_etape` (source serveur) et
 * du signataire réel (N+1 / rôle RH / rôle DG) — l'API renvoie 403 sinon. La
 * file `aValider()` applique exactement cette règle : c'est elle qui dit si
 * l'utilisateur peut signer une demande.
 */
export function useDemandesCongeApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<DemandeConge>>("/conges/demandes", { query: params }),

    byAgent: (agentId: number, params?: ListParams) =>
      api<ApiCollection<DemandeConge>>(`/conges/agents/${agentId}/demandes`, { query: params }),

    /**
     * File du signataire connecté : demandes dont l'étape courante lui revient
     * (N+1 réel, rôle `rh`, rôle `directeur-general` ; `admin` voit tout).
     */
    aValider: () => api<ApiCollection<DemandeConge>>("/conges/demandes/a-valider"),

    getById: (id: number) => api<ApiResponse<DemandeConge>>(`/conges/demandes/${id}`),

    create: (payload: DemandeCongeInput, justificatif?: File | null) =>
      api<ApiResponse<DemandeConge>>("/conges/demandes", {
        method: "POST",
        body: buildBody(payload, justificatif),
      }),

    validerN1: (id: number, payload?: DecisionCongeInput) =>
      api<ApiResponse<DemandeConge>>(`/conges/demandes/${id}/valider-n1`, { method: "POST", body: payload ?? {} }),
    validerRH: (id: number, payload?: DecisionCongeInput) =>
      api<ApiResponse<DemandeConge>>(`/conges/demandes/${id}/valider-rh`, { method: "POST", body: payload ?? {} }),
    validerDG: (id: number, payload?: DecisionCongeInput) =>
      api<ApiResponse<DemandeConge>>(`/conges/demandes/${id}/valider-dg`, { method: "POST", body: payload ?? {} }),

    rejeterN1: (id: number, payload: RejetCongeInput) =>
      api<ApiResponse<DemandeConge>>(`/conges/demandes/${id}/rejeter-n1`, { method: "POST", body: payload }),
    rejeterRH: (id: number, payload: RejetCongeInput) =>
      api<ApiResponse<DemandeConge>>(`/conges/demandes/${id}/rejeter-rh`, { method: "POST", body: payload }),
    rejeterDG: (id: number, payload: RejetCongeInput) =>
      api<ApiResponse<DemandeConge>>(`/conges/demandes/${id}/rejeter-dg`, { method: "POST", body: payload }),

    /** Retrait par le demandeur (ou `created_by` / admin), tant que `soumise` — sinon 422. */
    annuler: (id: number) =>
      api<ApiResponse<DemandeConge>>(`/conges/demandes/${id}/annuler`, { method: "POST", body: {} }),

    /** Justificatif déposé à la soumission. Blob (404 si aucun fichier). */
    justificatif: (id: number) =>
      api<Blob>(`/conges/demandes/${id}/justificatif`, { responseType: "blob" }),

    statistiques: () => api<ApiResponse<CongeStatistiques>>("/conges/statistiques"),

    /** Fiche PDF (dès la soumission). Réponse binaire — traiter en blob. */
    fichePdf: (id: number) =>
      api<Blob>(`/conges/demandes/${id}/fiche-pdf`, { responseType: "blob" }),

    /** Attestation PDF (seulement si circuit terminé validé, sinon 422). Blob. */
    attestation: (id: number) =>
      api<Blob>(`/conges/demandes/${id}/attestation`, { responseType: "blob" }),
  };
}
