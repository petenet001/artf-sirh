import {
  arbreVide,
  cheminDepuisSession,
  dansPerimetre,
  indexerNoms,
  libelleStructure,
  nomsVides,
  optionsNiveau,
  TOUTES_STRUCTURES,
  TYPE_BUREAU,
  TYPE_DIRECTION,
  TYPE_SERVICE,
  type ArbreConnu,
  type Perimetre,
  type Rattachement,
  type StructureSimple,
} from "~/utils/structures";
import { niveauCloisonnement, nomsRoles, vueEffective } from "~/constants/utilisateurs";

/**
 * Descendre dans l'effectif que le serveur nous a déjà envoyé.
 *
 * ## La règle qui gouverne tout : ne jamais re-filtrer son propre périmètre
 *
 * `GET /personnel/agents` applique **déjà** le cloisonnement (vague F) : un
 * directeur reçoit sa direction, un chef de service son service, un chef de
 * bureau son bureau, le métier RH tout l'ARTF. Le front n'a donc **rien** à
 * restreindre par défaut — il n'a qu'à offrir de descendre.
 *
 * Une version antérieure appliquait le périmètre de l'utilisateur comme filtre
 * par défaut. Comme la filiation n'était pas encore chargée au premier rendu,
 * elle retombait sur le niveau le plus restrictif : **un directeur ne voyait
 * que son propre bureau** au lieu de sa direction. D'où la règle, désormais
 * explicite : le filtre client ne vaut que pour une descente **choisie**.
 *
 * ## Ce que chacun peut parcourir
 *
 * Le rôle donne la profondeur, exactement comme `User::niveauCloisonnement()` :
 *
 * | Fonction | Reçoit du serveur | Peut descendre par |
 * |---|---|---|
 * | chef de bureau | son bureau | rien — il est au bout |
 * | chef de service | son service, tous bureaux confondus | bureau |
 * | directeur | sa direction entière | service, puis bureau |
 * | métier RH, DG | tout l'ARTF | direction, service, bureau |
 *
 * ## Se situer sans requête
 *
 * Depuis 2026-10-01, la session (`/user`) porte `bureau.service.direction` : la
 * chaîne de l'utilisateur est lue directement. `GET /bureaux/{id}` ne sert plus
 * que de repli (session persistée avant la mise à jour de l'API). Les niveaux du
 * dessous se chargent ensuite à la demande, par les sous-routes
 * `/directions/{id}/services` et `/services/{id}/bureaux` — les listes plates
 * ne portant ni `service_id` ni `direction_id`.
 */
