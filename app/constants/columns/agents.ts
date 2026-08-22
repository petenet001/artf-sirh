import type { TableColumn } from "@nuxt/ui";
import type { AgentSummary } from "~/schemas/agent-summary";

/**
 * Colonnes de la liste des agents, calées sur la maquette : la personne
 * d'abord (avatar + nom, rendu par `#nom-cell`), puis ses identifiants et son
 * statut (pastille, rendu par `#statut-cell`). Ces deux cellules sont fournies
 * par `AgentsTable`. Définies séparément par population.
 *
 * ⚠️ L'`index` de l'API ne renvoie pas les relations (grade, fonction…) : on ne
 * liste donc que des champs plats.
 */
export const agentColumns: TableColumn<AgentSummary>[] = [
  { accessorKey: "nom", header: sortableHeader("Agent") },
  { accessorKey: "matricule", header: sortableHeader("Matricule") },
  { accessorKey: "telephone", header: "Téléphone" },
  { accessorKey: "genre", header: "Genre" },
  { accessorKey: "statut", header: sortableHeader("Statut") },
];
