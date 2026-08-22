<script setup lang="ts">
import type { TypeIntegration } from "~/schemas/type-integration";

/**
 * Point d'entrée **unique** de l'arrivée d'une personne dans le SIRH.
 *
 * Parcours en deux temps, conforme au métier :
 *  1. **choisir le type d'intégration** (agent, stagiaire, consultant…) — c'est
 *     lui qui plante le décor : pièces à fournir, circuit de validation,
 *     préfixe de matricule, durée maximale ;
 *  2. **renseigner la fiche** (identité, coordonnées, carrière), puis
 *     **soumettre le dossier** : rien n'est « créé » définitivement, le dossier
 *     part en validation.
 */
const typesApi = useTypesIntegrationsApi();
const { data, pending, error } = useAsyncData("types-integrations-nouveau", () => typesApi.list());
const types = computed(() => data.value?.data ?? []);

const selectedId = ref<number>();
const selected = computed<TypeIntegration | undefined>(() =>
  types.value.find((t) => t.id === selectedId.value),
);

/** Étape courante : le choix du type conditionne l'affichage de la fiche. */
const step = ref<"type" | "fiche">("type");
</script>

<template>
  <BasePanel
    title="Nouvelle intégration"
    :subtitle="step === 'type'
      ? 'Choisissez le type d\'intégration : il détermine les pièces à fournir et le circuit de validation'
      : 'Renseignez la fiche, puis soumettez le dossier pour validation'"
  >
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/integration/dossiers">
        Retour
      </UButton>
    </template>

    <!-- Étape 1 : type d'intégration -->
    <BaseDataState
      v-if="step === 'type'"
      :pending="pending"
      :error="error"
      :empty="!types.length"
      empty-label="Aucun type d'intégration configuré"
    >
      <div class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            v-for="type in types"
            :key="type.id"
            type="button"
            class="rounded-xl border bg-default p-5 text-left shadow-sm transition"
            :class="selectedId === type.id
              ? 'border-primary ring-1 ring-primary'
              : 'border-default hover:border-primary/40 hover:shadow-md'"
            @click="selectedId = type.id"
          >
            <div class="flex items-start justify-between gap-3">
              <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <UIcon name="i-lucide-user-plus" class="size-5" />
              </span>
              <UIcon
                v-if="selectedId === type.id"
                name="i-lucide-circle-check"
                class="size-5 text-primary"
              />
            </div>

            <p class="mt-4 font-semibold text-highlighted">{{ type.nom }}</p>
            <p v-if="type.description" class="mt-1 line-clamp-2 text-sm text-muted">
              {{ type.description }}
            </p>
          </button>
        </div>

        <div class="flex justify-end">
          <UButton
            :disabled="!selectedId"
            trailing-icon="i-lucide-arrow-right"
            @click="step = 'fiche'"
          >
            Continuer
          </UButton>
        </div>
      </div>
    </BaseDataState>

    <!-- Étape 2 : fiche + soumission -->
    <div v-else class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default bg-default p-4">
        <div class="min-w-0">
          <p class="text-xs text-muted">Type d'intégration</p>
          <p class="font-medium text-highlighted">{{ selected?.nom }}</p>
        </div>
        <UButton color="neutral" variant="outline" icon="i-lucide-repeat" @click="step = 'type'">
          Changer de type
        </UButton>
      </div>

      <AgentsForm :type-integration-id="selectedId" />
    </div>
  </BasePanel>
</template>
