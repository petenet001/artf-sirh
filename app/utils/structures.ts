import type { StructurableType } from "~/constants/entite";

/**
 * Organigramme côté front : nommer la structure d'un agent, et dire s'il tombe
 * dans un périmètre donné.
 *
 * ## Ce que l'API donne, et ce qu'elle ne donne pas
 *
 * `GET /personnel/agents` renvoie, par agent, `affectation_active.structurable_type`
 * et `structurable_id` — un couple morphique, sans nom ni parent. Et la route
 * n'accepte aucun filtre de structure, alors qu'un compte du métier RH porte
 * `consulter-agents-global` et reçoit **tout l'effectif**.
 *
 * Deux besoins, deux sources :
 *
 * | Besoin | Source | Quand |
 * |---|---|---|
 * | **nommer** une structure | `/directions`, `/services`, `/bureaux` (listes plates) | au chargement |
 * | connaître sa **filiation** | `/directions/{id}/services`, `/services/{id}/bureaux` | à la demande |
 *
 * ⚠️ Les listes plates renvoient `StructureOrganisationnelleListResource`, soit
 * `{ id, nom, sigle }` : **ni `service_id`, ni `direction_id`**. La filiation ne
 * peut donc venir que des sous-routes parent → enfants, chargées au fil des
 * choix. C'est aussi la façon la plus naturelle de parcourir : on descend.
 *
 * ⚠️ **Filtre de confort, jamais frontière de sécurité.** Le cloisonnement reste
 * serveur (vague F) : ce code affine ce que le serveur a déjà envoyé, il
 * n'élargit rien et ne protège rien.
 */

export const TYPE_DIRECTION: StructurableType = "App\\Models\\Direction";
export const TYPE_SERVICE: StructurableType = "App\\Models\\Service";
export const TYPE_BUREAU: StructurableType = "App\\Models\\Bureau";

/** Une structure telle que les listes la renvoient. */
export interface StructureSimple {
  id: number;
  nom: string;
  sigle?: string | null;
}

/** Où un agent est affecté : le couple morphique tel que l'API le renvoie. */
export interface Rattachement {
  structurable_type?: string | null;
  structurable_id?: number | null;
}

/** Une cible de périmètre : un nœud de l'organigramme. */
export interface Perimetre {
  type: StructurableType;
  id: number;
}

/**
 * Filiation **connue** à un instant donné, construite au fil de la cascade.
 *
 * Les deux tables ne contiennent que les branches réellement chargées. Une
 * branche absente n'est pas « vide », elle est **inconnue** : les fonctions
 * ci-dessous ne concluent jamais à partir d'une absence.
 */
export interface ArbreConnu {
  directions: StructureSimple[];
  servicesParDirection: Map<number, StructureSimple[]>;
  bureauxParService: Map<number, StructureSimple[]>;
}

export function arbreVide(): ArbreConnu {
  return { directions: [], servicesParDirection: new Map(), bureauxParService: new Map() };
}

/** Nom court d'une structure : son sigle s'il existe, sinon son nom. */
export function court(s?: StructureSimple | null): string {
  return s ? (s.sigle || s.nom) : "";
}

/**
 * Index `id → structure` par type, pour nommer l'affectation d'un agent.
 *
 * Séparé de l'arbre : nommer ne demande que les listes plates, alors que la
 * filiation demande les sous-routes. Les deux ne se chargent pas au même
 * moment, et l'un ne doit pas attendre l'autre.
 */
export interface NomsStructures {
  directions: Map<number, StructureSimple>;
  services: Map<number, StructureSimple>;
  bureaux: Map<number, StructureSimple>;
}

export function indexerNoms(
  directions: StructureSimple[],
  services: StructureSimple[],
  bureaux: StructureSimple[],
): NomsStructures {
  const par = (liste: StructureSimple[]) => new Map(liste.map((s) => [s.id, s]));
  return { directions: par(directions), services: par(services), bureaux: par(bureaux) };
}

export function nomsVides(): NomsStructures {
  return { directions: new Map(), services: new Map(), bureaux: new Map() };
}

/** Service parent d'un bureau, s'il a été chargé. */
export function serviceDuBureau(
  bureauId: number,
  arbre: ArbreConnu,
  noms: NomsStructures,
): StructureSimple | null {
  for (const [serviceId, bureaux] of arbre.bureauxParService) {
    if (bureaux.some((b) => b.id === bureauId)) {
      return noms.services.get(serviceId) ?? { id: serviceId, nom: `Service nº ${serviceId}` };
    }
  }
  return null;
}

/** Direction parente d'un service, si elle a été chargée. */
export function directionDuService(
  serviceId: number,
  arbre: ArbreConnu,
  noms: NomsStructures,
): StructureSimple | null {
  for (const [directionId, services] of arbre.servicesParDirection) {
    if (services.some((s) => s.id === serviceId)) {
      return noms.directions.get(directionId) ?? { id: directionId, nom: `Direction nº ${directionId}` };
    }
  }
  return null;
}

/**
 * Libellé de la structure d'un agent.
 *
 * On affiche **le niveau réel** de son affectation, préfixé de ses parents
 * seulement s'ils sont connus. Prétendre à une chaîne complète supposerait une
 * filiation que les listes plates ne donnent pas ; masquer un nom qu'on possède
 * en attendant serait pire.
 */
