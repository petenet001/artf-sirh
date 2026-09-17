import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { CatalogueFormation, CatalogueFormationInput } from "~/schemas/catalogue-formation";
import type {
  PlanFormation,
  PlanFormationInput,
  PlanFormationLigneInput,
} from "~/schemas/plan-formation";
import type {
  InscriptionFormation,
  InscriptionFormationInput,
  ClotureInscriptionInput,
} from "~/schemas/inscription-formation";
import type {
  CertificationFormation,
  CertificationFormationInput,
} from "~/schemas/certification-formation";

/**
 * Repository Formation (`/api/formations`, CCN art. 92–104). Quatre objets
 * derrière un seul module : catalogue, plan annuel, inscriptions,
 * certifications.
 *
 * Lecture `consulter-formations`, écriture `gerer-formations`.
 *
 * ⚠️ Les stages d'**accueil** restent sous `/integration/stages` : ce n'est pas
 * le même métier (cf. `useStagesApi`).
 */
export function useFormationsApi() {
  const api = useApiClient();

  return {
    // — Catalogue (filtres : titre, modalite, type_action, actif) ————
    catalogue: (params?: ListParams) =>
      api<ApiCollection<CatalogueFormation>>("/formations/catalogue", { query: params }),

    formation: (id: number) => api<ApiResponse<CatalogueFormation>>(`/formations/catalogue/${id}`),

    creerFormation: (payload: CatalogueFormationInput) =>
      api<ApiResponse<CatalogueFormation>>("/formations/catalogue", { method: "POST", body: payload }),

    modifierFormation: (id: number, payload: Partial<CatalogueFormationInput>) =>
      api<ApiResponse<CatalogueFormation>>(`/formations/catalogue/${id}`, { method: "PUT", body: payload }),

    supprimerFormation: (id: number) =>
      api<{ message: string }>(`/formations/catalogue/${id}`, { method: "DELETE" }),

    // — Plan annuel (filtres : annee, statut) ——————————————————————
    plans: (params?: ListParams) =>
      api<ApiCollection<PlanFormation>>("/formations/plans", { query: params }),

    plan: (id: number) => api<ApiResponse<PlanFormation>>(`/formations/plans/${id}`),

    creerPlan: (payload: PlanFormationInput) =>
      api<ApiResponse<PlanFormation>>("/formations/plans", { method: "POST", body: payload }),

    /** Modifiable seulement en `brouillon`. */
    modifierPlan: (id: number, payload: Partial<PlanFormationInput>) =>
      api<ApiResponse<PlanFormation>>(`/formations/plans/${id}`, { method: "PUT", body: payload }),

    supprimerPlan: (id: number) =>
      api<{ message: string }>(`/formations/plans/${id}`, { method: "DELETE" }),

    ajouterLigne: (id: number, payload: PlanFormationLigneInput) =>
      api<ApiResponse<PlanFormation>>(`/formations/plans/${id}/lignes`, { method: "POST", body: payload }),

    retirerLigne: (id: number, ligneId: number) =>
      api<ApiResponse<PlanFormation>>(`/formations/plans/${id}/lignes/${ligneId}`, { method: "DELETE" }),

    /** 422 si le plan n'a aucune ligne. */
    validerPlan: (id: number) =>
      api<ApiResponse<PlanFormation>>(`/formations/plans/${id}/valider`, { method: "POST", body: {} }),

    executerPlan: (id: number) =>
      api<ApiResponse<PlanFormation>>(`/formations/plans/${id}/executer`, { method: "POST", body: {} }),

    cloturerPlan: (id: number) =>
      api<ApiResponse<PlanFormation>>(`/formations/plans/${id}/cloturer`, { method: "POST", body: {} }),

    // — Inscriptions (filtres : agent_id, formation_id, plan_id, statut) ——
    inscriptions: (params?: ListParams) =>
      api<ApiCollection<InscriptionFormation>>("/formations/inscriptions", { query: params }),

    inscriptionsAgent: (agentId: number) =>
      api<ApiCollection<InscriptionFormation>>(`/formations/agents/${agentId}/inscriptions`),

    inscription: (id: number) =>
      api<ApiResponse<InscriptionFormation>>(`/formations/inscriptions/${id}`),

    inscrire: (payload: InscriptionFormationInput) =>
      api<ApiResponse<InscriptionFormation>>("/formations/inscriptions", { method: "POST", body: payload }),

    confirmerPresence: (id: number) =>
      api<ApiResponse<InscriptionFormation>>(`/formations/inscriptions/${id}/confirmer-presence`, {
        method: "POST",
        body: {},
      }),

    /** Perfectionnement / qualification : `rapport_remis` exigé (art. 100). */
    cloturerInscription: (id: number, payload?: ClotureInscriptionInput) =>
      api<ApiResponse<InscriptionFormation>>(`/formations/inscriptions/${id}/cloturer`, {
        method: "POST",
        body: payload ?? {},
      }),

    annulerInscription: (id: number) =>
      api<ApiResponse<InscriptionFormation>>(`/formations/inscriptions/${id}/annuler`, {
        method: "POST",
        body: {},
      }),

    supprimerInscription: (id: number) =>
      api<{ message: string }>(`/formations/inscriptions/${id}`, { method: "DELETE" }),

    // — Certifications ——————————————————————————————————————————————
    certifications: (params?: ListParams) =>
      api<ApiCollection<CertificationFormation>>("/formations/certifications", { query: params }),

    certificationsAgent: (agentId: number) =>
      api<ApiCollection<CertificationFormation>>(`/formations/agents/${agentId}/certifications`),

    certification: (id: number) =>
      api<ApiResponse<CertificationFormation>>(`/formations/certifications/${id}`),

    /** Multipart quand un justificatif est joint (pdf/jpg/png, 10 Mo max). */
    creerCertification: (payload: CertificationFormationInput, fichier?: File | null) => {
      if (!fichier) {
        return api<ApiResponse<CertificationFormation>>("/formations/certifications", {
          method: "POST",
          body: payload,
        });
      }
      const body = new FormData();
      for (const [cle, valeur] of Object.entries(payload)) {
        if (valeur != null) body.append(cle, String(valeur));
      }
      body.append("fichier", fichier);
      return api<ApiResponse<CertificationFormation>>("/formations/certifications", {
        method: "POST",
        body,
      });
    },

    fichierCertification: (id: number) =>
      api<Blob>(`/formations/certifications/${id}/fichier`, { responseType: "blob" }),

    supprimerCertification: (id: number) =>
      api<{ message: string }>(`/formations/certifications/${id}`, { method: "DELETE" }),
  };
}
