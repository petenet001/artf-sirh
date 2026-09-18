import { messageErreur } from "~/utils/httpErreur";

/**
 * Transforme une erreur d'appel API en notification utilisateur.
 * Point unique de gestion : les composants appellent `handle(err)` dans
 * leur `catch` au lieu de dupliquer la logique de toast.
 *
 * Le choix du message vit dans `utils/httpErreur` — pur, et testé : c'est là
 * que se joue la distinction entre « vous n'avez pas le droit » et « quelque
 * chose a cassé », que l'utilisateur ne doit jamais confondre.
 */
export function useApiError() {
  const toast = useToast();

  return function handle(err: unknown): void {
    toast.add(messageErreur(err));
  };
}
