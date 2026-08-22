<script setup lang="ts">
/**
 * Espace personnel de l'agent : atterrissage par défaut d'un utilisateur sans
 * module métier. Coquille pour l'instant — les écrans « Mes congés / Mes
 * absences » (self-service) arriveront dans une itération ultérieure.
 */
const auth = useAuthStore();

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
          title="Mon profil"
          description="Vos informations, rôles et permissions."
          icon="i-lucide-user"
          to="/profil"
        />
        <UPageCard
          title="Mes congés"
          description="Bientôt disponible."
          icon="i-lucide-calendar-check"
          class="pointer-events-none opacity-60"
        />
        <UPageCard
          title="Mes absences"
          description="Bientôt disponible."
          icon="i-lucide-calendar-x"
          class="pointer-events-none opacity-60"
        />
      </div>
    </div>
  </BasePanel>
</template>
