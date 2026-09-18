<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

/**
 * Barre de navigation horizontale **sticky** (remplace la sidebar). Alignée sur
 * le conteneur centré : marque à gauche, onglets = modules autorisés (soulignés
 * quand actifs), menu utilisateur à droite. Sur mobile, les onglets passent dans
 * un menu déroulant.
 */
const { tabs, active, landing } = useModules();

const mobileItems = computed<DropdownMenuItem[][]>(() => [
  tabs.value.map((m) => ({
    label: m.label,
    icon: m.icon,
    to: m.to,
  })),
]);

// Navbar transparente en haut de page, effet « glass » (fond translucide + flou)
// dès qu'on scrolle. Seuil bas pour un basculement immédiat.
const scrolled = ref(false);
function onScroll() {
  scrolled.value = window.scrollY > 4;
}
onMounted(() => {
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener("scroll", onScroll));
</script>

<template>
  <header class="sticky top-0 z-40 border-b transition-colors duration-300" :class="scrolled
    ? 'border-default bg-default/70 backdrop-blur-md supports-[backdrop-filter]:bg-default/60'
    : 'border-default/70 bg-default'">
    <div class="mx-auto flex h-16 max-w-full items-center gap-4 px-4 sm:px-6 lg:px-8">
      <!-- Marque → 1er module autorisé -->
      <NuxtLink :to="landing" class="flex shrink-0 items-center gap-2.5">
        <img src="/logo/Logo_Simple_Couleur.svg" alt="Logo ARTF" class="h-6 w-6" />
        <span class="text-lg font-bold tracking-tight text-blue-950"> SIRH</span>
      </NuxtLink>

      <!-- Onglets (desktop) -->
      <nav class="ms-4 hidden h-full items-stretch gap-1 md:flex">
        <NuxtLink v-for="m in tabs" :key="m.key" :to="m.to"
          class="relative flex items-center px-3 text-sm font-medium transition-colors "
          :class="active?.key === m.key ? 'text-highlighted' : 'text-muted hover:text-default'">
          {{ m.label }}
          <span v-if="active?.key === m.key" class="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
        </NuxtLink>
      </nav>

      <div class="ms-auto flex items-center gap-4">
        <!-- Onglets (mobile) -->
        <UDropdownMenu v-if="tabs.length" :items="mobileItems" :content="{ align: 'end' }" class="md:hidden">
          <UButton icon="i-lucide-menu" color="neutral" variant="ghost" :label="active?.label" />
        </UDropdownMenu>

        <AppPerimetreBadge />
        <AppNotificationsBell />
        <AppUserMenu />
      </div>
    </div>
  </header>
</template>
