import type { ListParams } from "~/types/api";

/**
 * Liste des nominations (module Carrière). Collection plate filtrée côté
 * serveur (égalité exacte). La recherche/pagination fine reste cliente.
 */
export function useNominations(params?: ListParams) {
  const api = useNominationsApi();

  const { data, pending, error, refresh } = useAsyncData("carriere-nominations", () =>
    api.list(params),
  );

  const nominations = computed(() => data.value?.data ?? []);

  return { nominations, pending, error, refresh };
}

/**
 * Structures (Direction / Service / Bureau) sans nomination active, avec les
 * postes possibles à pourvoir. Alimente l'écran « postes vacants ».
 */
export function usePostesVacants() {
  const api = useNominationsApi();

  const { data, pending, error, refresh } = useAsyncData("carriere-postes-vacants", () =>
    api.postesVacants(),
  );

  const postes = computed(() => data.value?.data ?? []);

  return { postes, pending, error, refresh };
}
