import type { DossierIntegration } from "~/schemas/dossier-integration";
import type { ResolutionEntite } from "~/constants/entite";
import {
  RACINE_ARTF,
  aplatirEffectif,
  compterStructures,
  construireArbre,
  idsAgents,
  type AffectationAgent,
  type TypeNoeud,
} from "~/utils/entite";
import {
  TYPE_BUREAU,
  TYPE_DIRECTION,
  TYPE_SERVICE,
  arbreVide,
  type ArbreConnu,
  type StructureSimple,
} from "~/utils/structures";

/** Statuts qui clôturent un dossier : hors « en cours ». */
const STATUTS_TERMINES = ["INTEGRE", "REJETE", "ANNULE"];

/**
 * Aperçu de **mon entité**, de mon niveau jusqu'en bas : l'organigramme
 * descendant, l'effectif de chaque structure et les arrivées en cours.
 *
 * ## D'où viennent les données
 *
 * | Besoin | Source |
 * |---|---|
 * | descendance | `/directions/{id}/services`, `/services/{id}/bureaux` (et `/directions` pour le DG) |
 * | effectif | `/carriere/affectations?statut=active`, rangé en mémoire |
 * | arrivées | `/integration/dossiers`, recoupé avec l'effectif |
 *
 * ⚠️ L'API ignore `structurable_type` / `structurable_id` sur la liste des
 * affectations : elle renvoie **toutes** les affectations actives de l'ARTF.
 * Le rangement par structure se fait donc ici. Ce n'est qu'un affichage, pas
 * une frontière de sécurité — un endpoint « mon entité » côté API est demandé.
 *
 * On ne passe pas par `/personnel/agents` : la liste exige un dossier
 * d'intégration au statut INTEGRE, que les agents repris de gestRHdb n'ont pas.
 */
export function useEntiteApercu() {
  const { resolution, niveau, poste, typeLabel, estResponsable, pending: pendingMoi, error: erreurMoi } =
    useMonEntite();

  const directionsApi = useDirectionsApi();
  const servicesApi = useServicesApi();
  const bureauxApi = useBureauxApi();
  const affectationsApi = useAffectationsApi();
  const dossiersApi = useDossiersApi();

  /** Charge toute la descendance d'une liste de services. */
  async function chargerBureaux(services: StructureSimple[], arbre: ArbreConnu) {
    const listes = await Promise.all(services.map((s) => servicesApi.bureaux(s.id)));
    services.forEach((s, i) => arbre.bureauxParService.set(s.id, listes[i]!.data as StructureSimple[]));
  }

  /** Charge toute la descendance d'une liste de directions. */
  async function chargerServices(directions: StructureSimple[], arbre: ArbreConnu) {
    const listes = await Promise.all(directions.map((d) => directionsApi.services(d.id)));
    const services: StructureSimple[] = [];
    directions.forEach((d, i) => {
      const enfants = listes[i]!.data as StructureSimple[];
      arbre.servicesParDirection.set(d.id, enfants);
      services.push(...enfants);
    });
    await chargerBureaux(services, arbre);
  }

  /** Racine de l'entité et toute sa descendance. */
  async function chargerOrganigramme(r: ResolutionEntite) {
    const arbre = arbreVide();

    if (r.etat === "artf") {
      arbre.directions = (await directionsApi.list()).data as StructureSimple[];
      await chargerServices(arbre.directions, arbre);
      return { racine: { type: "artf" as TypeNoeud, structure: RACINE_ARTF }, arbre };
    }
    if (r.etat !== "structure") return null;

    if (r.type === TYPE_DIRECTION) {
      const fiche = (await directionsApi.getById(r.id)).data as StructureSimple;
      await chargerServices([fiche], arbre);
      return { racine: { type: r.type as TypeNoeud, structure: fiche }, arbre };
    }
    if (r.type === TYPE_SERVICE) {
      const fiche = (await servicesApi.getById(r.id)).data as StructureSimple;
      await chargerBureaux([fiche], arbre);
      return { racine: { type: r.type as TypeNoeud, structure: fiche }, arbre };
    }
    const fiche = (await bureauxApi.getById(r.id)).data as StructureSimple;
    return { racine: { type: TYPE_BUREAU as TypeNoeud, structure: fiche }, arbre };
  }

  const cle = computed(() => {
    const r = resolution.value;
    if (r.etat === "artf") return "entite-artf";
    return r.etat === "structure" ? `entite-${r.type}-${r.id}` : "entite-aucune";
  });

  const { data, pending: pendingEntite, error: erreurEntite, refresh } = useAsyncData(
    () => cle.value,
    async () => {
      const [organigramme, affectations, dossiers] = await Promise.all([
        chargerOrganigramme(resolution.value),
        estResponsable.value ? affectationsApi.list({ statut: "active" }) : null,
        // Les arrivées sont un complément : leur échec ne doit pas masquer l'entité.
        estResponsable.value ? dossiersApi.list().catch(() => null) : null,
      ]);
      if (!organigramme || !affectations) return null;

      const racine = construireArbre(
        organigramme.racine,
        organigramme.arbre,
        affectations.data as AffectationAgent[],
      );

      const ids = idsAgents(racine);
      const enCours = ((dossiers?.data ?? []) as DossierIntegration[]).filter(
        (d) =>
          !STATUTS_TERMINES.includes(d.statut ?? "") &&
          ((d.agent_id != null && ids.has(d.agent_id)) || (d.agent?.id != null && ids.has(d.agent.id))),
      );

      return { racine, dossiers: enCours, dossiersIndisponibles: dossiers === null };
    },
    { watch: [cle] },
  );

  const racine = computed(() => data.value?.racine ?? null);

  return {
    poste,
    niveau,
    resolution,
    typeLabel,
    estResponsable,
    racine,
    nom: computed(() => racine.value?.nom ?? null),
    effectif: computed(() => (racine.value ? aplatirEffectif(racine.value) : [])),
    nbDirections: computed(() => (racine.value ? compterStructures(racine.value, TYPE_DIRECTION) : 0)),
    nbServices: computed(() => (racine.value ? compterStructures(racine.value, TYPE_SERVICE) : 0)),
    nbBureaux: computed(() => (racine.value ? compterStructures(racine.value, TYPE_BUREAU) : 0)),
    dossiers: computed(() => data.value?.dossiers ?? []),
    dossiersIndisponibles: computed(() => data.value?.dossiersIndisponibles ?? false),
    pending: computed(() => pendingMoi.value || pendingEntite.value),
    error: computed(() => erreurMoi.value ?? erreurEntite.value),
    refresh,
  };
}
