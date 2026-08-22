import type { AgentSummary } from "~/schemas/agent-summary";
import type { DossierIntegration } from "~/schemas/dossier-integration";
import type { StructurableType } from "~/constants/entite";

/** Statuts qui clôturent un dossier : hors « en cours ». */
const STATUTS_TERMINES = ["INTEGRE", "REJETE", "ANNULE"];

/** Une sous-structure listée sous l'entité (service d'une direction, bureau d'un service). */
export interface SousStructure {
  id: number;
  nom: string;
  sigle?: string | null;
}

/**
 * Aperçu de **mon entité** : sa fiche, ses sous-structures, son effectif et les
 * dossiers d'intégration en cours qui la concernent.
 *
 * Deux dépendances à l'API méritent d'être connues :
 * 1. l'effectif vient des **affectations filtrées** sur la structure
 *    (`?structurable_type=&structurable_id=`) — l'API n'expose pas de route
 *    « agents d'une structure » ;
 * 2. les **dossiers** ne sont pas filtrables par structure : on les recoupe en
 *    mémoire avec l'effectif (volume faible, exception assumée comme pour les
 *    stagiaires).
 */
export function useEntiteApercu() {
  const { type, structureId, typeLabel, poste, estResponsable } = useMonEntite();

  const directionsApi = useDirectionsApi();
  const servicesApi = useServicesApi();
  const bureauxApi = useBureauxApi();
  const affectationsApi = useAffectationsApi();
  const dossiersApi = useDossiersApi();

  /** Fiche + enfants de la structure, selon son type polymorphe. */
  async function chargerStructure(t: StructurableType, id: number) {
    if (t === "App\\Models\\Direction") {
      const [fiche, enfants] = await Promise.all([directionsApi.getById(id), directionsApi.services(id)]);
      return { nom: fiche.data.nom, enfants: enfants.data as SousStructure[], enfantsLabel: "Services" };
    }
    if (t === "App\\Models\\Service") {
      const [fiche, enfants] = await Promise.all([servicesApi.getById(id), servicesApi.bureaux(id)]);
      return { nom: fiche.data.nom, enfants: enfants.data as SousStructure[], enfantsLabel: "Bureaux" };
    }
    const fiche = await bureauxApi.getById(id);
    return { nom: fiche.data.nom, enfants: [] as SousStructure[], enfantsLabel: "" };
  }

  const { data, pending, error, refresh } = useAsyncData(
    () => `entite-${type.value ?? "aucune"}-${structureId.value ?? 0}`,
    async () => {
      const t = type.value;
      const id = structureId.value;
      if (!t || !id) return null;

      const [structure, affectations, dossiers] = await Promise.all([
        chargerStructure(t, id),
        affectationsApi.list({ structurable_type: t, structurable_id: id }),
        dossiersApi.list(),
      ]);

      // Effectif = agents portés par les affectations de la structure.
      const effectif = affectations.data
        .map((a) => a.agent)
        .filter((a): a is AgentSummary => !!a);
      const ids = new Set(effectif.map((a) => a.id));

      const enCours = (dossiers.data as DossierIntegration[]).filter(
        (d) =>
          !STATUTS_TERMINES.includes(d.statut ?? "") &&
          ((d.agent_id != null && ids.has(d.agent_id)) || (d.agent?.id != null && ids.has(d.agent.id))),
      );

      return { ...structure, effectif, dossiers: enCours };
    },
    { watch: [type, structureId] },
  );

  const effectif = computed(() => data.value?.effectif ?? []);

  /** Répartition de l'effectif par statut, pour les chiffres clés. */
  const parStatut = computed(() => {
    const out: Record<string, number> = {};
    for (const agent of effectif.value) {
      const statut = agent.statut ?? "inconnu";
      out[statut] = (out[statut] ?? 0) + 1;
    }
    return out;
  });

  return {
    poste,
    typeLabel,
    estResponsable,
    nom: computed(() => data.value?.nom ?? null),
    enfants: computed(() => data.value?.enfants ?? []),
    enfantsLabel: computed(() => data.value?.enfantsLabel ?? ""),
    effectif,
    parStatut,
    dossiers: computed(() => data.value?.dossiers ?? []),
    pending,
    error,
    refresh,
  };
}
