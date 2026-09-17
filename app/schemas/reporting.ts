import { z } from "zod";
import { STATUTS_AGENT, GENRES } from "~/constants/enums";

/**
 * Module Reporting (D.6) — `GET /api/reporting/*`, permission `consulter-reporting`
 * (RH, admin et **DG**). Lecture seule.
 *
 * Toutes les répartitions partagent la même forme `{ cle, libelle, total }` :
 * l'API fournit déjà le libellé lisible, le front n'a aucun mapping à tenir.
 */
export const itemRepartitionSchema = z.object({
  cle: z.string(),
  libelle: z.string(),
  total: z.number(),
});

export type ItemRepartition = z.infer<typeof itemRepartitionSchema>;

/** Même forme, augmentée du cumul de jours (congés et absences par type). */
export const itemRepartitionJoursSchema = itemRepartitionSchema.extend({
  jours: z.number().optional(),
});

export type ItemRepartitionJours = z.infer<typeof itemRepartitionJoursSchema>;

/** Dernier lot de paie **clôturé**. `null` tant qu'aucun lot ne l'est. */
export const masseSalarialeSchema = z.object({
  lot_id: z.number(),
  annee: z.number(),
  mois: z.number(),
  periode: z.string(),
  total_gains: z.number(),
  total_retenues: z.number(),
  total_net: z.number(),
  nb_lignes: z.number(),
});

/**
 * `GET /reporting/dashboard`.
 *
 * ⚠️ **Effectif présent** = `actif` + `stagiaire` + `suspendu`. Les positions
 * conventionnelles (détachement, disponibilité…), les retraités et les archivés
 * n'y figurent pas — c'est la définition du backend, à rappeler à l'écran.
 *
 * `mouvements` porte sur l'**année civile** demandée, pas sur douze mois
 * glissants ; et il n'y a aucune série temporelle dans ce module (hors scope V1).
 */
export const dashboardReportingSchema = z.object({
  annee: z.number(),
  effectif: z.object({
    total: z.number(),
    stagiaires: z.number(),
    suspendus: z.number(),
    actifs: z.number(),
  }),
  repartition_statuts: z.array(itemRepartitionSchema),
  mouvements: z.object({ entrees: z.number(), sorties: z.number() }),
  masse_salariale: masseSalarialeSchema.nullable(),
  repartitions: z.record(z.string(), z.array(itemRepartitionSchema)),
});

export type DashboardReporting = z.infer<typeof dashboardReportingSchema>;

/** `GET /reporting/repartitions?axe=` — un axe à la fois (422 si axe inconnu). */
export const repartitionSchema = z.object({
  axe: z.string(),
  libelle: z.string(),
  items: z.array(itemRepartitionSchema),
});

export type Repartition = z.infer<typeof repartitionSchema>;

/** `GET /reporting/stats/conges` — congés **et** absences de l'année. */
export const statsCongesSchema = z.object({
  annee: z.number(),
  demandes: z.object({
    total: z.number(),
    par_statut: z.record(z.string(), z.number()),
    jours_poses: z.number(),
    jours_accordes: z.number(),
    par_type: z.array(itemRepartitionJoursSchema),
    en_conge_aujourd_hui: z.number(),
  }),
  absences: z.object({
    total: z.number(),
    par_statut: z.record(z.string(), z.number()),
    par_type: z.array(itemRepartitionJoursSchema),
  }),
});

export type StatsConges = z.infer<typeof statsCongesSchema>;

/** Résumé de fiches, partagé par le bloc annuel et la session courante. */
export const resumeFichesSchema = z.object({
  total: z.number(),
  par_statut: z.record(z.string(), z.number()),
  moyenne: z.number().nullable(),
  mentions: z.array(itemRepartitionSchema),
});

/** `GET /reporting/stats/evaluations`. `session_courante` est `null` hors campagne. */
export const statsEvaluationsSchema = z.object({
  annee: z.object({
    annee: z.number(),
    sessions: z.object({ total: z.number(), par_statut: z.record(z.string(), z.number()) }),
    fiches: resumeFichesSchema,
  }),
  session_courante: z
    .object({
      id: z.number(),
      statut: z.string().nullable(),
      debut_session: z.string().nullable(),
      fin_session: z.string().nullable(),
      fiches: resumeFichesSchema,
    })
    .nullable(),
});

export type StatsEvaluations = z.infer<typeof statsEvaluationsSchema>;

/** Agent cité dans une alerte (identité légère). */
export const ligneAlerteAgentSchema = z.object({
  id: z.number(),
  matricule: z.string().nullable().optional(),
  nom: z.string().nullable().optional(),
  prenom: z.string().nullable().optional(),
  nom_complet: z.string().nullable().optional(),
  statut: z.string().nullable().optional(),
});

/**
 * `GET /reporting/alertes` — six contrôles de conformité, chacun avec son
 * compteur et **les 50 premières lignes** seulement (`items` n'est pas la liste
 * complète : le détail reste sur les écrans métier).
 */
export const alerteReportingSchema = z.object({
  code: z.string(),
  libelle: z.string(),
  total: z.number(),
  items: z.array(z.record(z.string(), z.unknown())),
});

export type AlerteReporting = z.infer<typeof alerteReportingSchema>;

/**
 * `GET /reporting/effectifs` — liste derrière les cartes.
 *
 * ⚠️ Seule route **paginée** du module (`meta`), avec l'inbox des notifications :
 * deuxième exception à la règle « pas de pagination » de l'API.
 */
export const ligneEffectifSchema = z.object({
  id: z.number(),
  matricule: z.string().nullable().optional(),
  nom: z.string().nullable().optional(),
  prenom: z.string().nullable().optional(),
  nom_complet: z.string().nullable().optional(),
  statut: z.enum(STATUTS_AGENT).nullable().optional(),
  genre: z.string().nullable().optional(),
  age: z.number().nullable().optional(),
  date_naissance: z.string().nullable().optional(),
  date_prise_service: z.string().nullable().optional(),
  grade: z.string().nullable().optional(),
  fonction: z.string().nullable().optional(),
  type_integration: z.string().nullable().optional(),
  direction: z.string().nullable().optional(),
  service: z.string().nullable().optional(),
  bureau: z.string().nullable().optional(),
});

export type LigneEffectif = z.infer<typeof ligneEffectifSchema>;

export { GENRES };
