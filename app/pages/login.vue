<script setup lang="ts">
import { loginSchema, type LoginInput } from "~/schemas/auth";
import { branding } from "~/constants/branding";
import type { FormSubmitEvent } from "@nuxt/ui";

definePageMeta({ layout: "auth" });

const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const state = reactive<Partial<LoginInput>>({ email: "", password: "" });
const loading = ref(false);

async function onSubmit(event: FormSubmitEvent<LoginInput>) {
  loading.value = true;
  try {
    await auth.login(event.data);
    toast.add({
      title: "Connexion réussie",
      description: auth.user?.name ? `Bienvenue, ${auth.user.name}` : undefined,
      color: "success",
      icon: "i-lucide-circle-check",
    });
    await navigateTo("/");
  } catch (err) {
    handleError(err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center gap-2 ">
      <img :src="branding.logo" :alt="branding.logoAlt" class="size-20">
      <span class="font-semibold text-highlighted lg:hidden">{{ branding.name }}</span>
    </div>

    <div>
      <h1 class="text-2xl font-bold text-highlighted">Connexion</h1>
      <p class="mt-1 text-sm text-muted">Accédez à votre espace {{ branding.shortName }}</p>
    </div>

    <UForm :schema="loginSchema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Email" name="email">
        <UInput
          v-model="state.email"
          type="email"
          placeholder="vous@artf.cg"
          icon="i-lucide-mail"
          size="lg"
          :disabled="loading"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Mot de passe" name="password">
        <UInput
          v-model="state.password"
          type="password"
          placeholder="••••••••"
          icon="i-lucide-lock"
          size="lg"
          :disabled="loading"
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        block
        size="lg"
        :loading="loading"
        :label="loading ? 'Connexion…' : 'Se connecter'"
      />
    </UForm>
  </div>
</template>
