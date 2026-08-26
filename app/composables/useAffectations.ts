import type { ListParams } from "~/types/api";

/**
 * Liste des affectations (module Carrière). Collection plate filtrée côté
 * serveur (égalité exacte). La recherche/pagination fine reste cliente.
 */
export function useAffectations(params?: ListParams) {
  const api = useAffectationsApi();

  const { data, pending, error, refresh } = useAsyncData("carriere-affectations", () =>
    api.list(params),
  );

  const affectations = computed(() => data.value?.data ?? []);

  return { affectations, pending, error, refresh };
}
