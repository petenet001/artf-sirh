import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Agent, AgentInput } from "~/schemas/agent";
import type { DossierIntegration } from "~/schemas/dossier-integration";
import type { Contrat } from "~/schemas/contrat";
import type { Affectation } from "~/schemas/affectation";
import type { Nomination } from "~/schemas/nomination";
import type { RemiseMateriel } from "~/schemas/remise-materiel";
import type { CompteIntegration } from "~/schemas/compte-integration";

/** Création d'un agent : l'API initialise aussi son dossier d'intégration. */
export interface AgentCreated {
  agent: Agent;
  dossier: DossierIntegration;
}

/**
 * Repository Agents. Seul endroit autorisé à connaître les routes agents.
 * Les agents vivent sous le préfixe `/integration` (module 2) et requièrent
 * une authentification. Toutes les fonctions throwent en cas d'erreur.
 */
export function useAgentsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Agent>>("/integration/agents", { query: params }),

    getById: (id: number) =>
      api<ApiResponse<Agent>>(`/integration/agents/${id}`),

    create: (payload: AgentInput) =>
      api<ApiResponse<AgentCreated>>("/integration/agents", {
        method: "POST",
        body: payload,
      }),

    update: (id: number, payload: Partial<AgentInput> & { statut?: Agent["statut"] }) =>
      api<ApiResponse<Agent>>(`/integration/agents/${id}`, {
        method: "PUT",
        body: payload,
      }),

    remove: (id: number) =>
      api<{ message: string }>(`/integration/agents/${id}`, { method: "DELETE" }),

    /** Modifie uniquement le matricule (PATCH ; Agent/ModifierMatriculeRequest). */
    modifierMatricule: (id: number, payload: { matricule: string }) =>
      api<ApiResponse<Agent>>(`/integration/agents/${id}/matricule`, {
        method: "PATCH",
        body: payload,
      }),

    // — Sous-ressources d'un agent ————————————————————————————
    contrats: (id: number) =>
      api<ApiCollection<Contrat>>(`/integration/agents/${id}/contrats`),

    affectations: (id: number) =>
      api<ApiCollection<Affectation>>(`/integration/agents/${id}/affectations`),

    nominations: (id: number) =>
      api<ApiCollection<Nomination>>(`/integration/agents/${id}/nominations`),

    remisesMateriel: (id: number) =>
      api<ApiCollection<RemiseMateriel>>(`/integration/agents/${id}/remises-materiel`),

    compte: (id: number) =>
      api<ApiResponse<CompteIntegration>>(`/integration/agents/${id}/compte`),
  };
}
