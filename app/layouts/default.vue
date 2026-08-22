<script setup lang="ts">
/**
 * Chrome applicative calée sur la maquette de référence :
 * - **navbar** horizontale sticky, blanche, **pleine largeur** ;
 * - **surface de page** : grand panneau centré (max 1600px), arrondi, bordure
 *   fine et fond très légèrement teinté en `primary`, dans lequel vit tout le
 *   contenu. Le fond de la fenêtre, lui, reste blanc.
 * Toutes les pages authentifiées passent ici ; le login garde le layout `auth`.
 */
</script>

<template>
  <div class="min-h-screen bg-default">
    <AppNavbar />
    <div class=" w-full bg-primary/[0.03] h-screen px-4 pb-8 sm:px-6">
      <main
        class=" min-h-[calc(100vh-8rem)] mx-auto max-w-6xl px-4 py-8 sm:px-8"
      >
        <slot />
      </main>
    </div>
  </div>
</template>
