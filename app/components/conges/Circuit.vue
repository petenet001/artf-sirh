<script setup lang="ts">
import type { DemandeConge } from "~/schemas/demande-conge";
import { ETAPES_CIRCUIT_CONGE, type EtapeCircuitConge } from "~/constants/conges";

/**
 * Circuit de validation d'une demande de congé : les étapes requises par le type
 * (`necessite_*`), leur état (validée / rejetée / en attente / à venir) et les
 * actions sur l'étape courante. La **source de vérité** de l'étape est
 * `demande.prochaine_etape` (serveur). Qui peut la signer (N+1 réel de l'agent,
 * rôle `rh`, rôle `directeur-general`, `admin`) est tranché par l'API : on
 * n'affiche les boutons que si la demande figure dans **sa file**
 * (`GET /conges/demandes/a-valider`), qui applique exactement cette règle.
 */
const props = defineProps<{
  demande: DemandeConge;
  /**
   * Congé annuel (`origine` posée) : actions et file sur `/conges-annuels`, où
   * la règle « traitement après clôture » est appliquée. Passer par
   * `/conges/demandes` la contournerait.
   */
  annuel?: boolean;
  /** Proposition de campagne encore ouverte : rien à signer avant la clôture. */
  enAttenteCloture?: boolean;
}>();
const emit = defineEmits<{ changed: [] }>();

const auth = useAuthStore();
const congesApi = useDemandesCongeApi();
const annuelsApi = useCongesAnnuelsApi().demandes;
// Mêmes verbes des deux côtés ; le congé annuel n'a pas d'étape DG.
const api = computed(() => (props.annuel ? annuelsApi : congesApi));
const toast = useToast();
const handleError = useApiError();

const id = computed(() => props.demande.id);

// Étapes réellement dans le circuit de ce type (flag `necessite_*`). Le congé
// annuel n'a jamais de visa DG, quel que soit le paramétrage du type.
const etapes = computed(() =>
  ETAPES_CIRCUIT_CONGE.filter(
    (e) => props.demande.type_conge?.[e.requisFlag] && !(props.annuel && e.key === "dg"),
  ),
);

type EtapeEtat = "validee" | "rejetee" | "courante" | "a_venir";

function etat(e: EtapeCircuitConge): EtapeEtat {
  const d = props.demande;
  if (d.statut === `rejetee_${e.key}`) return "rejetee";
  if (d[e.dateField]) return "validee";
  if (d.prochaine_etape === e.etape) return "courante";
  return "a_venir";
}

const ETAT_META: Record<EtapeEtat, { icon: string; classe: string; label: string }> = {
  validee: { icon: "i-lucide-check", classe: "bg-success/15 text-success", label: "Validée" },
  rejetee: { icon: "i-lucide-x", classe: "bg-error/15 text-error", label: "Rejetée" },
  courante: { icon: "i-lucide-clock", classe: "bg-warning/15 text-warning", label: "En attente" },
  a_venir: { icon: "i-lucide-minus", classe: "bg-elevated text-dimmed", label: "À venir" },
};

// File du signataire connecté, rechargée à chaque changement d'étape. La
// permission `valider-conges` ne fait qu'ouvrir la route : un RH n'est pas le
// N+1, un chef ne signe pas la RH (403) — d'où ce contrôle par la file.
//
// La file dépend aussi de la campagne : tant qu'elle est ouverte, on ne la lit
// pas. Il faut donc la relire quand la campagne se ferme, pas seulement quand
// l'étape change — sinon le N+1 ne voit son bouton qu'après un rechargement
// complet. On la relit aussi au retour sur l'onglet : la clôture ou la
// correction d'un N+1 se fait souvent dans un autre onglet.
const { data: file, refresh: relireFile } = useAsyncData(
  () => `conge-signable-${id.value}`,
  () =>
    auth.can("valider-conges") && props.demande.prochaine_etape && !props.enAttenteCloture
      ? api.value.aValider()
      : Promise.resolve(null),
  {
    watch: [
      () => props.demande.prochaine_etape,
      () => props.demande.statut,
      () => props.enAttenteCloture,
    ],
  },
);
useAuRetourOnglet(relireFile);

