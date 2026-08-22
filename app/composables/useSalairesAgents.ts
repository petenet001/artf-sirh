import type { ListParams } from "~/types/api";

/**
 * Liste des salaires d'agents (module Rémunération). Collection plate filtrée
 * côté serveur (égalité exacte sur les champs whitelistés).
 */
export function useSalairesAgents(params?: ListParams) {
  const api = useSalairesAgentsApi();

  const { data, pending, error, refresh } = useAsyncData("salaires-agents", () =>
    api.list(params),
  );

  const salaires = computed(() => data.value?.data ?? []);

  return { salaires, pending, error, refresh };
}
