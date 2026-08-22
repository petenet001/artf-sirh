<script setup lang="ts">
/**
 * La grille de modules a été retirée : `/` n'affiche plus rien, il **redirige**
 * vers le premier module autorisé (le tableau de bord, ou l'espace perso pour un
 * agent simple). Le middleware `auth.global` gère déjà la redirection ; ceci en
 * est le filet de sécurité côté client.
 */
const { landing } = useModules();
onMounted(() => navigateTo(landing.value, { replace: true }));
</script>

<template>
  <div class="flex h-64 items-center justify-center text-muted">
    <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
  </div>
</template>
