import { describe, it, expect } from "vitest";
import {
  demandeCongeSchema,
  demandeCongeInputSchema,
  decisionCongeSchema,
  rejetCongeSchema,
} from "./demande-conge";

describe("demandeCongeSchema", () => {
  const valid = {
    id: 1,
    agent_id: 12,
    type_conge_id: 1,
    date_debut: "2026-09-07",
    date_fin: "2026-09-11",
    nb_jours: 4,
    motif: null,
    statut: "soumise",
    statut_label: "Soumise",
    prochaine_etape: "valider-n1",
    justificatif: null,
  };

  it("valide une demande correcte", () => {
    const parsed = demandeCongeSchema.parse(valid);
    expect(parsed.statut).toBe("soumise");
    expect(parsed.prochaine_etape).toBe("valider-n1");
    expect(parsed.nb_jours).toBe(4);
  });

  it("accepte un prochaine_etape null (circuit terminé)", () => {
    const parsed = demandeCongeSchema.parse({ ...valid, prochaine_etape: null, statut: "validee_rh" });
    expect(parsed.prochaine_etape).toBeNull();
  });

  it("accepte un justificatif { nom }", () => {
    const parsed = demandeCongeSchema.parse({ ...valid, justificatif: { nom: "certificat.pdf" } });
    expect(parsed.justificatif?.nom).toBe("certificat.pdf");
  });

  it("accepte le justificatif avec son url de téléchargement", () => {
    const parsed = demandeCongeSchema.parse({
      ...valid,
      justificatif: { nom: "certificat.pdf", url: "/api/conges/demandes/1/justificatif" },
    });
    expect(parsed.justificatif?.url).toBe("/api/conges/demandes/1/justificatif");
  });

  it("accepte le statut annulee (retrait par le demandeur)", () => {
    const parsed = demandeCongeSchema.parse({ ...valid, statut: "annulee", prochaine_etape: null });
    expect(parsed.statut).toBe("annulee");
  });

  it("accepte le bloc agent léger des listes (ou null)", () => {
    const agent = { id: 12, matricule: null, nom: "Agent", prenom: "Jean", nom_complet: "Jean Agent" };
    expect(demandeCongeSchema.parse({ ...valid, agent }).agent?.nom_complet).toBe("Jean Agent");
    expect(demandeCongeSchema.parse({ ...valid, agent: null }).agent).toBeNull();
  });

  it("rejette un statut hors enum", () => {
    expect(() => demandeCongeSchema.parse({ ...valid, statut: "brouillon" })).toThrow();
  });
});

describe("demandeCongeInputSchema", () => {
  it("valide un payload minimal et exclut nb_jours / statut", () => {
    const shape = demandeCongeInputSchema.shape;
    expect("nb_jours" in shape).toBe(false);
    expect("statut" in shape).toBe(false);
    const parsed = demandeCongeInputSchema.parse({
      agent_id: 12,
      type_conge_id: 1,
      date_debut: "2026-09-07",
      date_fin: "2026-09-11",
    });
    expect(parsed.agent_id).toBe(12);
  });

  it("rejette une date_debut vide", () => {
    expect(() =>
      demandeCongeInputSchema.parse({ agent_id: 1, type_conge_id: 1, date_debut: "", date_fin: "2026-09-11" }),
    ).toThrow();
  });
});

describe("decisionCongeSchema / rejetCongeSchema", () => {
  it("decision : commentaire optionnel", () => {
    expect(decisionCongeSchema.parse({}).commentaire).toBeUndefined();
  });

  it("rejet : commentaire requis (min. 3)", () => {
    expect(() => rejetCongeSchema.parse({ commentaire: "ok" })).toThrow();
    expect(rejetCongeSchema.parse({ commentaire: "Trop tôt" }).commentaire).toBe("Trop tôt");
  });
});
