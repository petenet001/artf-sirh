import type { Agent } from "~/schemas/agent";
import { STATUTS_AGENT } from "~/constants/enums";

/**
 * Agrège les chiffres clés du SIRH pour le tableau de bord.
 * Pas d'endpoint de comptage côté API : on récupère les collections (plates)
 * et on compte côté client. `allSettled` garde le tableau de bord robuste si
 * une ressource échoue (ex. droits insuffisants sur une seule d'entre elles).
 */
export function useDashboardStats() {
  const agentsApi = useAgentsApi();
  const typesApi = useTypesIntegrationsApi();
  const directionsApi = useDirectionsApi();
  const servicesApi = useServicesApi();
  const bureauxApi = useBureauxApi();

  const { data, pending, error, refresh } = useAsyncData("dashboard-stats", async () => {
    const [agents, types, directions, services, bureaux] = await Promise.allSettled([
      agentsApi.list(),
      typesApi.list(),
      directionsApi.list(),
      servicesApi.list(),
      bureauxApi.list(),
    ]);

    const rows = (r: PromiseSettledResult<{ data: unknown[] }>): unknown[] =>
      r.status === "fulfilled" ? r.value.data : [];

    const agentList = rows(agents) as Agent[];

    // « Stagiaires » = agents dont le type d'intégration est « Stage professionnel ».
    const typeList = rows(types) as { id: number; nom: string }[];
    const stageTypeId = typeList.find((t) => /stage/i.test(t.nom))?.id ?? null;
    const stagiairesCount = stageTypeId
      ? agentList.filter((a) => a.type_integration_id === stageTypeId).length
      : 0;
    const agentsCount = stageTypeId
      ? agentList.filter((a) => a.type_integration_id !== stageTypeId).length
      : agentList.length;

    // Ordre de l'enum, statuts absents de l'effectif masqués (10 positions CCN).
    const parStatut = STATUTS_AGENT.map((statut) => ({
      statut,
      count: agentList.filter((a) => a.statut === statut).length,
    })).filter((row) => row.count > 0);

    return {
      counts: {
        agents: agentsCount,
        stagiaires: stagiairesCount,
        directions: rows(directions).length,
        services: rows(services).length,
        bureaux: rows(bureaux).length,
      },
      parStatut,
      recents: [...agentList].sort((a, b) => b.id - a.id).slice(0, 5),
    };
  });

  return { stats: data, pending, error, refresh };
}
