import type { TableColumn } from "@nuxt/ui";
import type { AgentSummary } from "~/schemas/agent-summary";

/**
 * Colonnes de la liste des agents, calées sur la maquette : la personne
 * d'abord (avatar + nom, rendu par `#nom-cell`), puis ses identifiants et son
 * statut (pastille, rendu par `#statut-cell`). Ces deux cellules sont fournies
 * par `AgentsTable`. Définies séparément par population.
 *
 * ⚠️ On ne liste que des champs **plats**. `GET /personnel/agents` charge bien
 * quelques relations (`affectation_active`, `grade`…), mais les afficher
 * demande de résoudre l'organigramme : c'est le rôle de la colonne optionnelle
 * « Structure », que `AgentsTable` ajoute quand l'appelant la fournit.
 *
 * Fabrique générique plutôt que constante : la table est générique sur
 * `T extends AgentSummary`, et `TableColumn<AgentSummary>` ne s'assigne pas à
 * `TableColumn<T>` (les accesseurs sont contravariants).
 */
export function agentColumns<T extends AgentSummary>(): TableColumn<T>[] {
  return [
    { accessorKey: "nom", header: sortableHeader("Agent") },
    // Pas de colonne « Matricule » : `BasePersonCell` l'écrit déjà sous le nom.
    // La répéter volait une colonne pour redire la même chose — la recherche
    // continue de porter dessus, et le tri par nom suffit à s'y retrouver.
    { accessorKey: "telephone", header: "Téléphone" },
    { accessorKey: "genre", header: "Genre" },
    { accessorKey: "statut", header: sortableHeader("Statut") },
  ];
}
