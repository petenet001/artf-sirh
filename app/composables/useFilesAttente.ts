import { estRh } from "~/constants/roles";

/** Une file d'attente : ce qui réclame une décision de l'utilisateur connecté. */
export interface FileAttente {
  cle: string;
  libelle: string;
  /** Ce que l'utilisateur doit en faire, en une formule. */
  action: string;
  icone: string;
  lien: string;
  total: number;
}

/**
 * Ce qui attend une décision **de la personne connectée**.
 *
 * À distinguer des alertes de conformité (`/reporting/alertes`), qui disent ce
 * qui est en défaut dans l'organisation : ici, ce sont des dossiers arrêtés
 * qu'un clic débloque. C'est le seul contenu du tableau de bord qui change le
 * comportement de son lecteur — d'où sa place en haut de page.
 *
 * Le module Reporting ne les agrège pas (hors périmètre V1) : chaque file est
 * donc interrogée sur sa propre route, et seulement si la permission
 * correspondante est là. Un compte sans droit ne déclenche aucun appel.
 */
export function useFilesAttente() {
  const auth = useAuthStore();

  const congesApi = useDemandesCongeApi();
  const absencesApi = useAbsencesApi();
  const sanctionsApi = useSanctionsApi();
  const reclamationsApi = useReclamationsApi();
  const evaluationsApi = useEvaluationsApi();
  const bonificationsApi = useBonificationsStageApi();
  const exceptionnelsApi = useAvancementsExceptionnelsApi();
  const dossiersApi = useDossiersApi();
  const affectationsApi = useAffectationsApi();
  const nominationsApi = useNominationsApi();

  // Vague F : la DRHL est éclatée en cinq rôles de bureau. Tester `hasRole("rh")`
  // seul priverait de leurs files tous les agents de bureau, qui portent
  // pourtant les permissions correspondantes.
  const estCoteRh = computed(() => estRh(auth.hasRole));

  /**
   * Déclaration d'une file : sa condition d'existence et son compteur. Le
   * `quand` évite l'appel plutôt que d'essuyer un 403.
   */
  interface Source extends Omit<FileAttente, "total"> {
    quand: () => boolean;
    compter: () => Promise<number>;
  }

  const taille = (r: { data: unknown[] }) => r.data.length;

  const sources: Source[] = [
    {
      cle: "conges",
      libelle: "Demandes de congé",
      action: "à valider",
      icone: "i-lucide-palmtree",
      lien: "/conges/demandes",
      quand: () => auth.can("valider-conges"),
      compter: async () => taille(await congesApi.aValider()),
    },
    {
      cle: "absences",
      libelle: "Absences",
      action: "à valider",
      icone: "i-lucide-user-x",
      lien: "/conges/absences",
      quand: () => auth.can("valider-absences"),
      compter: async () => taille(await absencesApi.aValider()),
    },
    {
      cle: "evaluations_a_noter",
      libelle: "Fiches d'évaluation",
      action: "à noter",
      icone: "i-lucide-pencil-line",
      lien: "/evaluations/a-noter",
      quand: () => auth.can("valider-evaluations") && !!auth.user?.agent_id,
      compter: async () => {
        const fiches = await evaluationsApi.aNoter();
        // Seules les fiches dont l'étape courante revient au notateur.
        return fiches.data.filter((f) =>
          ["noter", "continuer_notation", "avis_et_signer", "corriger_notation"].includes(
            f.prochaine_etape ?? "",
          ),
        ).length;
      },
    },
    {
      cle: "evaluations_rh",
      libelle: "Fiches d'évaluation",
      action: "à valider (RH)",
      icone: "i-lucide-shield-check",
      lien: "/evaluations/validation-rh",
      quand: () => estCoteRh.value && auth.can("valider-evaluations"),
      compter: async () => taille(await evaluationsApi.list({ statut: "en_validation_rh" })),
    },
    {
      cle: "reclamations",
      libelle: "Réclamations d'évaluation",
      action: "à trancher",
      icone: "i-lucide-message-square-warning",
      lien: "/evaluations/validation-rh",
      quand: () => estCoteRh.value && auth.can("valider-evaluations"),
      compter: async () => taille(await reclamationsApi.enAttente()),
    },
    {
      cle: "sanctions_instruire",
      libelle: "Dossiers disciplinaires",
      action: "à instruire",
      icone: "i-lucide-file-search",
      lien: "/discipline/dossiers",
      quand: () => auth.can("gerer-discipline"),
      compter: async () => taille(await sanctionsApi.aInstruire()),
    },
    {
      cle: "sanctions_prononcer",
      libelle: "Sanctions",
      action: "à prononcer",
      icone: "i-lucide-gavel",
      lien: "/discipline/dossiers",
      quand: () => auth.can("prononcer-discipline"),
      compter: async () => taille(await sanctionsApi.aPrononcer()),
    },
    {
      cle: "avancements_hors_cycle",
      libelle: "Avancements hors cycle",
      action: "à traiter",
      icone: "i-lucide-rocket",
      lien: "/evaluations/bonifications",
      quand: () => auth.can("valider-evaluations"),
      compter: async () => {
        const [bonifications, exceptionnels] = await Promise.all([
          bonificationsApi.enAttente(),
          exceptionnelsApi.enAttente(),
        ]);
        return bonifications.data.length + exceptionnels.data.length;
      },
    },
    {
      cle: "integration",
      libelle: "Dossiers et actes de carrière",
      action: "à valider",
      icone: "i-lucide-folder-check",
      lien: "/integration/validations",
      quand: () => auth.can("valider-recrutement"),
      compter: async () => {
        // L'API n'expose pas de file globale : on additionne les entités
        // arrêtées à une étape de circuit, comme le fait l'écran dédié.
        const [valideRh, attenteDg, affectations, nominations] = await Promise.all([
          dossiersApi.list({ statut: "VALIDE_RH" }),
          dossiersApi.list({ statut: "EN_ATTENTE_DG" }),
          affectationsApi.list({ statut: "en_attente_validation" }),
          nominationsApi.list({ statut: "en_attente" }),
        ]);
        return (
          valideRh.data.length + attenteDg.data.length + affectations.data.length + nominations.data.length
        );
      },
    },
  ];

  const { data, pending, refresh } = useAsyncData("files-attente", async () => {
    const actives = sources.filter((s) => s.quand());

    const comptes = await Promise.allSettled(actives.map((s) => s.compter()));

    return actives.map((source, index) => {
      const compte = comptes[index];
      return {
        cle: source.cle,
        libelle: source.libelle,
        action: source.action,
        icone: source.icone,
        lien: source.lien,
        // Une file qui échoue vaut zéro : elle disparaît plutôt que d'afficher
        // un chiffre faux ou de casser la page.
        total: compte?.status === "fulfilled" ? compte.value : 0,
      } satisfies FileAttente;
    });
  });

  const files = computed(() => data.value ?? []);
  /** Files réellement en attente, les plus chargées d'abord. */
  const enAttente = computed(() => files.value.filter((f) => f.total > 0).sort((a, b) => b.total - a.total));
  const total = computed(() => enAttente.value.reduce((somme, f) => somme + f.total, 0));

  return { files, enAttente, total, pending, refresh };
}