export function usePerimetrePersonnel() {
  const auth = useAuthStore();
  const directionsApi = useDirectionsApi();
  const servicesApi = useServicesApi();
  const bureauxApi = useBureauxApi();

  /** Profondeur de descente autorisée, d'après la fonction. */
  const niveau = computed<"bureau" | "service" | "direction" | "globale">(() => {
    const user = auth.user;
    if (!user) return "bureau";
    if (vueEffective(user) === "globale") return "globale";
    return niveauCloisonnement(nomsRoles(user));
  });

  // ── Noms : trois listes plates, pour la colonne « Structure » ──────────────
  const { data: nomsData } = useAsyncData(
    "structures-noms",
    async () => {
      const [d, s, b] = await Promise.allSettled([
        directionsApi.list(),
        servicesApi.list(),
        bureauxApi.list(),
      ]);
      return indexerNoms(
        d.status === "fulfilled" ? d.value.data : [],
        s.status === "fulfilled" ? s.value.data : [],
        b.status === "fulfilled" ? b.value.data : [],
      );
    },
    { default: nomsVides },
  );
  const noms = computed(() => nomsData.value ?? nomsVides());

  // ── Ma chaîne : bureau → service → direction, en un appel ──────────────────
  const { data: cheminData } = useAsyncData(
    () => `mon-chemin-${auth.user?.bureau_id ?? 0}`,
    async () => {
      const id = auth.user?.bureau_id;
      if (!id) return null;
      const servi = cheminDepuisSession(auth.user?.bureau);
      if (servi) return servi;
      try {
        const { data } = await bureauxApi.getById(id);
        return {
          bureau: { id: data.id, nom: data.nom, sigle: data.sigle } as StructureSimple,
          service: data.service ? ({ ...data.service } as StructureSimple) : null,
          direction: data.service?.direction ? ({ ...data.service.direction } as StructureSimple) : null,
        };
      } catch {
        // Sans ma chaîne, pas de cascade — mais la liste reste complète.
        return null;
      }
    },
    { watch: [() => auth.user?.bureau_id] },
  );
  const monChemin = computed(() => cheminData.value ?? null);

  // ── Filiation chargée à la demande ─────────────────────────────────────────
  const arbre = ref<ArbreConnu>(arbreVide());

  async function chargerServices(id: number): Promise<StructureSimple[]> {
    const connus = arbre.value.servicesParDirection.get(id);
    if (connus) return connus;
    try {
      const { data } = await directionsApi.services(id);
      arbre.value.servicesParDirection.set(id, data);
      arbre.value = { ...arbre.value };
      return data;
    } catch {
      return [];
    }
  }

  async function chargerBureaux(id: number): Promise<StructureSimple[]> {
    const connus = arbre.value.bureauxParService.get(id);
    if (connus) return connus;
    try {
      const { data } = await servicesApi.bureaux(id);
      arbre.value.bureauxParService.set(id, data);
      arbre.value = { ...arbre.value };
      return data;
    } catch {
      return [];
    }
  }

  // ── Sélection, du plus large au plus fin ───────────────────────────────────
  const directionId = ref<number | undefined>(undefined);
  const serviceId = ref<number | undefined>(undefined);
  const bureauId = ref<number | undefined>(undefined);

  const chargement = ref(false);
  const directions = ref<StructureSimple[]>([]);
  const services = ref<StructureSimple[]>([]);
  const bureaux = ref<StructureSimple[]>([]);

  /**
   * Direction de travail : celle choisie, sinon la sienne. Un directeur n'a pas
   * à choisir sa direction — il n'en a qu'une, et le serveur ne lui en enverra
   * jamais d'autre.
   */
  const directionCourante = computed(
    () => directionId.value ?? (niveau.value === "direction" ? monChemin.value?.direction?.id : undefined),
  );

  /** Service de travail : celui choisi, sinon le sien s'il est chef de service. */
  const serviceCourant = computed(
    () => serviceId.value ?? (niveau.value === "service" ? monChemin.value?.service?.id : undefined),
  );

  async function recomposer() {
    chargement.value = true;
    try {
      // Niveau 1 — directions : seulement en vue globale.
      if (niveau.value === "globale") {
        if (!arbre.value.directions.length) {
          const liste = await directionsApi.list().then((r) => r.data).catch(() => []);
          arbre.value = { ...arbre.value, directions: liste };
        }
        directions.value = arbre.value.directions;
      } else {
        directions.value = [];
      }

      // Niveau 2 — services : ceux de la direction de travail. Un chef de
      // service ou de bureau n'a pas de choix de service à faire.
      const dir = directionCourante.value;
      services.value = dir && niveau.value !== "service" && niveau.value !== "bureau"
        ? await chargerServices(dir)
        : [];

      // Niveau 3 — bureaux : ceux du service de travail, sinon de tous les
      // services offerts. Un chef de bureau est au bout : rien à proposer.
      if (niveau.value === "bureau") {
        bureaux.value = [];
      } else {
        const svc = serviceCourant.value;
        if (svc) {
          bureaux.value = await chargerBureaux(svc);
        } else if (services.value.length) {
          const listes = await Promise.all(services.value.map((s) => chargerBureaux(s.id)));
          bureaux.value = listes.flat();
        } else {
          bureaux.value = [];
        }
      }
    } finally {
      chargement.value = false;
    }
  }

  onMounted(recomposer);
  watch([niveau, monChemin], recomposer);

  // Changer de niveau invalide ceux du dessous : garder « B.P » après être
  // passé sur une autre direction donnerait une liste vide inexplicable.
  watch(directionId, async () => {
    serviceId.value = undefined;
    bureauId.value = undefined;
    await recomposer();
  });
  watch(serviceId, async () => {
    bureauId.value = undefined;
    await recomposer();
  });

  // ── Liaison des sélecteurs ─────────────────────────────────────────────────
  // Les `USelect` manipulent la sentinelle `TOUTES_STRUCTURES` ; le reste du
  // composable ne connaît que `undefined`.
  function lien(cible: Ref<number | undefined>) {
    return computed<number>({
      get: () => cible.value ?? TOUTES_STRUCTURES,
      set: (v) => {
        cible.value = v === TOUTES_STRUCTURES ? undefined : v;
      },
    });
  }

  const choixDirection = lien(directionId);
  const choixService = lien(serviceId);
  const choixBureau = lien(bureauId);

  const optionsDirections = computed(() => optionsNiveau(directions.value, "Toutes les directions"));
  const optionsServices = computed(() => optionsNiveau(services.value, "Tous les services"));
  const optionsBureaux = computed(() => optionsNiveau(bureaux.value, "Tous les bureaux"));

  /**
   * Périmètre du filtre client : **la descente choisie, et rien d'autre**.
   *
   * Aucun repli sur le périmètre de l'utilisateur : le serveur l'a déjà
   * appliqué. Y revenir ici ne pourrait que retrancher à tort.
   */
  const perimetreActif = computed<Perimetre | null>(() => {
    if (bureauId.value) return { type: TYPE_BUREAU, id: bureauId.value };
    if (serviceId.value) return { type: TYPE_SERVICE, id: serviceId.value };
    if (directionId.value) return { type: TYPE_DIRECTION, id: directionId.value };
    return null;
  });

  const affine = computed(() => perimetreActif.value !== null);

  function reinitialiser() {
    directionId.value = undefined;
    serviceId.value = undefined;
    bureauId.value = undefined;
  }

  /**
   * Cadrer sur sa propre structure — pour qui voit plus large qu'elle.
   *
   * N'a de sens qu'en vue globale : ailleurs, le serveur a déjà cadré, et le
   * bouton ne ferait rien de visible.
   */
  const maStructurePossible = computed(
    () => niveau.value === "globale" && monChemin.value?.bureau != null,
  );

  async function allerAMaStructure() {
    const chemin = monChemin.value;
    if (!chemin) return;
    chargement.value = true;
    try {
      if (chemin.direction) {
        directionId.value = chemin.direction.id;
        await nextTick();
      }
      if (chemin.service) {
        serviceId.value = chemin.service.id;
        await nextTick();
      }
      bureauId.value = chemin.bureau.id;
    } finally {
      chargement.value = false;
    }
  }

  /** Filtre une liste d'agents selon la descente choisie. */
  function filtrer<T extends { affectation_active?: Rattachement | null }>(agents: T[]): T[] {
    const p = perimetreActif.value;
    if (!p) return agents;
    return agents.filter((a) => dansPerimetre(a.affectation_active, p, arbre.value));
  }

  /** Libellé d'affectation d'un agent, pour la colonne « Structure ». */
  function structureDe(rattachement?: Rattachement | null): string {
    return libelleStructure(rattachement, noms.value, arbre.value);
  }

  return {
    niveau,
    monChemin,
    optionsDirections,
    optionsServices,
    optionsBureaux,
    choixDirection,
    choixService,
    choixBureau,
    perimetreActif,
    affine,
    chargement,
    maStructurePossible,
    allerAMaStructure,
    reinitialiser,
    filtrer,
    structureDe,
  };
}
