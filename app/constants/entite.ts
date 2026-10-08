import { STRUCTURABLE_TYPES } from "~/constants/enums";

/** Type polymorphe de structure porté par une affectation. */
export type StructurableType = (typeof STRUCTURABLE_TYPES)[number];

/** Libellé lisible d'un type de structure. */
export const ENTITE_LABEL: Record<StructurableType, string> = {
  "App\\Models\\Direction": "Direction",
  "App\\Models\\Service": "Service",
  "App\\Models\\Bureau": "Bureau",
};

/** Le type polymorphe reçu est-il une structure connue ? */
export function estStructurable(type?: string | null): type is StructurableType {
  return !!type && (STRUCTURABLE_TYPES as readonly string[]).includes(type);
}

/**
 * Niveau d'entité qu'un responsable pilote : l'ARTF entière pour le DG, sinon
 * sa direction, son service ou son bureau.
 */
export type NiveauEntite = "artf" | "direction" | "service" | "bureau";

/**
 * Rôles qui font d'un compte le **responsable** d'une entité, du plus large au
 * plus fin. Mêmes rôles que `User::niveauCloisonnement()` côté API.
 *
 * On s'appuie sur le rôle, pas sur le poste de la nomination : le poste est du
 * texte libre, et la reprise gestRHdb n'a créé aucune nomination. Le rôle, lui,
 * est porté par la session et lu sans requête — la garde de route peut donc
 * appliquer exactement la même règle que le menu.
 */
export const ROLES_RESPONSABLE: readonly { role: string; niveau: NiveauEntite }[] = [
  { role: "directeur-general", niveau: "artf" },
  { role: "directeur", niveau: "direction" },
  { role: "chef-service", niveau: "service" },
  { role: "chef-bureau", niveau: "bureau" },
];

/** Niveau piloté d'après les rôles (le plus large l'emporte), ou `null`. */
export function niveauEntite(roles: readonly string[]): NiveauEntite | null {
  return ROLES_RESPONSABLE.find((r) => roles.includes(r.role))?.niveau ?? null;
}

/** Libellé du rôle de responsable, pour les messages. */
export const LIBELLE_NIVEAU_ENTITE: Record<NiveauEntite, string> = {
  artf: "directeur général",
  direction: "directeur",
  service: "chef de service",
  bureau: "chef de bureau",
};

/** Type de structure qu'un responsable doit avoir pour affectation. */
export const TYPE_DU_NIVEAU: Record<Exclude<NiveauEntite, "artf">, StructurableType> = {
  direction: "App\\Models\\Direction",
  service: "App\\Models\\Service",
  bureau: "App\\Models\\Bureau",
};

/**
 * Portées dérivées de la session (cf. `ModuleGate.anyScope`). Une seule
 * fonction pour le menu **et** la garde de route : si elles divergent, un lien
 * visible mène à un refus.
 */
export function porteesSession(roles: readonly string[]): string[] {
  return niveauEntite(roles) ? ["entite"] : [];
}

/** Ce que l'on sait de l'entité d'un compte. */
export type ResolutionEntite =
  /** Pas de rôle de responsable. */
  | { etat: "aucune" }
  /** Le DG : toute l'ARTF, sans dépendre de son affectation. */
  | { etat: "artf" }
  /** Responsable d'une structure, cohérente avec son rôle. */
  | { etat: "structure"; niveau: Exclude<NiveauEntite, "artf">; type: StructurableType; id: number }
  /** Rôle de responsable, mais aucune affectation active exploitable. */
  | { etat: "sans-affectation"; niveau: Exclude<NiveauEntite, "artf"> }
  /** Rôle et affectation ne sont pas au même niveau (ex. chef de bureau affecté à une direction). */
  | { etat: "incoherente"; niveau: Exclude<NiveauEntite, "artf">; type: StructurableType; id: number };

/**
 * Résout l'entité pilotée à partir des rôles et de l'affectation active.
 *
 * Règle prudente quand rôle et affectation se contredisent : on n'ouvre rien.
 * Prendre l'affectation donnerait toute une direction à un chef de bureau ;
 * prendre le rôle supposerait un bureau que l'on ne connaît pas.
 */
export function resoudreEntite(
  roles: readonly string[],
  affectation?: { structurable_type?: string | null; structurable_id?: number | null } | null,
): ResolutionEntite {
  const niveau = niveauEntite(roles);
  if (!niveau) return { etat: "aucune" };
  if (niveau === "artf") return { etat: "artf" };

  const type = affectation?.structurable_type;
  const id = affectation?.structurable_id;
  if (!estStructurable(type) || id == null) return { etat: "sans-affectation", niveau };

  return type === TYPE_DU_NIVEAU[niveau]
    ? { etat: "structure", niveau, type, id }
    : { etat: "incoherente", niveau, type, id };
}
