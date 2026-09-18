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
 *
 * ## Deux listes, et le choix n'est pas cosmétique
 *
 * L'API expose **deux** listes d'agents, et les confondre expose des données :
 *
 * | Route | Filtrée par structure ? | Permission |
 * |---|---|---|
 * | `GET /personnel/agents` | **oui** — vague F | `consulter-agents` |
 * | `GET /integration/agents` | **non** — tous les dossiers | `consulter-recrutement` |
 *
 * `list()` pointe donc sur la liste **filtrée** : c'est la bonne réponse
 * partout, sauf dans le module Intégration. Un chef de service doit voir les
 * quatre agents de son service, pas les soixante et un de l'ARTF — et il n'a
 * de toute façon pas `consulter-recrutement`, si bien que l'autre route lui
 * répondrait 403.
 *
 * `listeDossiers()` garde la liste non filtrée, réservée au wizard de
 * recrutement, qui travaille par définition sur des dossiers pas encore
 * rattachés à une structure.
 */
export function useAgentsApi() {
  const api = useApiClient();

  return {
    /** Liste **filtrée** par la structure de l'utilisateur (vague F). */
    list: (params?: ListParams) =>
      api<ApiCollection<Agent>>("/personnel/agents", { query: params }),

    /** Stagiaires, filtrés eux aussi. */
    stagiaires: (params?: ListParams) =>
      api<ApiCollection<Agent>>("/personnel/stagiaires", { query: params }),

    /**
     * Tous les dossiers, **sans filtre de structure** — module Intégration
     * uniquement (`consulter-recrutement`). Ne jamais l'utiliser pour une
     * liste ou un sélecteur du quotidien.
     */
    listeDossiers: (params?: ListParams) =>
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
