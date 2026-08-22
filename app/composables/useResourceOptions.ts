import type { ApiCollection } from "~/types/api";

/**
 * Charge une ressource « parente » (référentiel, structure, agents…) pour
 * alimenter un `select` de clé étrangère et résoudre l'affichage id → libellé.
 * `getLabel` permet de personnaliser le libellé (par défaut `nom`).
 */
export function useResourceOptions<T extends { id: number; nom?: string }>(
  key: string,
  list: () => Promise<ApiCollection<T>>,
  getLabel?: (item: T) => string,
) {
  const { data, pending, error } = useAsyncData(key, () => list());
  const items = computed(() => data.value?.data ?? []);

  const label = (it: T) => getLabel?.(it) ?? it.nom ?? `#${it.id}`;

  const options = computed(() => items.value.map((it) => ({ label: label(it), value: it.id })));

  const labelById = computed<Record<number, string>>(() =>
    Object.fromEntries(items.value.map((it) => [it.id, label(it)])),
  );

  return { options, labelById, pending, error };
}
