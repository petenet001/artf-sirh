<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

/**
 * Menu utilisateur de la navbar : avatar circulaire (initiales) déclenchant un
 * menu (espace perso, profil, déconnexion). Calé sur la maquette : pastille
 * claire teintée en `primary`, sans chevron, pensée pour un fond clair.
 */
const auth = useAuthStore();

const initials = computed(() => {
  const parts = (auth.user?.name ?? "").trim().split(/\s+/).filter(Boolean);
  return (parts.map((p) => p[0]).slice(0, 2).join("") || "?").toUpperCase();
});

const items = computed<DropdownMenuItem[][]>(() => [
  [{ label: auth.user?.name ?? "Compte", avatar: { text: initials.value }, type: "label" }],
  // Espace perso et profil sont ouverts à tout utilisateur authentifié.
  [
    { label: "Mon espace", icon: "i-lucide-user-round", to: "/mon-espace" },
    { label: "Mon profil", icon: "i-lucide-user", to: "/profil" },
  ],
  [
    {
      label: "Se déconnecter",
      icon: "i-lucide-log-out",
      color: "error",
      onSelect: () => auth.logout(),
    },
  ],
]);
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end', side: 'bottom' }" :ui="{ content: 'w-56' }">
    <button
      type="button"
      class="flex items-center rounded-full ring-1 ring-default transition-colors hover:ring-accented"
      :aria-label="auth.user?.name ?? 'Compte'"
    >
      <UAvatar
        :text="initials"
        size="sm"
        :ui="{ root: 'bg-primary/10 text-primary', fallback: 'font-semibold' }"
      />
    </button>
  </UDropdownMenu>
</template>
