import { describe, it, expect } from "vitest";
import { affiliationSocialeSchema, affiliationSocialeInputSchema } from "./affiliation-sociale";

describe("affiliationSocialeSchema", () => {
  const valid = {
    id: 1,
    agent_id: 12,
    organisme_id: 2,
    numero_affiliation: "CNSS-0012",
    date_debut: "2026-01-01",
    date_fin: null,
    statut: "active",
    statut_label: "Active",
  };

  it("valide une affiliation active", () => {
    expect(affiliationSocialeSchema.parse(valid).statut).toBe("active");
  });

  it("accepte l'organisme développé (l'API omet alors organisme_id)", () => {
    const parsed = affiliationSocialeSchema.parse({
      id: 1,
      agent_id: 12,
      organisme: { id: 2, nom: "CNSS", code: "CNSS", type: "cnss", actif: true, systeme: true },
      date_debut: "2026-01-01",
      statut: "active",
    });
    expect(parsed.organisme?.systeme).toBe(true);
    expect(parsed.organisme_id).toBeUndefined();
  });

  it("accepte l'agent avec son numéro CNSS", () => {
    const parsed = affiliationSocialeSchema.parse({
      ...valid,
      agent: { id: 12, matricule: "AG012", nom: "DUPONT", prenom: "Jean", nom_complet: "Jean DUPONT", numero_cnss: "123", statut: "actif" },
    });
    expect(parsed.agent?.numero_cnss).toBe("123");
  });

  it("rejette un statut hors enum", () => {
    expect(() => affiliationSocialeSchema.parse({ ...valid, statut: "resiliee" })).toThrow();
  });
});

describe("affiliationSocialeInputSchema", () => {
  it("laisse le numéro facultatif (repris de l'agent pour la CNSS)", () => {
    const parsed = affiliationSocialeInputSchema.parse({
      agent_id: 1,
      organisme_id: 2,
      date_debut: "2026-01-01",
    });
    expect(parsed.numero_affiliation).toBeUndefined();
  });

  it("exige la date de début", () => {
    expect(() =>
      affiliationSocialeInputSchema.parse({ agent_id: 1, organisme_id: 2, date_debut: "" }),
    ).toThrow();
  });
});
