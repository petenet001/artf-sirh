import {
  dansPerimetre,
  libellePerimetre,
  libelleStructure,
  optionsStructure,
  perimetreDepuisBureau,
  perimetreSelectionne,
  type Rattachement,
  type ReferentielsStructure,
} from "~/utils/structures";
import { niveauCloisonnement, nomsRoles, vueEffective } from "~/constants/utilisateurs";

/**
 * Parcourir l'effectif **dans son propre périmètre**.
 *
 * ## Ce que la hiérarchie demande vraiment
 *
 * Le besoin n'est pas binaire (« mon équipe » / « tout »), il est *pyramidal* :
 *
 * | Qui | Voit | Peut affiner par |
 * |---|---|---|
 * | chef de bureau | son bureau | rien — il est au bout |
 * | chef de service | son service, **tous bureaux confondus** | bureau |
 * | directeur | sa direction entière | service, puis bureau |
 * | métier RH, DG | tout l'ARTF (`consulter-agents-global`) | direction, service, bureau |
 *
 * On expose donc une **racine** — le périmètre de la personne, `null` en vue
 * globale — et les niveaux strictement en dessous. Un chef de bureau n'ayant
 * rien en dessous, aucun contrôle ne s'affiche chez lui : le cas se règle tout
 * seul, sans condition écrite pour lui.
 *
 * ## Le serveur a déjà filtré
 *
 * `GET /personnel/agents` applique le cloisonnement (vague F) mais n'accepte
 * aucun filtre de structure. Ce composable **affine** ce que le serveur a
 * envoyé ; il n'élargit jamais rien, et ne protège rien non plus. D'où le
 * libellé « Affichage » et non « Accès » à l'écran.
 *
 * Le jour où l'API acceptera `direction_id` / `service_id` / `bureau_id` — comme
 * `/reporting/effectifs` le fait déjà — seul le contenu de `filtrer()` descendra
 * côté serveur : la sélection et l'interface ne bougeront pas.
 */
export function usePerimetrePersonnel() {
  const auth = useAuthStore();
  const directionsApi = useDirectionsApi();
  const servicesApi = useServicesApi();
  const bureauxApi = useBureauxApi();

  /**
   * L'organigramme ne sert qu'à nommer et à ranger : s'il manque, la colonne
   * affiche « … » et les filtres disparaissent — jamais d'erreur à l'écran
   * pour un référentiel d'agrément.
   */
  const { data, pending } = useAsyncData(
    "organigramme-structures",
    async (): Promise<ReferentielsStructure> => {
      const [directions, services, bureaux] = await Promise.allSettled([
        directionsApi.list(),
        servicesApi.list(),
        bureauxApi.list(),
      ]);
      return {
        directions: directions.status === "fulfilled" ? directions.value.data : [],
        services: services.status === "fulfilled" ? services.value.data : [],
        bureaux: bureaux.status === "fulfilled" ? bureaux.value.data : [],
      };
    },
    { default: (): ReferentielsStructure => ({ directions: [], services: [], bureaux: [] }) },
  );

  const referentiels = computed<ReferentielsStructure>(
    () => data.value ?? { directions: [], services: [], bureaux: [] },
  );

  /**
   * Racine du parcours : `null` pour qui voit tout (le métier RH, le DG —
   * l'exception assumée), sinon le périmètre déduit de sa fonction.
   */
  const racine = computed(() => {
    const user = auth.user;
    if (!user) return null;
    if (vueEffective(user) === "globale") return null;
    return perimetreDepuisBureau(
      user.bureau_id,
      niveauCloisonnement(nomsRoles(user)),
      referentiels.value,
    );
  });

  // Sélection courante, du plus large au plus fin.
  const directionId = ref<number | undefined>(undefined);
  const serviceId = ref<number | undefined>(undefined);
  const bureauId = ref<number | undefined>(undefined);

  const selection = computed(() => ({
    directionId: directionId.value ?? null,
    serviceId: serviceId.value ?? null,
    bureauId: bureauId.value ?? null,
  }));

  const options = computed(() => optionsStructure(racine.value, selection.value, referentiels.value));

  /** Périmètre réellement appliqué : le niveau le plus fin choisi, sinon la racine. */
  const perimetreActif = computed(() => perimetreSelectionne(racine.value, selection.value));

  // Changer de direction ou de service invalide les niveaux en dessous :
  // garder « B.P » après être passé sur une autre direction donnerait une
  // liste vide que personne ne saurait expliquer.
  watch(directionId, () => {
    serviceId.value = undefined;
    bureauId.value = undefined;
  });
  watch(serviceId, () => {
    bureauId.value = undefined;
  });

  /** Y a-t-il quelque chose à parcourir sous soi ? Sinon, pas de contrôle. */
  const parcourable = computed(
    () => options.value.directions.length > 0
      || options.value.services.length > 0
      || options.value.bureaux.length > 0,
  );

  /** Un filtre est-il actif ? Pilote la mention « n agents masqués ». */
  const affine = computed(() => !!(directionId.value || serviceId.value || bureauId.value));

  function reinitialiser() {
    directionId.value = undefined;
    serviceId.value = undefined;
    bureauId.value = undefined;
  }

  /** Filtre une liste d'agents selon la sélection courante. */
  function filtrer<T extends { affectation_active?: Rattachement | null }>(agents: T[]): T[] {
    const p = perimetreActif.value;
    if (!p) return agents;
    return agents.filter((a) => dansPerimetre(a.affectation_active, p, referentiels.value));
  }

  /** Libellé d'affectation d'un agent, pour la colonne « Structure ». */
  function structureDe(rattachement?: Rattachement | null): string {
    return libelleStructure(rattachement, referentiels.value);
  }

  /** Nom du périmètre affiché, pour la mention sous la table. */
  const nomPerimetreActif = computed(() =>
    libellePerimetre(perimetreActif.value, referentiels.value),
  );

  return {
    referentiels,
    racine,
    options,
    directionId,
    serviceId,
    bureauId,
    perimetreActif,
    nomPerimetreActif,
    parcourable,
    affine,
    reinitialiser,
    filtrer,
    structureDe,
    pending,
  };
}
