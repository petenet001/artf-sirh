<script setup lang="ts">
import { ENTITE_LABEL, type StructurableType } from "~/constants/entite";
import type { NoeudEntite } from "~/utils/entite";

/**
 * Une structure de « Mon entité », repliable : ses agents directs, puis ses
 * sous-structures, chacune repliable à son tour. Récursif jusqu'au bureau.
 */
const props = defineProps<{ noeud: NoeudEntite }>();

const type = computed(() =>
  props.noeud.type === "artf" ? "ARTF" : ENTITE_LABEL[props.noeud.type as StructurableType],
);

function pluriel(n: number, mot: string): string {
  return `${n} ${mot}${n > 1 ? "s" : ""}`;
}
</script>

<template>
  <UCollapsible class="rounded-lg border border-default">
    <template #default="{ open }">
      <button
        type="button"
        class="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-elevated/50"
      >
        <UIcon
          name="i-lucide-chevron-right"
          class="size-4 shrink-0 text-dimmed transition-transform"
          :class="open && 'rotate-90'"
        />
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium text-highlighted">
            {{ noeud.sigle ? `${noeud.sigle} — ${noeud.nom}` : noeud.nom }}
          </p>
          <p class="text-xs text-muted">{{ type }}</p>
        </div>
        <UBadge color="neutral" variant="subtle">{{ pluriel(noeud.total, "agent") }}</UBadge>
      </button>
    </template>

    <template #content>
      <div class="space-y-3 border-t border-default px-4 py-3">
        <div v-if="noeud.agents.length" class="flex flex-col divide-y divide-default">
          <BaseGroupRow
            v-for="agent in noeud.agents"
            :key="agent.id"
            :name="agent.nom_complet ?? `${agent.prenom} ${agent.nom}`"
            :role="agent.matricule ?? 'Matricule non assigné'"
            :src="agent.photo_path"
            :to="`/personnel/agents/${agent.id}`"
          />
        </div>
        <p v-else-if="!noeud.enfants.length" class="text-sm text-muted">
          Aucun agent affecté à cette structure.
        </p>

        <div v-if="noeud.enfants.length" class="space-y-2">
          <EntiteNoeud v-for="enfant in noeud.enfants" :key="`${enfant.type}-${enfant.id}`" :noeud="enfant" />
        </div>
      </div>
    </template>
  </UCollapsible>
</template>
