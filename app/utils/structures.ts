import type { StructurableType } from "~/constants/entite";

/**
 * Résolution de l'organigramme côté front : à quelle direction / service /
 * bureau appartient un agent, et cet agent est-il dans un périmètre donné ?
 *
 * ## Pourquoi ce calcul existe ici
 *
 * `GET /personnel/agents` renvoie, par agent, `affectation_active.structurable_type`
 * et `structurable_id` — **ni le nom de la structure, ni ses parents**. Et la
 * route n'accepte aucun filtre de structure (`nom`, `prenom`, `matricule`,
 * `statut`, `genre`, `type_integration_id` seulement).
 *
 * Or un compte du métier RH porte `consulter-agents-global` : le serveur lui
 * renvoie **tout l'effectif**, sans moyen de demander « seulement ma
 * structure ». Distinguer les deux se fait donc ici, à partir de deux
 * référentiels légers (`/bureaux`, `/services`) qui portent la filiation.
 *
 * ⚠️ **C'est un filtre de confort, jamais une frontière de sécurité.** Le
 * cloisonnement reste serveur (vague F) : ce code ne protège rien, il range.
 * Le jour où l'API acceptera `direction_id` / `service_id` / `bureau_id` — comme
 * `/reporting/effectifs` le fait déjà — la logique de rangement descendra côté
 * serveur et seule la tuyauterie changera.
 *
 * Les règles ci-dessous sont le miroir exact de `HasBureauScope::scopeMaStructure`.
 */

export const TYPE_DIRECTION: StructurableType = "App\\Models\\Direction";
export const TYPE_SERVICE: StructurableType = "App\\Models\\Service";
export const TYPE_BUREAU: StructurableType = "App\\Models\\Bureau";

export interface StructureSimple {
  id: number;
  nom: string;
  sigle?: string | null;
}

