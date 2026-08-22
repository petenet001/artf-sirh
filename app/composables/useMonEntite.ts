import { ENTITE_LABEL, estPosteResponsable, estStructurable, type StructurableType } from "~/constants/entite";

/**
 * Qui suis-je dans l'organisation ? Résout, pour l'utilisateur connecté :
 * - sa **fiche agent** (`user.agent_id`) ;
 * - son **poste** (`nomination_active.poste`) — c'est lui qui dit si l'on
 *   dirige une structure (cf. `constants/entite.ts`) ;
 * - son **entité** (`affectation_active.structurable_type` + `_id`).
 *
 * Sert de source à la portée `"entite"` des sous-onglets (`useModules`) et à
 * l'aperçu `useEntiteApercu`. Un utilisateur sans fiche agent (compte purement
 * applicatif) n'a simplement pas d'entité.
 */
export function useMonEntite() {
  const auth = useAuthStore();
  const agentsApi = useAgentsApi();

  const agentId = computed(() => auth.user?.agent_id ?? null);

  const { data, pending, error } = useAsyncData(
    "mon-agent",
    async () => (agentId.value ? (await agentsApi.getById(agentId.value)).data : null),
    { watch: [agentId] },
  );

  const agent = computed(() => data.value ?? null);
  const poste = computed(() => agent.value?.nomination_active?.poste ?? null);

  const affectation = computed(() => agent.value?.affectation_active ?? null);
  const type = computed<StructurableType | null>(() =>
    estStructurable(affectation.value?.structurable_type) ? affectation.value!.structurable_type as StructurableType : null,
  );
  const structureId = computed(() => affectation.value?.structurable_id ?? null);
  const typeLabel = computed(() => (type.value ? ENTITE_LABEL[type.value] : null));

  /** On ne propose la vue d'entité qu'à qui la dirige ET a une entité résolue. */
  const estResponsable = computed(
    () => estPosteResponsable(poste.value) && !!type.value && !!structureId.value,
  );

  return { agent, poste, type, typeLabel, structureId, estResponsable, pending, error };
}
