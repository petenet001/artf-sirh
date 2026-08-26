import { describe, it, expect } from "vitest";
import { carriereAgentSchema } from "./carriere-agent";

describe("carriereAgentSchema", () => {
  const valid = {
    id: 7,
    matricule: "ARTF-0007",
    nom: "Dupont",
    prenom: "Jean",
    statut: "actif",
    contrat_actif: null,
    affectation_active: null,
    nomination_active: null,
    salaire_actuel: null,
  };

  it("valide une synthèse aux blocs vides", () => {
    const parsed = carriereAgentSchema.parse(valid);
    expect(parsed.id).toBe(7);
    expect(parsed.affectation_active).toBeNull();
  });

  it("valide une synthèse avec affectation et nomination actives", () => {
    const parsed = carriereAgentSchema.parse({
      ...valid,
      affectation_active: {
        id: 1,
        structurable_type: "App\\Models\\Service",
        structurable_id: 3,
        statut: "active",
      },
      nomination_active: {
        id: 2,
        poste: "Chef de Service",
        statut: "active",
      },
    });
    expect(parsed.affectation_active?.id).toBe(1);
    expect(parsed.nomination_active?.poste).toBe("Chef de Service");
  });

  it("rejette un nom manquant", () => {
    const { nom: _nom, ...sansNom } = valid;
    expect(() => carriereAgentSchema.parse(sansNom)).toThrow();
  });
});
