import type { ApiError } from "~/types/api";

/**
 * Ce que le front doit faire d'une erreur HTTP — et comment le dire.
 *
 * Extrait du client HTTP et de `useApiError` pour une raison précise : la
 * confusion entre **401** et **403** a coûté des déconnexions inexpliquées.
 * Une règle qui a déjà été fausse mérite d'être écrite à un seul endroit, et
 * testée.
 */

/** Suite à donner à une réponse en erreur, côté session. */
export type ReactionSession = "deconnecter" | "conserver";

/**
 * Faut-il couper la session ?
 *
 * - **401** — le token ne vaut plus rien : il n'y a plus de session à conserver.
 * - **403** — la session est valide, il manque une permission. Déconnecter
 *   serait faux (l'utilisateur est bien qui il prétend être) et brutal (il perd
 *   sa place pour avoir cliqué au mauvais endroit).
 * - tout le reste — l'authentification n'est pas en cause.
 *
 * Seule exception : une 401 sur `/login` est un mot de passe refusé. Le
 * formulaire affiche déjà l'erreur ; rediriger vers lui-même effacerait le
 * message que l'utilisateur doit lire.
 */
export function reactionSession(statut: number | undefined, url?: string): ReactionSession {
  if (statut !== 401) return "conserver";
  // Le point d'entrée exact, pas un simple `includes` : une route qui
  // contiendrait « login » ailleurs dans son chemin ne doit pas hériter de
  // l'exception et laisser une vraie session morte en place.
  if (url && /\/login(?:[?#]|$)/.test(url)) return "conserver";
  return "deconnecter";
}

export interface MessageErreur {
  title: string;
  description?: string;
  color: "error" | "warning";
  icon: string;
}

/**
 * Message à présenter pour une erreur d'API.
 *
 * Trois cas méritent mieux que le message brut du serveur :
 *
 * - **403** — l'API répond `{"message":"Accès refusé."}`. Exact, mais muet :
 *   l'utilisateur ne sait ni pourquoi, ni quoi faire, et croit d'abord à une
 *   panne. On nomme la cause (les droits) et on rassure sur la session, qui
 *   reste ouverte ;
 * - **422** — validation : le premier message de champ est plus utile que le
 *   « Les données sont invalides » générique de Laravel ;
 * - **5xx ou pas de réponse** — le serveur n'a rien dit d'exploitable.
 *   Fabriquer un message métier serait trompeur : on dit que c'est technique.
 */
export function messageErreur(err: unknown): MessageErreur {
  const erreur = err as { status?: number; statusCode?: number; data?: ApiError };
  const statut = erreur?.status ?? erreur?.statusCode;
  const data = erreur?.data;

  if (statut === 403) {
    return {
      title: "Action non autorisée",
      description:
        "Votre compte n'a pas la permission nécessaire. Vous restez connecté ; "
        + "rapprochez-vous de l'administrateur si cet accès vous est nécessaire.",
      color: "warning",
      icon: "i-lucide-lock",
    };
  }

  // Un message vide n'est pas un message : Laravel en renvoie parfois, et le
  // laisser passer afficherait un toast muet.
  const messageServeur = data?.message?.trim() || undefined;

  const premierChamp = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined;
  if (premierChamp) {
    return { title: premierChamp, color: "error", icon: "i-lucide-alert-triangle" };
  }

  if (!messageServeur && (statut == null || statut >= 500)) {
    return {
      title: "Le serveur n'a pas répondu",
      description: "Réessayez dans un instant. Si cela persiste, signalez-le.",
      color: "error",
      icon: "i-lucide-server-off",
    };
  }

  return {
    title: messageServeur ?? "Une erreur est survenue",
    color: "error",
    icon: "i-lucide-alert-triangle",
  };
}
