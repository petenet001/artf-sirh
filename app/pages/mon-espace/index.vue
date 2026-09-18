<script setup lang="ts">
import { cartesVisibles } from "~/constants/mon-espace";

/**
 * Espace personnel : atterrissage par défaut de tout compte, et **seul** endroit
 * où l'on agit sur son propre dossier plutôt que sur celui des autres.
 *
 * Les cartes ne s'affichent que si elles mènent quelque part : la plupart des
 * écrans personnels supposent un `agent_id` sur le compte (un compte purement
 * administratif n'a ni congés, ni carrière, ni dossier).
 */
const auth = useAuthStore();

/** Un compte sans agent rattaché n'a pas de dossier personnel à consulter. */
const estAgent = computed(() => !!auth.user?.agent_id);

const cartes = computed(() =>
  cartesVisibles({ estAgent: estAgent.value, can: (p) => auth.can(p) }),
);

/**
 * Ce qui réclame l'attention : une pastille sur la carte concernée, et un
 * bandeau en tête quand une **action** est attendue. Le bandeau n'apparaît que
 * pour les actions — l'annoncer aussi pour de simples notifications non lues
 * le viderait de son sens en une semaine.
 */
const { alertes, actions } = useAlertesMonEspace();

const greeting = ref("Bonjour");
onMounted(() => {
  const h = new Date().getHours();
  greeting.value = h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
});
</script>

<template>
  <BasePanel title="Mon espace" icon="i-lucide-user-round">
    <div class="space-y-6">
      <!-- Salutation -->
      <div class="relative overflow-hidden rounded-4xl border border-primary bg-primary p-6 text-inverted sm:p-8">
        <!-- Décor : mêmes formes que le panneau de connexion (disques très
             translucides + grande icône filigranée), non cliquables. -->
        <div class="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-white/5" />
        <div class="pointer-events-none absolute -bottom-24 -left-12 size-72 rounded-full bg-white/5" />
        <UIcon
          name="i-lucide-user-round"
          class="pointer-events-none absolute -bottom-8 right-10 size-40 text-white/5"
        />

        <div class="relative z-10">
          <div class="mb-4 h-1.5 w-14 rounded-full bg-secondary" />
          <h1 class="text-2xl font-bold sm:text-3xl">
            {{ greeting }}{{ auth.user?.name ? `, ${auth.user.name}` : "" }} 👋
          </h1>
          <p class="mt-1.5 text-sm text-inverted/70 sm:text-base">
            Bienvenue dans votre espace personnel.
          </p>
        </div>
      </div>

      <!-- Ce qui vous attend : seulement les actions, jamais les simples infos. -->
      <div
        v-if="actions.length"
        class="rounded-xl border border-warning/40 bg-warning/5 p-5"
      >
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-bell-ring" class="mt-0.5 size-5 shrink-0 text-warning" />
          <div class="min-w-0">
            <p class="font-medium text-highlighted">
              {{ actions.length > 1 ? "Des éléments attendent votre intervention" : "Un élément attend votre intervention" }}
            </p>
            <ul class="mt-1 space-y-0.5 text-sm text-muted">
              <li v-for="action in actions" :key="action.libelle">{{ action.libelle }}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <!--
          `UPageCard` ne porte pas de pastille : on l'enveloppe plutôt que de
          réécrire la carte, pour que la grille reste celle de tous les écrans.
        -->
        <div v-for="carte in cartes" :key="carte.key" class="relative">
          <!--
            Pastille posée à la main plutôt que `UChip` : ce dernier s'ancre sur
            le contenu de son slot, et un slot vide le laisserait flotter.
          -->
          <span
            v-if="alertes[carte.key]"
            class="pointer-events-none absolute right-3 top-3 z-10 flex items-center justify-center rounded-full text-xs font-bold text-inverted ring-2 ring-default"
            :class="[
              alertes[carte.key]!.ton === 'action' ? 'bg-warning' : 'bg-primary',
              alertes[carte.key]!.compte ? 'min-w-5 px-1.5 py-0.5' : 'size-2.5',
            ]"
            :title="alertes[carte.key]!.libelle"
          >
            <template v-if="alertes[carte.key]!.compte">{{ alertes[carte.key]!.compte }}</template>
            <span class="sr-only">{{ alertes[carte.key]!.libelle }}</span>
          </span>

          <UPageCard
            :title="carte.label"
            :description="carte.description"
            :icon="carte.icon"
            :to="carte.to"
            :class="alertes[carte.key]?.ton === 'action' ? 'ring-1 ring-warning/40' : undefined"
          />

          <!-- La pastille attire l'œil ; cette ligne dit pourquoi. -->
          <p
            v-if="alertes[carte.key]"
            class="mt-1.5 flex items-start gap-1.5 px-1 text-xs"
            :class="alertes[carte.key]!.ton === 'action' ? 'text-warning' : 'text-muted'"
          >
            <UIcon
              :name="alertes[carte.key]!.ton === 'action' ? 'i-lucide-circle-alert' : 'i-lucide-mail'"
              class="mt-px size-3.5 shrink-0"
            />
            {{ alertes[carte.key]!.libelle }}
          </p>
        </div>
      </div>
    </div>
  </BasePanel>
</template>
