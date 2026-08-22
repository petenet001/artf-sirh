import { defineStore } from "pinia";
import type { User, LoginInput } from "~/schemas/auth";

/**
 * État de session global. Pinia est utilisé ICI car la session est partagée
 * par toute l'application (header, gardes, permissions).
 */
export const useAuthStore = defineStore(
  "auth",
  () => {
    const user = ref<User | null>(null);
    const isAuthenticated = computed(() => !!user.value);

    /** Permissions effectives = permissions directes + celles des rôles. */
    const permissions = computed(() => {
      const direct = user.value?.permissions?.map((p) => p.name) ?? [];
      const viaRoles =
        user.value?.roles?.flatMap((r) => r.permissions?.map((p) => p.name) ?? []) ?? [];
      return [...new Set([...direct, ...viaRoles])];
    });

    function can(permission: string): boolean {
      return permissions.value.includes(permission);
    }

    function hasRole(role: string): boolean {
      return user.value?.roles?.some((r) => r.name === role) ?? false;
    }

    async function login(credentials: LoginInput) {
      const authApi = useAuthApi();
      const token = useAuthToken(); // capturé avant l'await (contexte Nuxt)
      const { data } = await authApi.login(credentials);
      token.value = data.token;
      user.value = data.user; // l'API renvoie déjà l'utilisateur (roles.permissions)
    }

    async function fetchSession() {
      const authApi = useAuthApi();
      const { data } = await authApi.me();
      user.value = data;
    }

    async function logout() {
      try {
        await useAuthApi().logout();
      } finally {
        clearSession();
        await navigateTo("/login", { replace: true });
      }
    }

    function clearSession() {
      user.value = null;
      const token = useAuthToken();
      token.value = null;
    }

    return {
      user,
      isAuthenticated,
      permissions,
      can,
      hasRole,
      login,
      fetchSession,
      logout,
      clearSession,
    };
  },
  { persist: { pick: ["user"] } },
);
