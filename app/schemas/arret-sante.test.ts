import { describe, it, expect } from "vitest";
import { arretSanteSchema, arretSanteInputSchema } from "./arret-sante";

describe("arretSanteSchema", () => {
  const base = {
    id: 3,
    agent_id: 12,
    nature: "accident_travail",
    nature_label: "Accident du travail",
    article_ccn: "art. 133",
    statut: "soumise",
    prochaine_etape: "instruire",
    date_fait: "2026-07-01",
    date_debut: "2026-07-02",
    structure_sanitaire_id: 4,
  };

  it("valide un arrêt tel que renvoyé en liste", () => {
    expect(arretSanteSchema.parse(base).nature).toBe("accident_travail");
  });

  it("accepte un arrêt encore ouvert (`date_fin` nulle)", () => {
    expect(arretSanteSchema.parse({ ...base, date_fin: null }).date_fin).toBeNull();
  });

  it("porte l'indemnisation en mois, plein puis demi-traitement", () => {
    const a = arretSanteSchema.parse({
      ...base,
      nb_mois: 3,
      nb_mois_majoration: 3,
      montant_mensuel: 450_000,
      montant_mensuel_demi: 225_000,
    });
    expect(a.nb_mois).toBe(3);
    expect(a.montant_mensuel_demi).toBe(225_000);
  });

  it("garde le lien vers la demande de congé correspondante", () => {
    expect(arretSanteSchema.parse({ ...base, demande_conge_id: 88 }).demande_conge_id).toBe(88);
  });

  it("refuse une nature inconnue de la CCN", () => {
    expect(() => arretSanteSchema.parse({ ...base, nature: "burn_out" })).toThrow();
  });
});

describe("arretSanteInputSchema", () => {
  const base = {
    agent_id: 12,
    nature: "maladie",
    date_fait: "2026-07-01",
    date_debut: "2026-07-02",
    structure_sanitaire_id: 4,
  };

  it("valide le minimum exigé par l'API", () => {
    expect(arretSanteInputSchema.parse(base).structure_sanitaire_id).toBe(4);
  });

  it("exige la structure sanitaire : un arrêt se constate quelque part", () => {
    const { structure_sanitaire_id: _, ...sans } = base;
    expect(() => arretSanteInputSchema.parse(sans)).toThrow();
  });

  it("exige une date de début", () => {
    expect(() => arretSanteInputSchema.parse({ ...base, date_debut: "" })).toThrow();
  });

  it("laisse la date de notification facultative", () => {
    expect(arretSanteInputSchema.parse(base).date_notification).toBeUndefined();
  });
});
