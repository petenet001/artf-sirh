/**
 * Libellés et visuels de marque affichés dans l'interface.
 *
 * **Source unique** : modifier ici change le texte partout (navbar, écran de
 * connexion). Ne pas réécrire ces libellés en dur dans un composant.
 */
export const branding = {
  /** Nom affiché à côté du logo (navbar, en-tête mobile du login). */
  name: "SIRH",
  /** Nom très court (panneau de marque du login). */
  shortName: "SIRH",
  /** Intitulé complet (titre du panneau de marque du login). */
  fullName: "Système d'Information des Ressources Humaines",
  /** Accroche sous l'intitulé complet. */
  tagline:
    "Gérez le personnel, les structures organisationnelles et l'intégration administrative de l'ARTF, en un seul endroit.",
  /** Mention de bas de page du panneau de marque. */
  copyright: "© ARTF — Tous droits réservés",
  /** Logo de la navbar (fichier servi depuis `public/`). */
  logo: "/logo/Logo_Simple_Couleur.svg",
  /** Texte alternatif du logo. */
  logoAlt: "ARTF",
} as const;
