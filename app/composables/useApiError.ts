import type { ApiError } from "~/types/api";

/**
 * Transforme une erreur d'appel API en notification utilisateur.
 * Point unique de gestion : les composants appellent `handle(err)` dans
 * leur `catch` au lieu de dupliquer la logique de toast.
 *
 * Les erreurs de validation (422) sont aplaties : on affiche le premier
 * message de champ remonté par Laravel, à défaut le message global.
 */
export function useApiError() {
  const toast = useToast();

  return function handle(err: unknown): void {
    const data = (err as { data?: ApiError })?.data;
    const firstFieldError = data?.errors
      ? Object.values(data.errors)[0]?.[0]
      : undefined;

    toast.add({
      title: firstFieldError ?? data?.message ?? "Une erreur est survenue",
      color: "error",
      icon: "i-lucide-alert-triangle",
    });
  };
}
