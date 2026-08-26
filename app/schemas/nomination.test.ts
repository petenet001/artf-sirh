import { describe, it, expect } from "vitest";
import {
  nominationSchema,
  nominationInputSchema,
  nominationUpdateSchema,
  nominationGroupeeInputSchema,
  lotNominationSchema,
  posteVacantSchema,
  agentsSousAutoriteSchema,
} from "./nomination";

describe("nominationSchema", () => {
  const valid = {
    id: 1,
    agent_id: 7,
    poste: "Chef de Service",
    date_debut: "2026-01-10",
    statut: "active",
  };

  it("valide une nomination correcte", () => {
    const parsed = nominationSchema.parse(valid);
    expect(parsed.id).toBe(1);
    expect(parsed.poste).toBe("Chef de Service");
  });

  it("rejette un id manquant", () => {
    const { id: _id, ...sansId } = valid;
    expect(() => nominationSchema.parse(sansId)).toThrow();
  });

  it("nominationInputSchema valide un payload de création minimal", () => {
    const parsed = nominationInputSchema.parse({
      agent_id: 7,
      poste: "Chef de Bureau",
      structurable_type: "App\\Models\\Bureau",
      structurable_id: 4,
      date_debut: "2026-01-10",
    });
    expect(parsed.poste).toBe("Chef de Bureau");
  });

  it("nominationInputSchema rejette un poste invalide", () => {
    expect(() =>
      nominationInputSchema.parse({
        agent_id: 7,
        poste: "Stagiaire",
        structurable_type: "App\\Models\\Bureau",
        structurable_id: 4,
        date_debut: "2026-01-10",
      }),
    ).toThrow();
  });

  it("nominationSchema accepte la structure morph et les libellés", () => {
    const parsed = nominationSchema.parse({
      ...valid,
      lot_nomination_id: 3,
      structure: { id: 4, nom: "Service RH", type: "Service" },
      type_acte: "decision",
      type_acte_label: "Décision",
      statut_label: "Active",
    });
    expect(parsed.structure?.nom).toBe("Service RH");
    expect(parsed.type_acte_label).toBe("Décision");
  });

  it("nominationUpdateSchema accepte une mise à jour partielle", () => {
    const parsed = nominationUpdateSchema.parse({ poste: "Chef de Bureau" });
    expect(parsed.poste).toBe("Chef de Bureau");
  });

  it("nominationGroupeeInputSchema exige au moins deux lignes", () => {
    expect(() =>
      nominationGroupeeInputSchema.parse({
        date_debut: "2026-01-10",
        agents: [
          { agent_id: 1, poste: "Chef de Service", structurable_type: "App\\Models\\Service", structurable_id: 3 },
        ],
      }),
    ).toThrow();
  });

  it("lotNominationSchema valide un lot avec ses nominations", () => {
    const parsed = lotNominationSchema.parse({
      id: 9,
      date_debut: "2026-01-10",
      type_acte: "decision",
      statut: "en_attente",
      nominations: [{ ...valid, lot_nomination_id: 9 }],
    });
    expect(parsed.nominations?.[0]?.lot_nomination_id).toBe(9);
  });

  it("posteVacantSchema valide une structure vacante", () => {
    const parsed = posteVacantSchema.parse({
      structurable_type: "App\\Models\\Bureau",
      structurable_id: 4,
      nom: "Bureau Paie",
      type: "Bureau",
      postes_possibles: ["Chef de Bureau"],
    });
    expect(parsed.postes_possibles).toContain("Chef de Bureau");
  });

  it("agentsSousAutoriteSchema valide une ligne hiérarchique", () => {
    const parsed = agentsSousAutoriteSchema.parse({
      chef: { id: 1, nom: "Dupont", prenom: "Jean" },
      nomination_active: { ...valid },
      agents: [
        {
          agent: { id: 2, nom: "Martin", prenom: "Alice" },
          affectation: { id: 10, structurable_type: "App\\Models\\Bureau", structurable_id: 4 },
        },
      ],
    });
    expect(parsed.agents).toHaveLength(1);
    expect(parsed.agents[0]?.agent.nom).toBe("Martin");
  });
});
