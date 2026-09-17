import { describe, it, expect } from "vitest";
import {
  bonificationStageSchema,
  bonificationStageInputSchema,
  traitementBonificationSchema,
} from "./bonification-stage";

describe("bonificationStageSchema", () => {
  const valid = {
    id: 1,
    agent_id: 12,
    date_debut_stage: "2025-01-01",
    date_fin_stage: "2025-11-30",
    duree_mois: 11,
    type_document: "certificat",
    reference_document: "CERT-2025-001",
    nb_echelons: 2,
    statut: "en_attente",
    statut_label: "En attente",
  };

  it("valide une demande en attente", () => {
    const parsed = bonificationStageSchema.parse(valid);
    expect(parsed.statut).toBe("en_attente");
    expect(parsed.duree_mois).toBe(11);
  });

  it("rejette un type de document hors enum", () => {
    expect(() => bonificationStageSchema.parse({ ...valid, type_document: "diplome" })).toThrow();
  });
});

describe("bonificationStageInputSchema", () => {
  it("exige agent, période et pièce justificative", () => {
    expect(() =>
      bonificationStageInputSchema.parse({ agent_id: 1, date_debut_stage: "", date_fin_stage: "2025-11-30", type_document: "certificat" }),
    ).toThrow();
    const parsed = bonificationStageInputSchema.parse({
      agent_id: 1,
      date_debut_stage: "2025-01-01",
      date_fin_stage: "2025-11-30",
      type_document: "attestation",
    });
    expect(parsed.type_document).toBe("attestation");
  });

  it("n'envoie pas la durée : elle est calculée serveur", () => {
    expect("duree_mois" in bonificationStageInputSchema.shape).toBe(false);
  });
});

describe("traitementBonificationSchema", () => {
  it("exige la décision", () => {
    expect(() => traitementBonificationSchema.parse({ commentaire: "ok" })).toThrow();
    expect(traitementBonificationSchema.parse({ approuver: true }).approuver).toBe(true);
  });
});
