import { ENTITE_LABEL, niveauEntite, resoudreEntite, type ResolutionEntite } from "~/constants/entite";
import { nomsRoles } from "~/constants/utilisateurs";

/**
 * Qui suis-je dans l'organisation ? Résout, pour l'utilisateur connecté :
 * - son **niveau** de responsable, d'après ses rôles (cf. `constants/entite.ts`) ;
 * - sa **fiche agent** (`user.agent_id`), pour l'affectation et le poste ;
 * - son **entité** : l'ARTF pour le DG, sinon la structure de son affectation
 *   active, à condition qu'elle soit au niveau de son rôle.
 *
 * La fiche n'est chargée que pour un responsable : les autres comptes n'ont
 * rien à en tirer ici.
 */
export function useMonEntite() {
  const auth = useAuthStore();
  const agentsApi = useAgentsApi();

  const roles = computed(() => (auth.user ? nomsRoles(auth.user) : []));
  const niveau = computed(() => niveauEntite(roles.value));
  const agentId = computed(() => (niveau.value ? (auth.user?.agent_id ?? null) : null));

  const { data, pending, error } = useAsyncData(
    "mon-agent",
    async () => (agentId.value ? (await agentsApi.getById(agentId.value)).data : null),
    { watch: [agentId] },
  );

  const agent = computed(() => data.value ?? null);

  /** Intitulé affiché : le poste de la nomination, sinon la fonction de l'agent. */
  const poste = computed(
    () => agent.value?.nomination_active?.poste ?? agent.value?.fonction?.nom ?? null,
  );

  const resolution = computed<ResolutionEntite>(() =>
    resoudreEntite(roles.value, agent.value?.affectation_active),
  );

  const typeLabel = computed(() => {
    const r = resolution.value;
    if (r.etat === "artf") return "ARTF";
    return r.etat === "structure" ? ENTITE_LABEL[r.type] : null;
  });

  /** Entité ouverte : DG, ou responsable dont l'affectation est cohérente. */
  const estResponsable = computed(
    () => resolution.value.etat === "artf" || resolution.value.etat === "structure",
  );

  return { agent, poste, niveau, resolution, typeLabel, estResponsable, pending, error };
}
