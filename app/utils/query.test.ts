import { describe, it, expect } from "vitest";
import { normaliserQuery } from "./query";

describe("normaliserQuery", () => {
  it("convertit les booléens en 1 / 0 (filtre `where` brut côté API)", () => {
    expect(normaliserQuery({ actif: true, archive: false })).toEqual({ actif: 1, archive: 0 });
  });

  it("laisse les autres valeurs intactes", () => {
    expect(normaliserQuery({ statut: "soumise", per_page: 50, agent_id: undefined })).toEqual({
      statut: "soumise",
      per_page: 50,
      agent_id: undefined,
    });
  });

  it("renvoie la même référence quand il n'y a rien à convertir", () => {
    const q = { statut: "ouverte" };
    expect(normaliserQuery(q)).toBe(q);
    expect(normaliserQuery(undefined)).toBeUndefined();
  });
});
