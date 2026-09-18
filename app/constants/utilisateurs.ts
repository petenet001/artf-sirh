import { ROLES_RH } from "~/constants/roles";
import type { VUES_PERSONNEL } from "~/constants/enums";
import type { BadgeColor } from "~/constants/carriere";

export type { BadgeColor } from "~/constants/carriere";

/**
 * Lecture d'un compte utilisateur : ses rôles, son périmètre.
 *
 * Deux choses qu'un écran d'administration doit rendre évidentes, parce que la
 * vague F les a rendues subtiles :
 *
 * 1. **un compte cumule souvent plusieurs rôles** — `directeur` + `rh`, ou
 *    `agent` + `rh-formation`. Afficher « le » rôle serait faux ;
 * 2. **le rattachement à un bureau ne donne rien, il retire.** C'est un
 *    périmètre de lecture, pas une permission. Le formuler à l'envers est
 *    l'erreur d'administration la plus facile à commettre.
 */

/** Familles de rôles, pour colorer sans inventer une couleur par rôle. */
export type FamilleRole = "systeme" | "rh" | "hierarchie" | "agent";

/** Périmètre effectif sur le personnel, tel que le serveur le calcule. */
export type VuePersonnel = (typeof VUES_PERSONNEL)[number];

const ROLES_SYSTEME = ["admin"];
const ROLES_HIERARCHIE = ["directeur-general", "directeur", "chef-service", "chef-bureau"];

export function familleRole(nom: string): FamilleRole {
  if (ROLES_SYSTEME.includes(nom)) return "systeme";
  if ((ROLES_RH as readonly string[]).includes(nom)) return "rh";
  if (ROLES_HIERARCHIE.includes(nom)) return "hierarchie";
  return "agent";
}

export const COULEUR_FAMILLE_ROLE: Record<FamilleRole, BadgeColor> = {
  systeme: "error",
  rh: "primary",
  hierarchie: "secondary",
  agent: "neutral",
};

/** Libellés lisibles : `rh-affaires-sociales` ne se lit pas à l'écran. */
export const LIBELLE_ROLE: Record<string, string> = {
  admin: "Administrateur",
  rh: "RH (généraliste)",
  "rh-personnel": "Bureau Personnel",
  "rh-solde": "Bureau Solde",
  "rh-formation": "Bureau Formation",
  "rh-affaires-sociales": "Bureau Affaires sociales",
  "rh-etude": "Bureau Étude et Planification",
  "directeur-general": "Directeur général",
  directeur: "Directeur",
  "chef-service": "Chef de service",
  "chef-bureau": "Chef de bureau",
  agent: "Agent",
};

export function libelleRole(nom: string): string {
  return LIBELLE_ROLE[nom] ?? nom;
}

/**
 * Périmètre déduit de la **fonction** — miroir de `User::niveauCloisonnement()`.
 *
 * ⚠️ Repli uniquement. Le serveur renvoie désormais `vue_personnel`, qui fait
 * autorité : depuis `consulter-agents-global`, un compte peut être rattaché à un
 * bureau **et** voir tout l'effectif, ce que cette fonction ne peut pas savoir.
 * Elle ne sert qu'aux réponses d'une API antérieure, sans `vue_personnel`.
 */
export function niveauCloisonnement(roles: string[]): "direction" | "service" | "bureau" {
  if (roles.includes("directeur") || roles.includes("directeur-general")) return "direction";
  if (roles.includes("chef-service")) return "service";
  return "bureau";
}

export const LIBELLE_NIVEAU = {
  globale: "tout le personnel",
  direction: "sa direction",
  service: "son service",
  bureau: "son bureau",
} as const;

/**
 * Le compte échappe-t-il au cloisonnement sur le personnel ?
 *
 * Miroir de `User::voitPersonnelGlobal()` : `admin`, ou le porteur de
 * `consulter-agents-global`. La permission n'étant pas toujours développée dans
 * la charge utile (`roles[].permissions` n'est chargé que sur certaines
 * routes), on retombe sur la liste de rôles que la note FE §2j énumère — le
 * métier RH transverse et la direction générale.
 */
