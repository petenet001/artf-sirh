/**
 * Résout l'id du type d'intégration « Stage professionnel » — clé du distinguo
 * agents / stagiaires (un stagiaire = un agent de ce type). Mutualisé via une
 * clé `useAsyncData` partagée pour éviter les appels redondants.
 */
export function useStageType() {
  const typesApi = useTypesIntegrationsApi();
  const { data } = useAsyncData("types-integrations-ref", () => typesApi.list());

  const stageTypeId = computed(
    () => data.value?.data.find((t) => /stage/i.test(t.nom))?.id ?? null,
  );

  return { stageTypeId };
}
