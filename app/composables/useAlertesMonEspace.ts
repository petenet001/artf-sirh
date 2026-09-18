import type { SignauxMonEspace } from "~/constants/mon-espace";
import { alertesParCarte } from "~/constants/mon-espace";

/**
 * Ce qui réclame l'attention de l'utilisateur sur son propre espace.
 *
 * ## Trois sources, trois natures
 *
 * 1. **Notifications non lues**, ventilées par domaine → « du nouveau ». On
 *    interroge `non_lues=1` plutôt que de réutiliser l'état de la cloche : elle
 *    ne garde que les dix dernières, toutes confondues, et un compteur calculé
 *    dessus serait faux dès qu'il y a du volume.
 * 2. **Fiches d'évaluation à signer** → une action que personne ne peut faire à
 *    votre place : tant qu'elle n'est pas posée, le circuit est arrêté.
 * 3. **Dossier incomplet** → les rubriques que la RH réclamera tôt ou tard.
 *    Même définition que l'alerte de conformité du reporting : informations
 *    personnelles, professionnelles, et au moins un contact d'urgence.
 *
 * ## Chaque source échoue en silence
 *
 * C'est la page d'atterrissage de **tout** compte. Une pastille manquante est
 * un désagrément ; un écran d'erreur à la place de l'espace personnel est un
 * incident. Les trois appels sont donc indépendants et tolérants — d'où
 * `allSettled` et les `catch` qui rendent une valeur neutre.
 */
export function useAlertesMonEspace() {
  const auth = useAuthStore();
  const notificationsApi = useNotificationsApi();
  const evaluationsApi = useEvaluationsApi();
  const personnelApi = usePersonnelAgentsApi();

  const agentId = computed(() => auth.user?.agent_id ?? 0);

  const { data, pending } = useAsyncData(
    () => `alertes-mon-espace-${agentId.value}`,
    async (): Promise<SignauxMonEspace> => {
      const neutre: SignauxMonEspace = {
        nonLuesParDomaine: {},
        fichesASigner: 0,
        sectionsManquantes: [],
      };

      const [notifs, fiches, dossier] = await Promise.allSettled([
        // 50 suffit : au-delà, le chiffre exact n'apporte plus rien à un coup d'œil.
        notificationsApi.list({ non_lues: true, per_page: 50 }),
        agentId.value && auth.can("consulter-evaluations")
          ? evaluationsApi.mesEvaluations()
          : Promise.resolve(null),
        agentId.value ? personnelApi.fiche(agentId.value) : Promise.resolve(null),
      ]);

      if (notifs.status === "fulfilled") {
        for (const n of notifs.value.data) {
          if (n.lu || !n.domaine) continue;
          neutre.nonLuesParDomaine[n.domaine] = (neutre.nonLuesParDomaine[n.domaine] ?? 0) + 1;
        }
      }

      if (fiches.status === "fulfilled" && fiches.value) {
        neutre.fichesASigner = fiches.value.data.filter(
          (f) => f.prochaine_etape === "signer_evalue",
        ).length;
      }

      if (dossier.status === "fulfilled" && dossier.value) {
        const agent = dossier.value.data;
        if (!agent.informations_personnelles) {
          neutre.sectionsManquantes.push("informations personnelles");
        }
        if (!agent.informations_professionnelles) {
          neutre.sectionsManquantes.push("informations professionnelles");
        }
        if (!agent.contacts_urgence?.length) {
          neutre.sectionsManquantes.push("contact d'urgence");
        }
      }

      return neutre;
    },
    { watch: [agentId], default: () => ({ nonLuesParDomaine: {}, fichesASigner: 0, sectionsManquantes: [] }) },
  );

  const alertes = computed(() =>
    alertesParCarte(data.value ?? { nonLuesParDomaine: {}, fichesASigner: 0, sectionsManquantes: [] }),
  );

  /** Y a-t-il au moins une action en attente ? Pilote le bandeau de tête. */
  const actions = computed(() => Object.values(alertes.value).filter((a) => a.ton === "action"));

  return { alertes, actions, pending };
}
