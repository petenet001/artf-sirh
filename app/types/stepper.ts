/** Étape d'un formulaire multi-étapes (`BaseStepperForm`). */
export interface StepperStep {
  key: string;
  title: string;
  description?: string;
  icon?: string;
  /**
   * Illustration de la colonne de droite (chemin servi depuis `public/`,
   * ex. `/illustrations/identite.svg`). Absente : la colonne se rabat sur une
   * composition décorative construite avec `icon`.
   */
  illustration?: string;
  /** Noms des champs validés avant de quitter l'étape. */
  fields?: string[];
}