export function libelleStructure(
  rattachement: Rattachement | null | undefined,
  noms: NomsStructures,
  arbre: ArbreConnu = arbreVide(),
): string {
  const type = rattachement?.structurable_type;
  const id = rattachement?.structurable_id;
  if (!type || id == null) return "Non affecté";

  if (type === TYPE_DIRECTION) {
    return court(noms.directions.get(id)) || `Direction nº ${id}`;
  }

  if (type === TYPE_SERVICE) {
    const nom = court(noms.services.get(id)) || `Service nº ${id}`;
    const direction = directionDuService(id, arbre, noms);
    return direction ? `${court(direction)} · ${nom}` : nom;
  }

  if (type === TYPE_BUREAU) {
    const nom = court(noms.bureaux.get(id)) || `Bureau nº ${id}`;
    const service = serviceDuBureau(id, arbre, noms);
    if (!service) return nom;
    const direction = directionDuService(service.id, arbre, noms);
    return [direction ? court(direction) : "", court(service), nom].filter(Boolean).join(" · ");
  }

  return "Non affecté";
}

/**
 * Le rattachement tombe-t-il dans le périmètre ?
 *
 * Miroir de `HasBureauScope::scopeMaStructure` : un service couvre lui-même
 * **et tous ses bureaux**, une direction couvre elle-même, ses services et
 * leurs bureaux, un bureau ne couvre que lui.
 *
 * La descendance vient de l'arbre **chargé**. Une branche non chargée exclut
 * l'agent plutôt que de l'inclure à tort : mieux vaut une liste visiblement
 * courte, que l'utilisateur corrige en remontant d'un niveau, qu'une liste qui
 * prétend appliquer un filtre sans le faire.
 */
export function dansPerimetre(
  rattachement: Rattachement | null | undefined,
  perimetre: Perimetre | null,
  arbre: ArbreConnu = arbreVide(),
): boolean {
  if (!perimetre) return true;

  const type = rattachement?.structurable_type;
  const id = rattachement?.structurable_id;
  if (!type || id == null) return false;

  if (perimetre.type === TYPE_BUREAU) {
    return type === TYPE_BUREAU && id === perimetre.id;
  }

  if (perimetre.type === TYPE_SERVICE) {
    if (type === TYPE_SERVICE) return id === perimetre.id;
    if (type === TYPE_BUREAU) {
      return (arbre.bureauxParService.get(perimetre.id) ?? []).some((b) => b.id === id);
    }
    return false;
  }

  // Périmètre de direction.
  if (type === TYPE_DIRECTION) return id === perimetre.id;

  const services = arbre.servicesParDirection.get(perimetre.id) ?? [];
  if (type === TYPE_SERVICE) return services.some((s) => s.id === id);
  return services.some((s) => (arbre.bureauxParService.get(s.id) ?? []).some((b) => b.id === id));
}

/**
 * Périmètre effectivement appliqué : le nœud le plus profond choisi, sinon la
 * racine. Ne rien choisir laisse voir tout ce à quoi on a droit.
 */
export function perimetreSelectionne(
  racine: Perimetre | null,
  selection: { directionId?: number | null; serviceId?: number | null; bureauId?: number | null },
): Perimetre | null {
  if (selection.bureauId) return { type: TYPE_BUREAU, id: selection.bureauId };
  if (selection.serviceId) return { type: TYPE_SERVICE, id: selection.serviceId };
  if (selection.directionId) return { type: TYPE_DIRECTION, id: selection.directionId };
  return racine;
}

// ── Options de sélecteur ─────────────────────────────────────────────────────

/**
 * Valeur de l'option « tous les… ».
 *
 * `undefined` semblait naturel, mais `USelect` passe la valeur telle quelle à
 * `SelectItem`, qui exige une valeur définie : l'option serait rendue sans
 * jamais être sélectionnable — on descendrait dans un bureau sans pouvoir
 * remonter. Aucune structure ne porte l'`id` 0.
 */
export const TOUTES_STRUCTURES = 0;

export interface OptionStructure {
  label: string;
  value: number;
}

/**
 * Options d'un niveau, précédées de son « tous ».
 *
 * Pas de regroupement : chaque niveau est déjà restreint à son parent par la
 * cascade, une liste de bureaux ne contient donc que ceux d'un seul service.
 */
export function optionsNiveau(structures: StructureSimple[], tous: string): OptionStructure[] {
  return [
    { label: tous, value: TOUTES_STRUCTURES },
    ...structures.map((s) => ({
      label: s.sigle ? `${s.sigle} — ${s.nom}` : s.nom,
      value: s.id,
    })),
  ];
}

/** Chaîne de rattachement de l'utilisateur, du bureau à la direction. */
export interface CheminRattachement {
  bureau: StructureSimple;
  service: StructureSimple | null;
  direction: StructureSimple | null;
}

/**
 * Chaîne lue dans la session (`user.bureau.service.direction`, servie par
 * `/user` depuis 2026-10-01). `undefined` sur `service` = relation non servie
 * (API antérieure) → `null`, pour que l'appelant retombe sur `GET /bureaux/{id}`.
 */
export function cheminDepuisSession(
  bureau:
    | (StructureSimple & { service?: (StructureSimple & { direction?: StructureSimple | null }) | null })
    | null
    | undefined,
): CheminRattachement | null {
  if (!bureau || bureau.service === undefined) return null;
  const service = bureau.service;
  return {
    bureau: { id: bureau.id, nom: bureau.nom, sigle: bureau.sigle },
    service: service ? { id: service.id, nom: service.nom, sigle: service.sigle } : null,
    direction: service?.direction ? { ...service.direction } : null,
  };
}
