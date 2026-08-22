import type { ApiResponse } from "~/types/api";
import type { LoginInput, LoginResponse, User } from "~/schemas/auth";

/**
 * Repository d'authentification.
 * Seul endroit qui connaît les routes /login, /logout, /user.
 */
export function useAuthApi() {
  const api = useApiClient();

  return {
    login: (body: LoginInput) =>
      api<ApiResponse<LoginResponse>>("/login", {
        method: "POST",
        body,
      }),

    logout: () => api("/logout", { method: "POST" }),

    me: () => api<ApiResponse<User>>("/user"),
  };
}
