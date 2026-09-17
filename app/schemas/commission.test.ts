import { describe, it, expect } from "vitest";
import {
  commissionSchema,
  noterCommissionSchema,
  deciderCommissionSchema,
  resultatNotationCommissionSchema,
  resultatAvancementSchema,
} from "./commission";

describe("commissionSchema", () => {
  const valid = {
    id: 1,
    session_id: 3,
    statut: "en_cours",
    statut_label: "En cours",
    date_ouverture: "2026-09-15",
    date_cloture: null,
    observations: null,
  };

  it("valide une commission ouverte", () => {
    expect(commissionSchema.parse(valid).statut).toBe("en_cours");
  });

  it("accepte la session allégée du show", () => {
    const parsed = commissionSchema.parse({
      ...valid,
      session: { id: 3, debut_session: "2026-09-01", statut: "ouverte" },
    });
    expect(parsed.session?.id).toBe(3);
  });

  it("rejette un statut hors enum", () => {
    expect(() => commissionSchema.parse({ ...valid, statut: "annulee" })).toThrow();
  });
});

describe("noterCommissionSchema", () => {
  it("borne la note harmonisée à 0–20", () => {
    expect(() => noterCommissionSchema.parse({ evaluation_id: 1, commission_note: 21 })).toThrow();
    expect(() => noterCommissionSchema.parse({ evaluation_id: 1, commission_note: -1 })).toThrow();
    expect(noterCommissionSchema.parse({ evaluation_id: 1, commission_note: 15 }).commission_note).toBe(15);
  });
});

describe("deciderCommissionSchema", () => {
  it("n'accepte que les décisions de l'enum et 0–2 échelons", () => {
    const base = { evaluation_id: 1, decision: "favorable" as const };
    expect(deciderCommissionSchema.parse({ ...base, nombre_echelons: 2 }).nombre_echelons).toBe(2);
    expect(() => deciderCommissionSchema.parse({ ...base, nombre_echelons: 3 })).toThrow();
    expect(() => deciderCommissionSchema.parse({ evaluation_id: 1, decision: "ajourne" })).toThrow();
  });
});

describe("réponses d'action", () => {
  it("notation : signale l'écart avec la note du notateur", () => {
    const parsed = resultatNotationCommissionSchema.parse({
      alerte_ecart: true,
      ecart: 6,
      message: "Note commission enregistrée.",
    });
    expect(parsed.alerte_ecart).toBe(true);
    expect(parsed.ecart).toBe(6);
  });

  it("avancement : réponse idempotente", () => {
    const parsed = resultatAvancementSchema.parse({
      avance: false,
      message: "Échelon déjà appliqué (idempotent).",
    });
    expect(parsed.avance).toBe(false);
  });
});