export interface ReferentielsStructure {
  directions: StructureSimple[];
  services: (StructureSimple & { direction_id?: number | null })[];
  bureaux: (StructureSimple & { service_id?: number | null })[];
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

const REF_VIDE: ReferentielsStructure = { directions: [], services: [], bureaux: [] };

/** Nom court d'une structure : son sigle s'il existe, sinon son nom. */
function court(s?: StructureSimple | null): string | null {
  return s ? (s.sigle || s.nom) : null;
}

/**
 * Chaîne ascendante d'un rattachement.
 *
 * Un agent peut être affecté à n'importe quel niveau : au bureau (le cas
 * courant), mais aussi directement au service ou à la direction. On remonte
 * donc depuis le niveau réel, sans supposer qu'il y a toujours un bureau.
 */
export function chaineStructure(
  rattachement: Rattachement | null | undefined,
  ref: ReferentielsStructure = REF_VIDE,
): { bureau?: StructureSimple; service?: StructureSimple; direction?: StructureSimple } {
  const type = rattachement?.structurable_type;
  const id = rattachement?.structurable_id;
  if (!type || id == null) return {};

  if (type === TYPE_BUREAU) {
    const bureau = ref.bureaux.find((b) => b.id === id);
    const service = bureau?.service_id != null
      ? ref.services.find((s) => s.id === bureau.service_id)
      : undefined;
    const direction = service?.direction_id != null
      ? ref.directions.find((d) => d.id === service.direction_id)
      : undefined;
    return { bureau, service, direction };
  }

  if (type === TYPE_SERVICE) {
    const service = ref.services.find((s) => s.id === id);
    const direction = service?.direction_id != null
      ? ref.directions.find((d) => d.id === service.direction_id)
      : undefined;
    return { service, direction };
  }

  if (type === TYPE_DIRECTION) {
    return { direction: ref.directions.find((d) => d.id === id) };
  }

  return {};
}

/**
 * Libellé d'affectation, du plus large au plus précis : « D.R.H.L · S.R.H · B.P ».
 *
 * Rendre la chaîne entière et non le seul niveau d'affectation : « B.P » seul
 * ne dit rien à qui ne connaît pas l'organigramme par cœur, et c'est
 * précisément la personne qui a besoin de cette colonne.
 */
export function libelleStructure(
  rattachement: Rattachement | null | undefined,
  ref: ReferentielsStructure = REF_VIDE,
): string {
  const { bureau, service, direction } = chaineStructure(rattachement, ref);
  const parts = [court(direction), court(service), court(bureau)].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  // Rattachement connu mais référentiel pas encore chargé : on ne prétend pas
  // que l'agent n'est affecté nulle part, ce serait faux.
  return rattachement?.structurable_id != null ? "…" : "Non affecté";
}

/**
 * Le rattachement tombe-t-il dans le périmètre ?
 *
 * Miroir de `scopeMaStructure` : un périmètre de service couvre le service
 * lui-même **et tous ses bureaux** ; un périmètre de direction couvre la
 * direction, ses services et leurs bureaux. Un périmètre de bureau ne couvre
 * que lui — un agent rattaché directement au service en est dehors, ce qui est
 * exact : il n'est pas dans ce bureau.
 */
export function dansPerimetre(
  rattachement: Rattachement | null | undefined,
  perimetre: Perimetre | null,
  ref: ReferentielsStructure = REF_VIDE,
): boolean {
  if (!perimetre) return true; // pas de périmètre = pas de restriction
  const chaine = chaineStructure(rattachement, ref);

  if (perimetre.type === TYPE_BUREAU) return chaine.bureau?.id === perimetre.id;
  if (perimetre.type === TYPE_SERVICE) return chaine.service?.id === perimetre.id;
  return chaine.direction?.id === perimetre.id;
}

/**
 * Périmètre d'un utilisateur rattaché à un bureau, selon son niveau.
 *
 * Le niveau vient de la fonction (`bureau` / `service` / `direction`), comme
 * côté serveur : on remonte donc l'organigramme depuis son bureau jusqu'au
 * niveau voulu. Renvoie `null` si l'utilisateur n'est rattaché nulle part, ou
 * si la remontée échoue faute de filiation — mieux vaut pas de périmètre qu'un
 * périmètre faux.
 */
export function perimetreDepuisBureau(
  bureauId: number | null | undefined,
  niveau: "bureau" | "service" | "direction",
  ref: ReferentielsStructure = REF_VIDE,
): Perimetre | null {
  if (bureauId == null) return null;

  if (niveau === "bureau") return { type: TYPE_BUREAU, id: bureauId };

  const bureau = ref.bureaux.find((b) => b.id === bureauId);
  const service = bureau?.service_id != null
    ? ref.services.find((s) => s.id === bureau.service_id)
    : undefined;
  if (!service) return null;

  if (niveau === "service") return { type: TYPE_SERVICE, id: service.id };

  return service.direction_id != null ? { type: TYPE_DIRECTION, id: service.direction_id } : null;
}

/** Libellé du périmètre, pour l'étiquette du sélecteur. */
export function libellePerimetre(
  perimetre: Perimetre | null,
  ref: ReferentielsStructure = REF_VIDE,
): string | null {
  if (!perimetre) return null;
  const source = perimetre.type === TYPE_BUREAU
    ? ref.bureaux
    : perimetre.type === TYPE_SERVICE
      ? ref.services
      : ref.directions;
  return court(source.find((s) => s.id === perimetre.id)) ?? null;
}

// ── Navigation dans son sous-arbre ───────────────────────────────────────────

/**
 * Ce qu'un utilisateur peut **parcourir**, et non plus seulement ce qu'il voit.
 *
 * La hiérarchie n'est pas binaire. Un chef de bureau ne voit que son bureau, et
 * il n'y a rien en dessous : lui proposer un filtre serait du bruit. Un chef de
 * service voit son service entier **et** doit pouvoir descendre bureau par
 * bureau. Un directeur descend service puis bureau. Le métier RH, lui, part de
 * l'ARTF entière et descend les trois niveaux.
 *
 * On modélise donc un **sous-arbre** : une racine (le périmètre de la personne,
 * `null` pour une vue globale) et les niveaux strictement en dessous. Les
 * niveaux au-dessus ou à côté n'existent pas pour elle — les afficher
 * grisés reviendrait à montrer une porte fermée.
 */
export interface OptionsStructure {
  directions: StructureSimple[];
  /** Services du sous-arbre ; restreints à `directionId` s'il est fourni. */
  services: (StructureSimple & { direction_id?: number | null })[];
  /** Bureaux du sous-arbre ; restreints à `serviceId` s'il est fourni. */
  bureaux: (StructureSimple & { service_id?: number | null })[];
}

/** Les services d'une direction. */
function servicesDe(directionId: number, ref: ReferentielsStructure) {
  return ref.services.filter((s) => s.direction_id === directionId);
}

/** Les bureaux d'un service. */
function bureauxDe(serviceId: number, ref: ReferentielsStructure) {
  return ref.bureaux.filter((b) => b.service_id === serviceId);
}

/**
 * Niveaux offerts au parcours, sous la racine et sous la sélection en cours.
 *
 * Une liste vide signifie « ce niveau n'existe pas pour vous » : la page n'en
 * affiche alors aucun contrôle. C'est ce qui fait qu'un chef de bureau ne voit
 * aucun filtre, sans qu'on ait à coder son cas séparément.
 */
export function optionsStructure(
  racine: Perimetre | null,
  selection: { directionId?: number | null; serviceId?: number | null },
  ref: ReferentielsStructure = REF_VIDE,
): OptionsStructure {
  // Vue globale : tout l'organigramme est parcourable.
  if (!racine) {
    const services = selection.directionId
      ? servicesDe(selection.directionId, ref)
      : ref.services;
    const bureaux = selection.serviceId
      ? bureauxDe(selection.serviceId, ref)
      : selection.directionId
        ? services.flatMap((s) => bureauxDe(s.id, ref))
        : ref.bureaux;
    return { directions: ref.directions, services, bureaux };
  }

  if (racine.type === TYPE_DIRECTION) {
    const services = servicesDe(racine.id, ref);
    const bureaux = selection.serviceId
      ? bureauxDe(selection.serviceId, ref)
      : services.flatMap((s) => bureauxDe(s.id, ref));
    // Pas de niveau « direction » : c'est la sienne, il n'y a rien à choisir.
    return { directions: [], services, bureaux };
  }

  if (racine.type === TYPE_SERVICE) {
    return { directions: [], services: [], bureaux: bureauxDe(racine.id, ref) };
  }

  // Racine bureau : rien en dessous.
  return { directions: [], services: [], bureaux: [] };
}

/**
 * Périmètre effectivement appliqué : le nœud le plus profond choisi, sinon la
 * racine. Choisir un service après avoir choisi une direction affine ; ne rien
 * choisir laisse voir tout ce à quoi on a droit.
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
