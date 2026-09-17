import { describe, it, expect } from "vitest";
import { avisHierarchiqueSchema, avisHierarchiqueInputSchema, niveauRequisSchema } from "./avis-hierarchique";

describe("avisHierarchiqueSchema", () => {
  const valid = {
    id: 3,
    evaluation_id: 12,
    niveau: "directeur",
    niveau_label: "Directeur",
    ordre: 1,
    avis: "Appréciation favorable.",
    approuve: true,
    observations: null,
    signe: false,
    date_signature: null,
  };

  it("valide un avis non signé", () => {
    const parsed = avisHierarchiqueSchema.parse(valid);
    expect(parsed.niveau).toBe("directeur");
    expect(parsed.signe).toBe(false);
  });

  it("accepte un avis sans prise de position (`approuve` null)", () => {
    expect(avisHierarchiqueSchema.parse({ ...valid, approuve: null }).approuve).toBeNull();
  });

  it("accepte le signataire une fois l'avis signé", () => {
    const parsed = avisHierarchiqueSchema.parse({
      ...valid,
      signe: true,
      date_signature: "2026-09-16 10:00:00",
      signe_par: { id: 4, name: "Marie MARTIN" },
    });
    expect(parsed.signe_par?.name).toBe("Marie MARTIN");
  });

  it("rejette un niveau hors chaîne hiérarchique", () => {
    expect(() => avisHierarchiqueSchema.parse({ ...valid, niveau: "DRHL" })).toThrow();
  });
});

describe("avisHierarchiqueInputSchema", () => {
  it("exige le niveau visé", () => {
    expect(() => avisHierarchiqueInputSchema.parse({ avis: "RAS" })).toThrow();
    expect(avisHierarchiqueInputSchema.parse({ niveau: "chef_service" }).niveau).toBe("chef_service");
  });
});

describe("niveauRequisSchema", () => {
  it("valide un maillon de la chaîne renvoyée par niveaux-requis", () => {
    const parsed = niveauRequisSchema.parse({ niveau: "chef_service", label: "Chef de Service" });
    expect(parsed.label).toBe("Chef de Service");
  });

  it("rejette un niveau inconnu", () => {
    expect(() => niveauRequisSchema.parse({ niveau: "DRHL", label: "DRHL" })).toThrow();
  });
});
