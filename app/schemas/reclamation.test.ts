import { describe, it, expect } from "vitest";
import { reclamationSchema, reclamationInputSchema, traitementReclamationSchema } from "./reclamation";

describe("reclamationSchema", () => {
  const valid = {
    id: 2,
    evaluation_id: 1,
    agent_id: 5,
    motif: "Je conteste la note du critère technique.",
    statut: "en_attente",
    statut_label: "En attente de traitement",
    commentaire_rh: null,
    traite_le: null,
  };

  it("valide une réclamation en attente", () => {
    expect(reclamationSchema.parse(valid).statut).toBe("en_attente");
  });

  it("accepte le bloc agent léger des listes", () => {
    const agent = { id: 5, matricule: "AG005", nom: "DUPONT", prenom: "Jean", nom_complet: "Jean DUPONT" };
    expect(reclamationSchema.parse({ ...valid, agent }).agent?.nom_complet).toBe("Jean DUPONT");
  });

  it("rejette un statut hors enum", () => {
    expect(() => reclamationSchema.parse({ ...valid, statut: "close" })).toThrow();
  });
});

describe("payloads de réclamation", () => {
  it("dépôt : motif de 10 caractères minimum (CCN art. 65)", () => {
    expect(() => reclamationInputSchema.parse({ motif: "court" })).toThrow();
    expect(reclamationInputSchema.parse({ motif: "Note incohérente avec mes résultats." }).motif).toBeTruthy();
  });

  it("traitement : `acceptee` obligatoire, commentaire libre", () => {
    expect(() => traitementReclamationSchema.parse({ commentaire: "ok" })).toThrow();
    expect(traitementReclamationSchema.parse({ acceptee: true }).acceptee).toBe(true);
  });
});
