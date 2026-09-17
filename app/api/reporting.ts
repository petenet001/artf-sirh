import type { ApiResponse, ApiCollection, ListParams, Paginated } from "~/types/api";
import type {
  DashboardReporting,
  Repartition,
  StatsConges,
  StatsEvaluations,
  AlerteReporting,
  LigneEffectif,
} from "~/schemas/reporting";

/** Axes de répartition acceptés par `/reporting/repartitions`. */
export type AxeRepartition =
  | "direction"
  | "grade"
  | "genre"
  | "age"
  | "statut"
  | "type_integration"
  | "fonction";

/** Filtres communs à tout le module (query). */
export interface FiltresReporting extends ListParams {
  direction_id?: number;
  service_id?: number;
  bureau_id?: number;
  annee?: number;
}

/**
 * Repository Reporting (`/api/reporting`, module D.6). Lecture seule, permission
 * `consulter-reporting` — RH, admin et **DG**.
 *
 * Ce module agrège côté serveur ce que le front comptait jusqu'ici dans le
 * navigateur. Il ne remplace pas les statistiques de session
 * (`/avancements/sessions/{id}/stats`), qui restent la source de l'écran
 * d'évaluation.
 *
 * ⚠️ Aucune série temporelle : le plan backend a écarté l'historisation
 * mensuelle du périmètre V1. Pas de courbes tant que ça n'arrive pas.
 */
export function useReportingApi() {
  const api = useApiClient();

  return {
    /** Cartes d'accueil : effectif, statuts, mouvements, masse salariale, répartitions. */
    dashboard: (params?: FiltresReporting) =>
      api<ApiResponse<DashboardReporting>>("/reporting/dashboard", { query: params }),

    /** Un axe de répartition à la fois. 422 si l'axe est absent ou inconnu. */
    repartition: (axe: AxeRepartition, params?: FiltresReporting) =>
      api<ApiResponse<Repartition>>("/reporting/repartitions", { query: { ...params, axe } }),

    statsConges: (params?: FiltresReporting) =>
      api<ApiResponse<StatsConges>>("/reporting/stats/conges", { query: params }),

    statsEvaluations: (params?: FiltresReporting) =>
      api<ApiResponse<StatsEvaluations>>("/reporting/stats/evaluations", { query: params }),

    /** Six contrôles de conformité : compteur + 50 premières lignes. */
    alertes: () => api<ApiCollection<AlerteReporting>>("/reporting/alertes"),

    /** Liste paginée derrière les cartes (`meta` : page, total…). */
    effectifs: (params?: FiltresReporting & { statut?: string; per_page?: number; page?: number }) =>
      api<Paginated<LigneEffectif>>("/reporting/effectifs", { query: params }),

    /** Export CSV ou PDF. `format` est obligatoire (422 sinon). */
    export: (type: "effectifs" | "conges" | "evaluations", format: "csv" | "pdf", params?: FiltresReporting) =>
      api<Blob>(`/reporting/exports/${type}`, { query: { ...params, format }, responseType: "blob" }),
  };
}
