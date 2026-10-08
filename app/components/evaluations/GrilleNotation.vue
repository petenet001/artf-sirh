<script setup lang="ts">
import type { Evaluation } from "~/schemas/evaluation";
import type { QuestionEvaluation } from "~/schemas/question-evaluation";
import { CRITERES_ORDRE, CRITERE_LABEL, CRITERE_TOTAL } from "~/constants/evaluations";

/**
 * Grille de notation (CCN art. 63) : 24 critères répartis en trois familles —
 * compétence professionnelle /10, assiduité /3, relations sociales /7.
 *
 * ⚠️ Le backend note **un critère par appel** (`POST …/noter`) et renvoie la
 * fiche recalculée (notes, note globale, mention, statut). On enregistre donc
 * ligne par ligne, à la sortie du champ, et on transmet cette fiche à la page
 * (`saved`) : elle la recolle dans l'état, **sans refetch**. Recharger la fiche
 * à chaque critère vidait l'écran et reconstruisait la grille à chaque frappe.
 *
 * Le retour se joue donc au niveau de la ligne : un témoin d'enregistrement,
 * puis une coche brève. Rien ne bouge ailleurs, et le champ garde le focus.
 */
const props = defineProps<{ evaluation: Evaluation; editable?: boolean }>();
const emit = defineEmits<{ saved: [fiche: Evaluation] }>();

const api = useEvaluationsApi();
const handleError = useApiError();
const toast = useToast();

// Grille active : un critère désactivé n'est plus notable (422), mais reste
// visible s'il porte déjà une note (historique de la fiche).
const { data, pending, error } = useAsyncData("questions-evaluation-actives", () =>
  useQuestionsEvaluationApi().list({ actif: true }),
);

// La grille est lue sur une route de référentiel. Si elle est refusée (403),
// le notateur doit savoir pourquoi le formulaire n'apparaît pas, plutôt que de
// voir « Impossible de charger les données ».
const grilleRefusee = computed(() => (error.value as { statusCode?: number } | null)?.statusCode === 403);

const notesParQuestion = computed(
  () => new Map((props.evaluation.notes ?? []).map((n) => [n.question_id, n])),
);

/** Critères à afficher : la grille active + ceux déjà notés hors grille. */
const questions = computed<QuestionEvaluation[]>(() => {
  const actives = data.value?.data ?? [];
  const connues = new Set(actives.map((q) => q.id));
  const archivees = (props.evaluation.notes ?? [])
    .filter((n) => n.question && !connues.has(n.question_id))
    .map((n) => n.question!);
  return [...actives, ...archivees].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
});

const parFamille = computed(() =>
  CRITERES_ORDRE.map((famille) => ({
    famille,
    label: CRITERE_LABEL[famille],
    total: CRITERE_TOTAL[famille],
    questions: questions.value.filter((q) => q.type_critere === famille),
    obtenu: questions.value
      .filter((q) => q.type_critere === famille)
      .reduce((sum, q) => sum + (notesParQuestion.value.get(q.id)?.note_obtenue ?? 0), 0),
  })).filter((g) => g.questions.length > 0),
);

// Saisie locale : valeur affichée par critère (`undefined` = non noté).
const saisie = reactive<Record<number, number | undefined>>({});
const commentaires = reactive<Record<number, string>>({});
/** Lignes en cours d'enregistrement, et lignes tout juste enregistrées. */
const enregistrement = ref<number | null>(null);
const confirmees = reactive<Record<number, boolean>>({});
/** Ligne que le notateur est en train de saisir : jamais réécrite sous ses doigts. */
const enEdition = ref<number | null>(null);

/**
 * Synchronise la saisie avec les notes du serveur.
 *
 * `watch` et non `watchEffect` : on ne veut réagir qu'à un vrai changement de
 * notes, et surtout pas réécrire la ligne en cours de frappe — c'est ce qui
 * faisait sauter la valeur sous le curseur quand la fiche revenait du serveur.
 */
watch(
  [questions, notesParQuestion],
  () => {
    for (const q of questions.value) {
      if (q.id === enEdition.value) continue;
      const note = notesParQuestion.value.get(q.id);
      saisie[q.id] = note?.note_obtenue;
      commentaires[q.id] = note?.commentaire ?? "";
    }
  },
  { immediate: true },
);

/** Coche de confirmation : visible assez pour être vue, pas plus. */
const minuteries = new Map<number, ReturnType<typeof setTimeout>>();
function confirmer(id: number) {
  confirmees[id] = true;
  clearTimeout(minuteries.get(id));
  minuteries.set(id, setTimeout(() => (confirmees[id] = false), 2000));
}
onBeforeUnmount(() => minuteries.forEach((m) => clearTimeout(m)));

