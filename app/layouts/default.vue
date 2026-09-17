<script setup lang="ts">
/**
 * Chrome applicative calée sur la maquette de référence :
 * - **navbar** horizontale sticky, blanche, **pleine largeur** ;
 * - **surface de page** : conteneur centré (max 6xl) dans lequel vit tout le
 *   contenu.
 * Le fond teinté est posé sur `html`/`body` (assets/css/main.css) et non ici :
 * sur un div il serait coupé dès que la page dépasse la hauteur d'écran.
 * Toutes les pages authentifiées passent ici ; le login garde le layout `auth`.
 */
</script>

<template>
  <div class="min-h-screen">
    <AppNavbar />
    <div class="w-full px-4 pb-8 sm:px-6">
      <main class="mx-auto min-h-[calc(100vh-8rem)] max-w-6xl px-4 py-8 sm:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>
