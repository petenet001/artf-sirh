<script setup lang="ts">
// UApp fournit les configs globales requises par Toast, Tooltip et les overlays.
</script>

<template>
  <UApp :toaster="{ position: 'bottom-right' }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
