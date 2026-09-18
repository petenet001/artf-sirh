<script setup lang="ts">
import type { TachePostIntegration } from "~/api/dossiers";

/**
 * Checklist post-intégration (note FE §3).
 *
 * Une fois le dossier `INTEGRE`, il reste des gestes à poser : acte, matricule,
 * compte, affectation, prise de service… Le front suit le **chemin B** — on
 * intègre dès la validation DG, et le dossier ne change plus de statut. Sans
 * cette liste, rien ne rappelle ce qui reste : le dossier a l'air terminé alors
 * qu'il manque un matricule ou un compte.
 *
 * Deux règles de lecture, posées par la note :
 *
 * 1. **seules les tâches `obligatoire: true` comptent** dans l'avancement. Les
 *    étapes 14 et 15 (affectation, nomination) sont facultatives : les compter
 *    donnerait un dossier éternellement incomplet ;
 * 2. l'`endpoint` renvoyé par l'API est une **indication de traçabilité**, pas
 *    un bouton. Chaque geste a déjà son point d'entrée dans la page — le
 *    dupliquer ici créerait deux chemins pour le même acte.
 */
const props = defineProps<{ dossierId: number }>();

const api = useDossiersApi();

const { data, pending, error } = useAsyncData(
  () => `taches-post-integration-${props.dossierId}`,
  () => api.tachesPostIntegration(props.dossierId),
  { watch: [() => props.dossierId] },
);

const taches = computed<TachePostIntegration[]>(() => data.value?.data ?? []);
const rappel = computed(() => data.value?.rappel ?? null);

/** Avancement sur les seules tâches obligatoires (cf. note FE §3). */
const obligatoires = computed(() => taches.value.filter((t) => t.obligatoire));
const faites = computed(() => obligatoires.value.filter((t) => t.statut === "fait").length);
const total = computed(() => obligatoires.value.length);
const complet = computed(() => total.value > 0 && faites.value === total.value);

/** Les facultatives, à part : elles informent sans peser sur l'avancement. */
const facultatives = computed(() => taches.value.filter((t) => !t.obligatoire));
</script>

<template>
  <div>
    <BaseDataState :pending="pending" :error="error">
      <div v-if="taches.length" class="space-y-5">
        <!-- Avancement : le chiffre d'abord, la barre ensuite. -->
        <div class="rounded-xl border border-default bg-default p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <BaseCardTitle
              icon="i-lucide-list-checks"
              title="Ce qu'il reste à faire"
            />
            <UBadge :color="complet ? 'success' : 'warning'" variant="subtle">
              {{ faites }} / {{ total }} obligatoire{{ total > 1 ? "s" : "" }}
            </UBadge>
          </div>

          <p v-if="rappel" class="mt-1 text-sm text-muted">{{ rappel }}</p>

          <div class="mt-4">
            <VizJauge :valeur="faites" :total="total" unite="tâches" />
          </div>
        </div>

        <!-- Tâches obligatoires -->
        <ul class="space-y-2">
          <li
            v-for="tache in obligatoires"
            :key="tache.etape"
            class="flex items-start gap-3 rounded-xl border border-default bg-default p-4"
          >
            <UIcon
              :name="tache.statut === 'fait' ? 'i-lucide-circle-check' : 'i-lucide-circle-dashed'"
              class="mt-0.5 size-5 shrink-0"
              :class="tache.statut === 'fait' ? 'text-success' : 'text-warning'"
            />
            <div class="min-w-0 flex-1">
              <p
                class="text-sm font-medium"
                :class="tache.statut === 'fait' ? 'text-muted line-through' : 'text-highlighted'"
              >
                {{ tache.label }}
              </p>
              <p class="mt-0.5 text-xs text-dimmed">Étape {{ tache.etape }}</p>
            </div>
          </li>
        </ul>

        <!-- Facultatives : visibles, mais clairement hors décompte. -->
        <div v-if="facultatives.length">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Facultatif — ne bloque pas la finalisation
          </p>
          <ul class="space-y-2">
            <li
              v-for="tache in facultatives"
              :key="tache.etape"
              class="flex items-start gap-3 rounded-xl border border-dashed border-default p-4"
            >
              <UIcon
                :name="tache.statut === 'fait' ? 'i-lucide-circle-check' : 'i-lucide-circle'"
                class="mt-0.5 size-5 shrink-0"
                :class="tache.statut === 'fait' ? 'text-success' : 'text-dimmed'"
              />
              <div class="min-w-0 flex-1">
                <p class="text-sm" :class="tache.statut === 'fait' ? 'text-muted' : 'text-toned'">
                  {{ tache.label }}
                </p>
                <p class="mt-0.5 text-xs text-dimmed">Étape {{ tache.etape }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <p v-else class="py-8 text-center text-sm text-muted">
        Aucune tâche post-intégration pour ce dossier.
      </p>
    </BaseDataState>
  </div>
</template>
