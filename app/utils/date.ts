/**
 * Affichage des dates.
 *
 * L'API renvoie des **chaînes** (`Y-m-d` ou ISO complet) et on ne les re-parse
 * jamais en date métier (cf. conventions §4) : ces fonctions ne servent qu'à
 * *afficher*. Elles renvoient toujours une chaîne — jamais `undefined` — et
 * `DATE_VIDE` quand la valeur est absente ou illisible, pour que les fiches
 * gardent un rendu régulier.
 *
 * Auto-importées (dossier `utils/`) : utilisables directement en template.
 */

/** Marque d'une date absente (même tiret que les autres valeurs vides). */
export const DATE_VIDE = "—";

const COURT = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
const LONG = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const MOIS_ANNEE = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const HEURE = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

/**
 * Chaîne API → `Date`, ou `null` si inexploitable.
 *
 * Une date **seule** (`2026-08-15`) est construite en heure *locale* : passer
 * par `new Date("2026-08-15")` l'interpréterait en UTC et afficherait la veille
 * dans tous les fuseaux négatifs.
 */
function parse(value?: string | number | null): Date | null {
  if (value == null || value === "") return null;

  if (typeof value === "string") {
    const jour = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (jour) return new Date(Number(jour[1]), Number(jour[2]) - 1, Number(jour[3]));
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `15/08/2026` — format dense, pour les tables et les listes. */
export function formatDate(value?: string | number | null): string {
  const date = parse(value);
  return date ? COURT.format(date) : DATE_VIDE;
}

/** `15 août 2026` — format lisible, pour les fiches et les en-têtes. */
export function formatDateLong(value?: string | number | null): string {
  const date = parse(value);
  return date ? LONG.format(date) : DATE_VIDE;
}

/** `août 2026` — quand seul le mois compte (regroupements, périodes de paie). */
export function formatMoisAnnee(value?: string | number | null): string {
  const date = parse(value);
  return date ? MOIS_ANNEE.format(date) : DATE_VIDE;
}

/** `15/08/2026 à 09:30` — horodatages (historique, décisions, comptes). */
export function formatDateTime(value?: string | number | null): string {
  const date = parse(value);
  return date ? `${COURT.format(date)} à ${HEURE.format(date)}` : DATE_VIDE;
}

/**
 * `il y a 3 jours` pour le passé récent, sinon la date courte. Pensé pour les
 * fils d'activité, où « quand » compte plus que la date exacte.
 * `now` est injectable pour rester testable.
 */
export function formatDateRelative(value?: string | number | null, now: Date = new Date()): string {
  const date = parse(value);
  if (!date) return DATE_VIDE;

  const secondes = Math.round((now.getTime() - date.getTime()) / 1000);
  if (secondes < 0) return formatDate(value); // dans le futur : pas de « il y a »
  if (secondes < 60) return "à l'instant";

  const minutes = Math.floor(secondes / 60);
  if (minutes < 60) return `il y a ${minutes} min`;

  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;

  const jours = Math.floor(heures / 24);
  if (jours === 1) return "hier";
  if (jours < 30) return `il y a ${jours} jours`;

  return formatDate(value);
}

/**
 * Période lisible à partir de deux bornes optionnelles :
 * `du 15/08/2026 au 20/09/2026`, `depuis le 15/08/2026`, `jusqu'au 20/09/2026`.
 */
export function formatPeriode(debut?: string | null, fin?: string | null): string {
  const d = parse(debut);
  const f = parse(fin);
  if (d && f) return `du ${formatDate(debut)} au ${formatDate(fin)}`;
  if (d) return `depuis le ${formatDate(debut)}`;
  if (f) return `jusqu'au ${formatDate(fin)}`;
  return DATE_VIDE;
}
