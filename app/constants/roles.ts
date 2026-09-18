/**
 * Rôles applicatifs — miroir de `database/seeders/RoleSeeder.php`.
 *
 * ## Vague F : la DRHL est cloisonnée par bureau
 *
 * Le rôle `rh` généraliste (37 permissions) coexiste désormais avec **cinq
 * rôles de bureau**, chacun limité à son métier. Un agent de la DRHL reçoit son
 * rôle de bureau *en plus de*, ou *à la place de*, `rh` :
 *
 * | Rôle | Bureau | Porte |
 * |---|---|---|
 * | `rh-personnel` | B.P — Personnel | dossiers, carrière, congés, discipline |
 * | `rh-solde` | B.S. — Solde | salaires, paie |
 * | `rh-formation` | B.F — Formation | catalogue, plans, inscriptions |
 * | `rh-affaires-sociales` | B.A.S. — Affaires sociales | protection sociale, prestations |
 * | `rh-etude` | B.PL — Étude et Planification | reporting, conformité |
 *
 * ## Pourquoi ces constantes, et comment s'en servir
 *
 * Tester `hasRole("rh")` **enferme dehors** les cinq nouveaux rôles. Mais élargir
 * bêtement à `ROLES_RH` ouvrirait la paie au bureau Formation : les rôles de
 * bureau ne sont pas interchangeables.
 *
 * Règle appliquée dans `modules.ts` : on gate **par permission** dès que la
 * permission dit exactement la bonne chose (c'est presque toujours le cas
 * depuis la vague F, qui a justement découpé les permissions par bureau), et on
 * ne garde un test de rôle que là où aucune permission ne discrimine.
 *
 * `estRh()` sert aux écrans qui demandent « suis-je côté RH ? » sans viser un
 * bureau — l'aiguillage des files d'attente, par exemple.
 */

/** Le rôle généraliste et les cinq rôles de bureau DRHL. */
export const ROLES_RH = [
  "rh",
  "rh-personnel",
  "rh-solde",
  "rh-formation",
  "rh-affaires-sociales",
  "rh-etude",
] as const;

export type RoleRh = (typeof ROLES_RH)[number];

/** Les rôles RH plus `admin` — la liste à donner à un `anyRole` de module. */
export const ROLES_RH_ET_ADMIN = [...ROLES_RH, "admin"] as const;

/** Rôles hiérarchiques, porteurs d'un avis dans les circuits de validation. */
export const ROLES_HIERARCHIQUES = ["directeur", "chef-service", "chef-bureau"] as const;

/**
 * L'utilisateur est-il côté RH (n'importe quel bureau) ou administrateur ?
 *
 * À n'utiliser que pour un aiguillage d'écran. Pour autoriser une **action**,
 * tester la permission : c'est elle qui distingue un bureau d'un autre, et
 * c'est elle que le backend vérifie.
 */
export function estRh(hasRole: (role: string) => boolean): boolean {
  return hasRole("admin") || ROLES_RH.some((r) => hasRole(r));
}

/** Le bureau DRHL de rattachement cloisonne-t-il cet utilisateur ? */
export function estCloisonne(bureauId?: number | null): boolean {
  return bureauId != null;
}
