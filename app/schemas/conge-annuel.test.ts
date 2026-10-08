import { describe, it, expect } from "vitest";
import {
  campagneCongeAnnuelSchema,
  campagneCongeAnnuelInputSchema,
  congeAnnuelInputSchema,
  reportCongeAnnuelSchema,
  reportCongeAnnuelInputSchema,
  refusReportSchema,
} from "./conge-annuel";
import { demandeCongeSchema } from "./demande-conge";
import { congeSoldeSchema } from "./conge-solde";

describe("campagneCongeAnnuelSchema", () => {
  const campagne = {
    id: 1,
    annee: 2026,
    date_ouverture: "2026-01-05",
    date_cloture: "2026-03-31",
    date_cloture_effective: null,
    statut: "brouillon",
    statut_label: "Brouillon",
  };

  it("valide la forme de la note FE", () => {
    expect(campagneCongeAnnuelSchema.parse(campagne).statut).toBe("brouillon");
  });

  it("rejette un statut inconnu", () => {
    expect(() => campagneCongeAnnuelSchema.parse({ ...campagne, statut: "fermee" })).toThrow();
  });
});

describe("campagneCongeAnnuelInputSchema", () => {
  it("accepte une fenêtre cohérente", () => {
    const ok = campagneCongeAnnuelInputSchema.safeParse({ annee: 2026, date_ouverture: "2026-01-05", date_cloture: "2026-03-31" });
    expect(ok.success).toBe(true);
  });

  it("refuse une clôture avant l'ouverture", () => {
    const ko = campagneCongeAnnuelInputSchema.safeParse({ annee: 2026, date_ouverture: "2026-03-31", date_cloture: "2026-01-05" });
    expect(ko.success).toBe(false);
  });
});

describe("congeAnnuelInputSchema", () => {
  it("n'exige que l'agent et la date de départ", () => {
    expect(congeAnnuelInputSchema.safeParse({ agent_id: 12, date_debut: "2026-09-07" }).success).toBe(true);
  });

  it("accepte l'origine après clôture et refuse une origine inconnue", () => {
    expect(congeAnnuelInputSchema.safeParse({ agent_id: 12, date_debut: "2026-09-07", origine: "apres_cloture" }).success).toBe(true);
    expect(congeAnnuelInputSchema.safeParse({ agent_id: 12, date_debut: "2026-09-07", origine: "hors_campagne" }).success).toBe(false);
  });

  it("refuse une date de départ vide", () => {
    expect(congeAnnuelInputSchema.safeParse({ agent_id: 12, date_debut: "" }).success).toBe(false);
  });
});

describe("reportCongeAnnuelSchema", () => {
  const report = {
    id: 1,
    agent_id: 12,
    agent: { id: 12, matricule: null, nom: "Agent", prenom: "Jean", nom_complet: "Jean Agent" },
    annee_source: 2025,
    annee_cible: 2026,
    jours: 10,
    motif: "Nécessité de service",
    statut: "propose",
    statut_label: "Proposé",
    commentaire_decision: null,
    date_decision: null,
  };

  it("valide la forme de la note FE", () => {
    expect(reportCongeAnnuelSchema.parse(report).jours).toBe(10);
  });

  it("rejette un statut inconnu", () => {
    expect(() => reportCongeAnnuelSchema.parse({ ...report, statut: "annule" })).toThrow();
  });
});

describe("reportCongeAnnuelInputSchema / refusReportSchema", () => {
  it("exige un motif de 3 caractères", () => {
    expect(reportCongeAnnuelInputSchema.safeParse({ agent_id: 12, annee_source: 2025, motif: "ok" }).success).toBe(false);
    expect(reportCongeAnnuelInputSchema.safeParse({ agent_id: 12, annee_source: 2025, motif: "Nécessité" }).success).toBe(true);
  });

  it("le refus exige un commentaire", () => {
    expect(refusReportSchema.safeParse({ commentaire: "" }).success).toBe(false);
  });
});

describe("champs ajoutés aux demandes et soldes", () => {
  it("une demande de campagne expose origine et date de reprise", () => {
    const d = demandeCongeSchema.parse({
      id: 1,
      agent_id: 12,
      type_conge_id: 1,
      campagne_conge_annuel_id: 3,
      origine: "campagne",
      origine_label: "Campagne",
      date_debut: "2026-09-07",
      date_fin: "2026-10-16",
      date_reprise: "2026-10-19",
      nb_jours: 30,
      statut: "soumise",
    });
    expect(d.date_reprise).toBe("2026-10-19");
    expect(d.origine).toBe("campagne");
  });

  it("une demande hors congé annuel garde ces champs à null", () => {
    const d = demandeCongeSchema.parse({ id: 2, agent_id: 12, type_conge_id: 2, origine: null, date_reprise: null, campagne_conge_annuel_id: null });
    expect(d.origine).toBeNull();
  });

  it("le solde expose les jours reportés", () => {
    const s = congeSoldeSchema.parse({ id: 1, agent_id: 12, type_conge_id: 1, annee: 2026, solde_initial: 40, solde_actuel: 40, jours_reportes: 10 });
    expect(s.jours_reportes).toBe(10);
  });
});
