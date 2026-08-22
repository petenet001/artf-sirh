<script setup lang="ts">
import type { NavigationMenuItem, DropdownMenuItem } from "@nuxt/ui";

/**
 * Sous-navigation **dans la page** : les destinations du module courant, sous
 * forme de pastilles (pills). Les entrées à enfants (ex. Structure, Référentiels
 * de l'Administration) deviennent des menus déroulants. Rendue par `BasePanel`,
 * elle n'apparaît que si le module a plus d'une destination.
 */
// `nav` est déjà filtré par les règles de visibilité des sous-onglets
// (`navGates`) : un onglet réservé n'apparaît pas ici.
const { nav } = useModules();
const route = useRoute();

const items = computed<NavigationMenuItem[]>(() => nav.value.flat());

/** On masque la sous-nav pour les modules mono-page (ex. Tableau de bord). */
const show = computed(() => {
  const leaves = items.value.flatMap((i) => (i.children?.length ? i.children : [i]));
  return leaves.length > 1;
});

function isActive(to: unknown): boolean {
  return typeof to === "string" && (route.path === to || route.path.startsWith(`${to}/`));
}
function groupActive(item: NavigationMenuItem): boolean {
  return isActive(item.to) || (item.children ?? []).some((c) => isActive(c.to));
}
function toDropdown(children: NavigationMenuItem[]): DropdownMenuItem[] {
  return children.map((c) => ({ label: String(c.label ?? ""), icon: c.icon, to: c.to as string }));
}

const pill = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors";
const idle = "text-muted hover:bg-elevated hover:text-default";
const on = "bg-primary/10 text-primary";
</script>

<template>
  <nav v-if="show" class="flex flex-wrap items-center gap-1.5">
    <template v-for="item in items" :key="String(item.label)">
      <UDropdownMenu
        v-if="item.children?.length"
        :items="[toDropdown(item.children as NavigationMenuItem[])]"
      >
        <button type="button" :class="[pill, groupActive(item) ? on : idle]">
          <UIcon v-if="item.icon" :name="item.icon" class="size-4" />
          {{ item.label }}
          <UIcon name="i-lucide-chevron-down" class="size-3.5 opacity-70" />
        </button>
      </UDropdownMenu>

      <NuxtLink
        v-else
        :to="item.to as string"
        :class="[pill, isActive(item.to) ? on : idle]"
      >
        <UIcon v-if="item.icon" :name="item.icon" class="size-4" />
        {{ item.label }}
      </NuxtLink>
    </template>
  </nav>
</template>
