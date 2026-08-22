import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type {
  DossierIntegration,
  DossierIntegrationInput,
  DossierTransitionInput,
  AssignerMatriculeInput,
} from "~/schemas/dossier-integration";
import type { HistoriqueIntegration } from "~/schemas/historique-integration";
import type { ValidationWorkflow } from "~/schemas/validation-workflow";
import type { ActeAdministratif } from "~/schemas/acte-administratif";

/** Réponse de génération d'acte : acte + dossier mis à jour + suite du parcours. */
export interface ActeGenerationResult {
  acte: ActeAdministratif;
  dossier: DossierIntegration;
  necessite_contrat: boolean;
  prochaine_etape: string;
}

/** Tâche post-intégration (structure calculée par le service, pas une ressource DB). */
export interface TachePostIntegration {
  etape: number;
  label: string;
  endpoint: string;
  statut: "fait" | "non_fait";
  obligatoire: boolean;
}

/** Réponse de `taches-post-integration` : liste + rappel synthétique (`rappel`, pas `message`). */
export interface TachesPostIntegrationResult {
  data: TachePostIntegration[];
  rappel: string;
}

/**
 * Repository Dossiers d'intégration. Seul endroit autorisé à connaître les
 * routes des dossiers. Tout vit sous `/integration` et requiert l'auth.
 * Toutes les fonctions throwent en cas d'erreur.
 */
export function useDossiersApi() {
  const api = useApiClient();

  /** POST `/integration/dossiers/{id}/{action}` avec commentaire optionnel. */
  const transition = (id: number, action: string, payload?: DossierTransitionInput) =>
    api<ApiResponse<DossierIntegration>>(`/integration/dossiers/${id}/${action}`, {
      method: "POST",
      body: payload ?? {},
    });

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<DossierIntegration>>("/integration/dossiers", { query: params }),

    getById: (id: number) =>
      api<ApiResponse<DossierIntegration>>(`/integration/dossiers/${id}`),

    create: (payload: DossierIntegrationInput) =>
      api<ApiResponse<DossierIntegration>>("/integration/dossiers", {
        method: "POST",
        body: payload,
      }),

    update: (id: number, payload: Partial<DossierIntegrationInput>) =>
      api<ApiResponse<DossierIntegration>>(`/integration/dossiers/${id}`, {
        method: "PUT",
        body: payload,
      }),

    remove: (id: number) =>
      api<{ message: string }>(`/integration/dossiers/${id}`, { method: "DELETE" }),

    // — Transitions de workflow ————————————————————————————
    soumettre: (id: number, payload?: DossierTransitionInput) =>
      transition(id, "soumettre", payload),

    passerEnEtudeRH: (id: number, payload?: DossierTransitionInput) =>
      transition(id, "passer-en-etude-rh", payload),

    marquerIncomplet: (id: number, payload?: DossierTransitionInput) =>
      transition(id, "marquer-incomplet", payload),

    marquerComplet: (id: number, payload?: DossierTransitionInput) =>
      transition(id, "marquer-complet", payload),

    validerRH: (id: number, payload?: DossierTransitionInput) =>
      transition(id, "valider-rh", payload),

    rejeterRH: (id: number, payload?: DossierTransitionInput) =>
      transition(id, "rejeter-rh", payload),

    validerDG: (id: number, payload?: DossierTransitionInput) =>
      transition(id, "valider-dg", payload),

    genererActe: (id: number) =>
      api<ApiResponse<ActeGenerationResult>>(`/integration/dossiers/${id}/generer-acte`, {
        method: "POST",
      }),

    marquerActeGenere: (id: number, payload?: DossierTransitionInput) =>
      transition(id, "marquer-acte-genere", payload),

    marquerContratSigne: (id: number, payload?: DossierTransitionInput) =>
      transition(id, "marquer-contrat-signe", payload),

    suspendre: (id: number, payload?: DossierTransitionInput) =>
      transition(id, "suspendre", payload),

    annuler: (id: number, payload?: DossierTransitionInput) =>
      transition(id, "annuler", payload),

    assignerMatricule: (id: number, payload: AssignerMatriculeInput) =>
      api<ApiResponse<DossierIntegration>>(`/integration/dossiers/${id}/assigner-matricule`, {
        method: "POST",
        body: payload,
      }),

    integrer: (id: number) =>
      api<ApiResponse<DossierIntegration>>(`/integration/dossiers/${id}/integrer`, {
        method: "POST",
      }),

    // — Lecture liée ————————————————————————————————————————
    historique: (id: number) =>
      api<ApiCollection<HistoriqueIntegration>>(`/integration/dossiers/${id}/historique`),

    circuit: (id: number) =>
      api<ApiCollection<ValidationWorkflow>>(`/integration/dossiers/${id}/circuit`),

    /** Checklist des tâches post-intégration (générer acte, contrat signé, etc.). */
    tachesPostIntegration: (id: number) =>
      api<TachesPostIntegrationResult>(`/integration/dossiers/${id}/taches-post-integration`),
  };
}
