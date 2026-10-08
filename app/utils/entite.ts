import type { StructurableType } from "~/constants/entite";
import type { AgentSummary } from "~/schemas/agent-summary";
import {
  TYPE_BUREAU,
  TYPE_DIRECTION,
  TYPE_SERVICE,
  court,
  type ArbreConnu,
  type Rattachement,
  type StructureSimple,
} from "~/utils/structures";

/**
 * « Mon entité » en arbre : chaque responsable voit son entité **en entier**,
 * de son niveau jusqu'en bas. Un directeur voit sa direction, ses services,
 * leurs bureaux, et les agents affectés à chacun de ces niveaux.
 *
 * L'API n'a pas de route « effectif d'une entité » : on assemble l'organigramme
 * (sous-routes parent → enfants) et les affectations actives, puis on range
 * chaque agent sous la structure où il est affecté.
 */

/** Type d'un nœud : une structure, ou l'ARTF entière (racine du DG). */
export type TypeNoeud = StructurableType | "artf";

export interface NoeudEntite {
  type: TypeNoeud;
  id: number;
  nom: string;
  sigle?: string | null;
  /** Agents affectés **directement** à ce nœud. */
  agents: AgentSummary[];
  enfants: NoeudEntite[];
  /** Effectif du nœud et de toute sa descendance. */
  total: number;
}

/** Racine de l'ARTF : pas une structure en base, d'où l'id 0. */
export const RACINE_ARTF: StructureSimple = { id: 0, nom: "ARTF", sigle: "ARTF" };

/** Affectation telle que la liste la renvoie : un rattachement et son agent. */
export interface AffectationAgent extends Rattachement {
  agent?: AgentSummary | null;
}

function cle(type: string, id: number): string {
  return `${type}#${id}`;
}

/** Agents par structure, sans doublon, triés par nom. */
function indexerAgents(affectations: readonly AffectationAgent[]): Map<string, AgentSummary[]> {
  const parCle = new Map<string, Map<number, AgentSummary>>();
  for (const a of affectations) {
    if (!a.agent || !a.structurable_type || a.structurable_id == null) continue;
    const k = cle(a.structurable_type, a.structurable_id);
    if (!parCle.has(k)) parCle.set(k, new Map());
    parCle.get(k)!.set(a.agent.id, a.agent);
  }

  const out = new Map<string, AgentSummary[]>();
  for (const [k, agents] of parCle) {
    out.set(
      k,
      [...agents.values()].sort((x, y) =>
        `${x.nom} ${x.prenom}`.localeCompare(`${y.nom} ${y.prenom}`, "fr"),
      ),
    );
  }
  return out;
}

/**
 * Construit l'arbre d'une entité.
 *
 * `filiation` ne contient que les branches chargées : une structure dont les
 * enfants n'ont pas été chargés est traitée comme une feuille. L'appelant doit
 * donc charger toute la descendance de la racine avant d'appeler.
 */
export function construireArbre(
  racine: { type: TypeNoeud; structure: StructureSimple },
  filiation: ArbreConnu,
  affectations: readonly AffectationAgent[],
): NoeudEntite {
  const agents = indexerAgents(affectations);

  function noeud(type: TypeNoeud, s: StructureSimple, enfants: NoeudEntite[]): NoeudEntite {
    const directs = type === "artf" ? [] : (agents.get(cle(type, s.id)) ?? []);
    const total = directs.length + enfants.reduce((n, e) => n + e.total, 0);
    return { type, id: s.id, nom: s.nom, sigle: s.sigle, agents: directs, enfants, total };
  }

  const bureau = (b: StructureSimple) => noeud(TYPE_BUREAU, b, []);
  const service = (s: StructureSimple) =>
    noeud(TYPE_SERVICE, s, (filiation.bureauxParService.get(s.id) ?? []).map(bureau));
  const direction = (d: StructureSimple) =>
    noeud(TYPE_DIRECTION, d, (filiation.servicesParDirection.get(d.id) ?? []).map(service));

  switch (racine.type) {
    case "artf":
      return noeud("artf", racine.structure, filiation.directions.map(direction));
    case TYPE_DIRECTION:
      return direction(racine.structure);
    case TYPE_SERVICE:
      return service(racine.structure);
    default:
      return bureau(racine.structure);
  }
}

/** Nombre de nœuds d'un type donné dans la descendance (racine exclue). */
export function compterStructures(racine: NoeudEntite, type: StructurableType): number {
  return racine.enfants.reduce(
    (n, e) => n + (e.type === type ? 1 : 0) + compterStructures(e, type),
    0,
  );
}

/** Une ligne de l'effectif complet : l'agent et le chemin de sa structure. */
export interface LigneEffectif {
  id: number;
  nom_complet: string;
  matricule: string;
  photo_path?: string | null;
  /** Chemin depuis la racine, en sigles : « D.R.H.L · S.P · B.P ». */
  structure: string;
}

/** Effectif complet de l'arbre, à plat, trié par nom. */
export function aplatirEffectif(racine: NoeudEntite): LigneEffectif[] {
  const lignes: LigneEffectif[] = [];

  function parcourir(n: NoeudEntite, chemin: string[]) {
    const ici = n.type === "artf" ? chemin : [...chemin, court(n)];
    for (const a of n.agents) {
      lignes.push({
        id: a.id,
        nom_complet: a.nom_complet ?? `${a.prenom} ${a.nom}`,
        matricule: a.matricule ?? "",
        photo_path: a.photo_path,
        structure: ici.join(" · "),
      });
    }
    n.enfants.forEach((e) => parcourir(e, ici));
  }

  parcourir(racine, []);
  return lignes.sort((x, y) => x.nom_complet.localeCompare(y.nom_complet, "fr"));
}

/** Identifiants de tous les agents de l'arbre. */
export function idsAgents(racine: NoeudEntite): Set<number> {
  const ids = new Set<number>();
  const parcourir = (n: NoeudEntite) => {
    n.agents.forEach((a) => ids.add(a.id));
    n.enfants.forEach(parcourir);
  };
  parcourir(racine);
  return ids;
}