export function voitPersonnelGlobal(user: {
  roles?: { name: string; permissions?: { name: string }[] }[] | null;
}): boolean {
  const roles = user.roles ?? [];
  const permissions = roles.flatMap((r) => r.permissions ?? []);
  if (permissions.length) {
    return permissions.some((p) => p.name === "consulter-agents-global");
  }
  const noms = roles.map((r) => r.name);
  return (
    noms.includes("admin")
    || noms.includes("directeur-general")
    || noms.some((n) => (ROLES_RH as readonly string[]).includes(n))
  );
}

/** Périmètre effectif d'un compte : le champ serveur, sinon le repli. */
export function vueEffective(
  user: { vue_personnel?: VuePersonnel | null; bureau_id?: number | null; roles?: { name: string }[] | null },
): VuePersonnel {
  if (user.vue_personnel) return user.vue_personnel;
  if (user.bureau_id == null) return "globale";
  return niveauCloisonnement(nomsRoles(user));
}

/**
 * Phrase décrivant ce que le compte voit réellement.
 *
 * Le cas à ne pas rater : un compte **rattaché à un bureau** qui voit malgré
 * tout tout l'effectif, parce qu'il porte `consulter-agents-global` (tout le
 * métier RH). Annoncer « ne voit que son bureau » serait faux, et c'est ce que
 * produisait une déduction depuis le seul rattachement.
 */
export function descriptionPerimetre(
  user: { vue_personnel?: VuePersonnel | null; bureau_id?: number | null; roles?: { name: string }[] | null },
): string {
  const vue = vueEffective(user);
  if (vue === "globale") {
    return user.bureau_id != null
      ? "Voit l'ensemble de l'ARTF : son rattachement à un bureau ne le restreint pas (métier RH transverse)."
      : "Voit l'ensemble de l'ARTF — aucun cloisonnement.";
  }
  return `Ne voit que les agents, congés, absences et dossiers de ${LIBELLE_NIVEAU[vue]}.`;
}

/** Noms des rôles d'un utilisateur, triés pour un affichage stable. */
export function nomsRoles(user: { roles?: { name: string }[] | null }): string[] {
  return (user.roles ?? []).map((r) => r.name).sort();
}

/**
 * Regroupement des permissions par domaine métier, pour l'écran des rôles.
 *
 * Une centaine de permissions listées à plat est illisible : on ne voit ni ce
 * qu'un rôle couvre, ni ce qui lui manque. Le préfixe de l'action
 * (`consulter-`, `creer-`, `gerer-`…) une fois retiré, le reste **est** le
 * domaine — c'est la convention de nommage du backend, on s'appuie dessus
 * plutôt que de maintenir une table qui dériverait au prochain ajout.
 */
const VERBES = [
  "consulter",
  "creer",
  "modifier",
  "supprimer",
  "gerer",
  "valider",
  "proposer",
  "prononcer",
  "decider",
  "acces",
];

/** `valider-conges` → `conges` ; `acces-bureau-solde` → `bureau-solde`. */
export function domainePermission(nom: string): string {
  const verbe = VERBES.find((v) => nom.startsWith(`${v}-`));
  return verbe ? nom.slice(verbe.length + 1) : nom;
}

/** Le verbe d'une permission, ou `null` si elle ne suit pas la convention. */
export function verbePermission(nom: string): string | null {
  return VERBES.find((v) => nom.startsWith(`${v}-`)) ?? null;
}

export interface GroupePermissions {
  domaine: string;
  permissions: { id: number; name: string }[];
}

/** Permissions groupées par domaine, domaines et permissions triés. */
export function grouperPermissions(
  permissions: { id: number; name: string }[],
): GroupePermissions[] {
  const par = new Map<string, { id: number; name: string }[]>();
  for (const p of permissions) {
    const domaine = domainePermission(p.name);
    if (!par.has(domaine)) par.set(domaine, []);
    par.get(domaine)!.push(p);
  }
  return [...par.entries()]
    .map(([domaine, perms]) => ({
      domaine,
      permissions: [...perms].sort((a, b) => a.name.localeCompare(b.name, "fr")),
    }))
    .sort((a, b) => a.domaine.localeCompare(b.domaine, "fr"));
}

/** Libellé lisible d'un domaine (`affaires-sociales` → « Affaires sociales »). */
export function libelleDomaine(domaine: string): string {
  const mots = domaine.replace(/-/g, " ");
  return mots.charAt(0).toUpperCase() + mots.slice(1);
}
