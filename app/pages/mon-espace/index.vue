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

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UPageCard
          v-for="carte in cartes"
          :key="carte.key"
          :title="carte.label"
          :description="carte.description"
          :icon="carte.icon"
          :to="carte.to"
        />
      </div>
    </div>
  </BasePanel>
</template>