/** L'utilisateur peut-il signer l'étape courante ? */
const peutSigner = computed(() => file.value?.data.some((d) => d.id === id.value) ?? false);

const busy = ref(false);

const validerFns = {
  n1: () => api.value.validerN1(id.value),
  rh: () => api.value.validerRH(id.value),
  dg: () => congesApi.validerDG(id.value),
} as const;

async function valider(e: EtapeCircuitConge) {
  busy.value = true;
  try {
    await validerFns[e.key]();
    toast.add({ title: "Étape validée", color: "success" });
    emit("changed");
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

// — Rejet (commentaire obligatoire) ————————————————————————————
const rejetOpen = ref(false);
const rejetComment = ref("");
const rejetEtape = ref<EtapeCircuitConge | null>(null);

function ouvrirRejet(e: EtapeCircuitConge) {
  rejetEtape.value = e;
  rejetComment.value = "";
  rejetOpen.value = true;
}

const rejeterFns = {
  n1: (c: string) => api.value.rejeterN1(id.value, { commentaire: c }),
  rh: (c: string) => api.value.rejeterRH(id.value, { commentaire: c }),
  dg: (c: string) => congesApi.rejeterDG(id.value, { commentaire: c }),
} as const;

async function confirmerRejet() {
  if (!rejetEtape.value || rejetComment.value.trim().length < 3) {
    toast.add({ title: "Motif requis (3 caractères min.).", color: "error" });
    return;
  }
  busy.value = true;
  try {
    await rejeterFns[rejetEtape.value.key](rejetComment.value.trim());
    toast.add({ title: "Demande rejetée", color: "success" });
    rejetOpen.value = false;
    emit("changed");
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div>
    <UAlert
      v-if="enAttenteCloture && demande.statut === 'soumise'"
      class="mb-4"
      color="neutral"
      variant="subtle"
      icon="i-lucide-lock"
      title="Campagne encore ouverte"
      description="Le N+1 puis la RH examinent les propositions après la clôture de la campagne."
    />
    <p v-if="demande.statut === 'annulee'" class="text-sm text-muted">
      Demande retirée par le demandeur avant toute validation : circuit interrompu.
    </p>
    <ol v-else class="space-y-4">
      <li v-for="e in etapes" :key="e.key" class="flex gap-3">
        <span class="flex size-8 shrink-0 items-center justify-center rounded-full" :class="ETAT_META[etat(e)].classe">
          <UIcon :name="ETAT_META[etat(e)].icon" class="size-4" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-medium text-highlighted">{{ e.label }}</p>
            <span class="text-xs text-muted">{{ ETAT_META[etat(e)].label }}</span>
          </div>
          <p v-if="demande[e.dateField]" class="text-xs text-muted">
            Le {{ formatDateLong(demande[e.dateField]) }}
          </p>
          <p v-if="demande[e.commentaireField]" class="mt-1 text-sm text-default">
            « {{ demande[e.commentaireField] }} »
          </p>

          <div v-if="etat(e) === 'courante' && peutSigner" class="mt-2 flex gap-2">
            <UButton size="xs" icon="i-lucide-check" :loading="busy" @click="valider(e)">Valider</UButton>
            <UButton size="xs" color="error" variant="soft" icon="i-lucide-x" :loading="busy" @click="ouvrirRejet(e)">
              Rejeter
            </UButton>
          </div>
        </div>
      </li>
    </ol>

    <p v-if="!etapes.length && demande.statut !== 'annulee'" class="text-sm text-muted">Aucune étape de validation pour ce type.</p>

    <UModal v-model:open="rejetOpen" title="Rejeter la demande">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Motif du rejet" name="commentaire" required>
            <UTextarea v-model="rejetComment" placeholder="Expliquez le rejet (3 caractères min.)" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="rejetOpen = false">Annuler</UButton>
            <UButton color="error" :loading="busy" @click="confirmerRejet">Rejeter</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
