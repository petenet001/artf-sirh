import { describe, it, expect } from "vitest";
import {
  dashboardReportingSchema,
  statsCongesSchema,
  statsEvaluationsSchema,
  alerteReportingSchema,
  repartitionSchema,
} from "./reporting";

describe("dashboardReportingSchema", () => {
  const valid = {
    annee: 2026,
    effectif: { total: 120, stagiaires: 8, suspendus: 2, actifs: 110 },
    repartition_statuts: [{ cle: "actif", libelle: "Actif", total: 110 }],
    mouvements: { entrees: 12, sorties: 3 },
    masse_salariale: {
      lot_id: 4,
      annee: 2026,
      mois: 8,
      periode: "août 2026",
      total_gains: 90000000,
      total_retenues: 5000000,
      total_net: 85000000,
      nb_lignes: 110,
    },
    repartitions: { genre: [{ cle: "M", libelle: "Hommes", total: 70 }], age: [] },
  };

  it("valide le dashboard complet", () => {
    const parsed = dashboardReportingSchema.parse(valid);
    expect(parsed.effectif.total).toBe(120);
    expect(parsed.masse_salariale?.periode).toBe("août 2026");
  });

  it("accepte l'absence de lot de paie clôturé", () => {
    expect(dashboardReportingSchema.parse({ ...valid, masse_salariale: null }).masse_salariale).toBeNull();
  });

  it("accueille un axe de répartition que le front ne connaît pas encore", () => {
    const parsed = dashboardReportingSchema.parse({
      ...valid,
      repartitions: { ...valid.repartitions, nouvel_axe: [{ cle: "x", libelle: "X", total: 1 }] },
    });
    expect(parsed.repartitions.nouvel_axe).toHaveLength(1);
  });
});

describe("statsCongesSchema", () => {
  it("valide congés et absences de l'année", () => {
    const parsed = statsCongesSchema.parse({
      annee: 2026,
      demandes: {
        total: 132,
        par_statut: { soumise: 12, validee_rh: 90 },
        jours_poses: 950,
        jours_accordes: 890,
        par_type: [{ cle: "Congé annuel", libelle: "Congé annuel", total: 60, jours: 540 }],
        en_conge_aujourd_hui: 7,
      },
      absences: { total: 20, par_statut: { validee: 18 }, par_type: [] },
    });
    expect(parsed.demandes.en_conge_aujourd_hui).toBe(7);
    expect(parsed.demandes.par_type[0]?.jours).toBe(540);
  });
});

describe("statsEvaluationsSchema", () => {
  const fiches = { total: 45, par_statut: { finalisee: 38 }, moyenne: 14.72, mentions: [] };

  it("valide le bloc annuel et la session courante", () => {
    const parsed = statsEvaluationsSchema.parse({
      annee: { annee: 2026, sessions: { total: 1, par_statut: { ouverte: 1 } }, fiches },
      session_courante: { id: 3, statut: "ouverte", debut_session: "2026-09-01", fin_session: null, fiches },
    });
    expect(parsed.session_courante?.fiches.moyenne).toBe(14.72);
  });

  it("accepte l'absence de campagne — l'état normal la majeure partie de l'année", () => {
    const parsed = statsEvaluationsSchema.parse({
      annee: { annee: 2026, sessions: { total: 0, par_statut: {} }, fiches: { ...fiches, moyenne: null } },
      session_courante: null,
    });
    expect(parsed.session_courante).toBeNull();
    expect(parsed.annee.fiches.moyenne).toBeNull();
  });
});

describe("alerteReportingSchema / repartitionSchema", () => {
  it("valide une alerte et ses premières lignes", () => {
    const parsed = alerteReportingSchema.parse({
      code: "sans_affiliation_cnss",
      libelle: "Agents sans affiliation CNSS active",
      total: 9,
      items: [{ id: 1, nom_complet: "Jean DUPONT" }],
    });
    expect(parsed.total).toBe(9);
  });

  it("valide une répartition sur un axe", () => {
    const parsed = repartitionSchema.parse({
      axe: "direction",
      libelle: "Direction",
      items: [{ cle: "1", libelle: "DRHL", total: 52 }],
    });
    expect(parsed.items[0]?.libelle).toBe("DRHL");
  });
});
