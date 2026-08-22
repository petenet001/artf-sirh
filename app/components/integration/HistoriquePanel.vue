<script setup lang="ts">
/** Onglet « Historique » : journal chronologique des actions sur le dossier. */
const props = defineProps<{ dossierId: number }>();

const dossiersApi = useDossiersApi();
const { data, pending, error } = useAsyncData(
  () => `histo-${props.dossierId}`,
  () => dossiersApi.historique(props.dossierId),
);
const entries = computed(() => data.value?.data ?? []);
</script>

<template>
  <BaseDataState :pending="pending" :error="error" :empty="!entries.length" empty-label="Aucun évènement enregistré">
    <ol class="space-y-1">
      <li v-for="(e, i) in entries" :key="e.id" class="flex gap-3">
        <div class="flex flex-col items-center">
          <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-elevated text-muted">
            <UIcon name="i-lucide-history" class="size-3.5" />
          </span>
          <span v-if="i < entries.length - 1" class="my-1 w-px flex-1 bg-default" />
        </div>
        <div class="flex-1 pb-4">
          <p class="text-sm font-medium text-highlighted">{{ e.action ?? "Évènement" }}</p>
          <p v-if="e.commentaire" class="mt-0.5 text-xs italic text-toned">« {{ e.commentaire }} »</p>
          <p class="mt-0.5 text-xs text-muted">
            <span v-if="e.utilisateur?.name">{{ e.utilisateur.name }}</span>
            <span v-if="e.created_at" :title="formatDateTime(e.created_at)"> · {{ formatDateRelative(e.created_at) }}</span>
          </p>
        </div>
      </li>
    </ol>
  </BaseDataState>
</template>
