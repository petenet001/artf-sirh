/**
 * Rafraîchit la session au démarrage de l'application.
 *
 * ## Pourquoi c'est nécessaire
 *
 * Le store persiste l'utilisateur (rôles et permissions compris) dans le
 * navigateur. Tant qu'on ne se déconnectait pas, ces droits restaient **figés
 * à la dernière connexion** : après un changement de rôle côté serveur — la
 * vague F en a rebattu toutes les cartes — le front continuait d'afficher des
 * menus devenus interdits, et chaque clic finissait en 403.
 *
 * La note backend contournait le problème en demandant à l'utilisateur de se
 * déconnecter puis de se reconnecter. Ce n'est pas à lui de le savoir : on
 * relit `/user` au chargement, et les droits sont à jour sans rien demander.
 *
 * ## Ce que le plugin ne fait pas
 *
 * Il n'échoue **jamais bruyamment**. Si l'appel casse, deux cas :
 * - token invalide → le client HTTP a déjà nettoyé la session et redirigé ;
 * - réseau ou serveur indisponible → on garde les droits persistés plutôt que
 *   d'éjecter quelqu'un dont la session est probablement encore bonne. Le
 *   premier appel réel tranchera.
 */
export default defineNuxtPlugin(async () => {
  const token = useAuthToken();
  if (!token.value) return;

  try {
    await useAuthStore().fetchSession();
  } catch {
    // Silencieux par construction — cf. ci-dessus.
  }
});
