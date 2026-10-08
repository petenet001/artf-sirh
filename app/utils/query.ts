/**
 * Booléens de query string → `1` / `0`.
 *
 * Les filtres de liste du backend (`HasFilterScope`) font un `where($cle,
 * $valeur)` brut : `?actif=true` compare la **chaîne** `"true"` à une colonne
 * booléenne stockée en `1`/`0` — aucune ligne en SQLite, et en MySQL `"true"`
 * vaut `0`, donc on obtiendrait les éléments **inactifs**. `1`/`0` est la
 * seule forme comprise partout (y compris par `! empty()` côté PHP).
 */
export function normaliserQuery<T extends Record<string, unknown>>(query: T | undefined): T | undefined {
  if (!query) return query;
  let change = false;
  const sortie: Record<string, unknown> = {};
  for (const [cle, valeur] of Object.entries(query)) {
    if (typeof valeur === "boolean") {
      sortie[cle] = valeur ? 1 : 0;
      change = true;
    } else {
      sortie[cle] = valeur;
    }
  }
  return change ? (sortie as T) : query;
}