/** Enregistre une ligne si sa valeur a changé (et reste dans le barème). */
async function enregistrer(q: QuestionEvaluation) {
  enEdition.value = null;
  const initiale = notesParQuestion.value.get(q.id);
  const suite = suiteSaisieNote({
    valeur: saisie[q.id],
    commentaire: commentaires[q.id] ?? "",
    bareme: q.bareme_max,
    initiale,
  });

  if (suite === "ignorer") return;
  if (suite === "hors-bareme") {
    toast.add({ title: `Note supérieure au barème (${q.bareme_max}).`, color: "error" });
    saisie[q.id] = initiale?.note_obtenue;
    return;
  }

  enregistrement.value = q.id;
  try {
    const { data: fiche } = await api.noter(props.evaluation.id, {
      question_id: q.id,
      note_obtenue: saisie[q.id]!,
      commentaire: commentaires[q.id]?.trim() || null,
    });
    confirmer(q.id);
    // La page recolle cette fiche dans son état : pas de rechargement.
    emit("saved", fiche);
  } catch (err) {
    handleError(err);
    saisie[q.id] = initiale?.note_obtenue;
    commentaires[q.id] = initiale?.commentaire ?? "";
  } finally {
    enregistrement.value = null;
  }
}

const nbNotes = computed(() => questions.value.filter((q) => saisie[q.id] != null).length);
</script>

<template>
  <UAlert
    v-if="grilleRefusee"
    color="warning"
    variant="subtle"
    icon="i-lucide-lock"
    title="Grille de critères inaccessible avec votre compte"
    description="L'API refuse la lecture de la grille (403) : la route exige actuellement la permission « creer-evaluations », que les notateurs (N+1) n'ont pas. Correction attendue côté backend."
  />
  <BaseDataState
    v-else
    :pending="pending"
    :error="error"
    :empty="!questions.length"
    empty-label="Aucun critère actif dans la grille"
  >
    <div class="space-y-6">
      <p v-if="editable" class="text-sm text-muted">
        {{ nbNotes }} critère(s) noté(s) sur {{ questions.length }}. Chaque note est enregistrée
        dès que vous quittez le champ — la page ne se recharge pas.
      </p>

      <section v-for="groupe in parFamille" :key="groupe.famille" class="rounded-xl border border-default">
        <header class="flex items-center justify-between gap-3 border-b border-default px-4 py-3">
          <h3 class="text-sm font-semibold text-highlighted">{{ groupe.label }}</h3>
          <span class="text-sm text-muted">
            {{ groupe.obtenu.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) }} / {{ groupe.total }}
          </span>
        </header>

        <ul class="divide-y divide-default">
          <li v-for="q in groupe.questions" :key="q.id" class="flex flex-wrap items-start gap-3 px-4 py-3">
            <div class="min-w-0 flex-1">
              <p class="text-sm text-highlighted">{{ q.libelle }}</p>
              <p v-if="!editable && commentaires[q.id]" class="mt-0.5 text-xs text-muted">
                « {{ commentaires[q.id] }} »
              </p>
              <UInput
                v-else-if="editable"
                v-model="commentaires[q.id]"
                size="xs"
                variant="none"
                placeholder="Commentaire (facultatif)"
                class="mt-0.5 w-full px-0"
                @focus="enEdition = q.id"
                @blur="enregistrer(q)"
              />
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <!-- Le champ reste actif pendant l'appel : le désactiver déplacerait
                   le focus et casserait la tabulation d'un critère au suivant. -->
              <UInputNumber
                v-if="editable"
                v-model="saisie[q.id]"
                :min="0"
                :max="q.bareme_max"
                :step="0.1"
                class="w-28"
                @focus="enEdition = q.id"
                @blur="enregistrer(q)"
              />
              <span v-else class="text-sm font-medium text-highlighted">
                {{ saisie[q.id] != null ? saisie[q.id] : "—" }}
              </span>
              <span class="w-12 text-right text-xs text-muted">/ {{ q.bareme_max }}</span>
              <!-- Retour d'enregistrement, au niveau de la ligne concernée. -->
              <span v-if="editable" class="flex w-4 justify-center">
                <UIcon
                  v-if="enregistrement === q.id"
                  name="i-lucide-loader-circle"
                  class="size-4 animate-spin text-muted"
                  aria-label="Enregistrement en cours"
                />
                <UIcon
                  v-else-if="confirmees[q.id]"
                  name="i-lucide-check"
                  class="size-4 text-success"
                  aria-label="Note enregistrée"
                />
              </span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </BaseDataState>
</template>
