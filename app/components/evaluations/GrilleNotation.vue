<script setup lang="ts">
import type { Evaluation } from "~/schemas/evaluation";
import type { QuestionEvaluation } from "~/schemas/question-evaluation";
import { CRITERES_ORDRE, CRITERE_LABEL, CRITERE_TOTAL } from "~/constants/evaluations";

/**
 * Grille de notation (CCN art. 63) : 24 critères répartis en trois familles —
 * compétence professionnelle /10, assiduité /3, relations sociales /7.
 *
 * ⚠️ Le backend note **un critère par appel** (`POST …/noter`) et renvoie la
 * fiche recalculée : on enregistre donc ligne par ligne, à la sortie du champ,
 * puis on demande à la page de recharger la fiche (`saved`) pour récupérer la
 * note globale, la mention et le statut.
 */
const props = defineProps<{ evaluation: Evaluation; editable?: boolean }>();
const emit = defineEmits<{ saved: [] }>();

const api = useEvaluationsApi();
const handleError = useApiError();
const toast = useToast();

// Grille active : un critère désactivé n'est plus notable (422), mais reste
// visible s'il porte déjà une note (historique de la fiche).
const { data, pending, error } = useAsyncData("questions-evaluation-actives", () =>
  useQuestionsEvaluationApi().list({ actif: true }),
);

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
const busyId = ref<number | null>(null);

watchEffect(() => {
  for (const q of questions.value) {
    const note = notesParQuestion.value.get(q.id);
    saisie[q.id] = note?.note_obtenue;
    commentaires[q.id] = note?.commentaire ?? "";
  }
});

/** Enregistre une ligne si sa valeur a changé (et reste dans le barème). */
async function enregistrer(q: QuestionEvaluation) {
  const valeur = saisie[q.id];
  if (valeur == null) return;

  const initiale = notesParQuestion.value.get(q.id);
  if (initiale && initiale.note_obtenue === valeur && (initiale.commentaire ?? "") === commentaires[q.id]) return;

  if (valeur > q.bareme_max) {
    toast.add({ title: `Note supérieure au barème (${q.bareme_max}).`, color: "error" });
    saisie[q.id] = initiale?.note_obtenue;
    return;
  }

  busyId.value = q.id;
  try {
    await api.noter(props.evaluation.id, {
      question_id: q.id,
      note_obtenue: valeur,
      commentaire: commentaires[q.id]?.trim() || null,
    });
    emit("saved");
  } catch (err) {
    handleError(err);
    saisie[q.id] = initiale?.note_obtenue;
  } finally {
    busyId.value = null;
  }
}

const nbNotes = computed(() => questions.value.filter((q) => saisie[q.id] != null).length);
</script>

<template>
  <BaseDataState :pending="pending" :error="error" :empty="!questions.length" empty-label="Aucun critère actif dans la grille">
    <div class="space-y-6">
      <p v-if="editable" class="text-sm text-muted">
        {{ nbNotes }} critère(s) noté(s) sur {{ questions.length }}. Chaque note est enregistrée
        dès que vous quittez le champ.
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
                @blur="enregistrer(q)"
              />
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <UInputNumber
                v-if="editable"
                v-model="saisie[q.id]"
                :min="0"
                :max="q.bareme_max"
                :step="0.1"
                :disabled="busyId === q.id"
                class="w-28"
                @blur="enregistrer(q)"
              />
              <span v-else class="text-sm font-medium text-highlighted">
                {{ saisie[q.id] != null ? saisie[q.id] : "—" }}
              </span>
              <span class="w-12 text-right text-xs text-muted">/ {{ q.bareme_max }}</span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </BaseDataState>
</template>
